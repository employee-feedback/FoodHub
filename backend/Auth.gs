/**
 * FoodHub — autenticación de usuarios internos.
 *
 * 1. El frontend obtiene un ID token con Google Identity Services y llama auth.login.
 * 2. Se verifica el token con Google (firma, audiencia, emisor, vigencia, correo verificado).
 * 3. El correo debe existir y estar activo en SYS_Usuarios.
 * 4. Se emite un token de sesión propio (256 bits). En la hoja solo se guarda su hash.
 *    - Escritorio: 30 días.
 *    - Equipo compartido (tablet): se cierra tras 10 min sin uso; tope de 12 h.
 */

function verifyGoogleIdToken_(idToken) {
  if (!idToken || typeof idToken !== 'string' || idToken.length > 4096) {
    throw new AppError('AUTH', 'No se recibió una credencial de Google válida.', 401);
  }
  var res = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken),
    { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new AppError('AUTH', 'Google no validó la credencial. Vuelve a iniciar sesión.', 401);
  var p = JSON.parse(res.getContentText());
  var clientId = requireProp_('GOOGLE_CLIENT_ID');
  var issOk = p.iss === 'accounts.google.com' || p.iss === 'https://accounts.google.com';
  var expOk = Number(p.exp) * 1000 > Date.now();
  var verified = p.email_verified === true || p.email_verified === 'true';
  if (p.aud !== clientId || !issOk || !expOk || !verified || !p.email) {
    throw new AppError('AUTH', 'La credencial de Google no corresponde a esta aplicación o ya venció.', 401);
  }
  return { email: String(p.email).toLowerCase(), name: p.name || '' };
}

function randomToken_() {
  var seed = Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid() + Date.now() + Math.random();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, seed, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function hashToken_(token) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token + '|' + requireProp_('PEPPER'), Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function activeUserByEmail_(email) {
  var users = cachedAll_('SYS_Usuarios', APP.CACHE_USERS_SEC);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].correo).toLowerCase() === email && users[i].activo === 'SI') return users[i];
  }
  return null;
}

function activeUserById_(id) {
  var users = cachedAll_('SYS_Usuarios', APP.CACHE_USERS_SEC);
  for (var i = 0; i < users.length; i++) if (users[i].usuario_id === id && users[i].activo === 'SI') return users[i];
  return null;
}

function login_(idToken, compartido, dispositivo) {
  var g = verifyGoogleIdToken_(idToken);
  var user = activeUserByEmail_(g.email);
  if (!user) {
    logEvent_(g.email, 'login.rechazado', 'usuario', g.email, null, null);
    throw new AppError('NO_AUTORIZADO', 'Tu correo ' + g.email + ' no está dado de alta en FoodHub. Pide acceso al administrador.', 403);
  }
  var token = randomToken_();
  var hash = hashToken_(token);
  var now = new Date();
  var vence = compartido
    ? new Date(now.getTime() + APP.SESSION_SHARED_MAX_HOURS * 3600 * 1000)
    : new Date(now.getTime() + APP.SESSION_DAYS_DESKTOP * 86400 * 1000);
  var ses = {
    sesion_id: uid_('SES'), usuario_id: user.usuario_id, token_hash: hash,
    compartido: compartido ? 'SI' : 'NO', emitida: isoDate_(now), vence: isoDate_(vence),
    ultimo_uso: isoDate_(now), revocada: 'NO', dispositivo: String(dispositivo || '').slice(0, 120)
  };
  insert_('SYS_Sesiones', ses);
  cacheSession_(hash, ses);
  if (compartido) touchShared_(hash);
  logEvent_(user.correo, 'login', 'sesion', ses.sesion_id, null, { compartido: ses.compartido });
  return { session: token, vence: ses.vence, compartido: !!compartido, me: profile_(user) };
}

function cacheSession_(hash, ses) {
  var data = { sesion_id: ses.sesion_id, usuario_id: ses.usuario_id, compartido: ses.compartido, vence: ses.vence };
  CacheService.getScriptCache().put('ses:' + hash, JSON.stringify(data), APP.CACHE_SESSION_SEC);
}

function touchShared_(hash) {
  CacheService.getScriptCache().put('act:' + hash, '1', APP.SESSION_SHARED_IDLE_SEC);
}

/** Devuelve el usuario de una sesión válida o lanza AUTH. Se llama en cada petición. */
function sessionUser_(token) {
  if (!token || typeof token !== 'string' || token.length > 200) throw new AppError('AUTH', 'Tu sesión terminó. Vuelve a entrar.', 401);
  var hash = hashToken_(token);
  var cache = CacheService.getScriptCache();
  var hit = cache.get('ses:' + hash);
  var ses = hit ? JSON.parse(hit) : null;
  if (!ses) {
    var row = findBy_('SYS_Sesiones', 'token_hash', hash);
    if (!row || row.revocada === 'SI') throw new AppError('AUTH', 'Tu sesión terminó. Vuelve a entrar.', 401);
    ses = row;
    cacheSession_(hash, ses);
  }
  if (Date.parse(ses.vence) <= Date.now()) {
    endSession_(hash, ses.sesion_id);
    throw new AppError('AUTH', 'Tu sesión venció. Vuelve a entrar.', 401);
  }
  if (ses.compartido === 'SI') {
    if (!cache.get('act:' + hash)) {
      endSession_(hash, ses.sesion_id);
      throw new AppError('AUTH', 'La sesión se cerró por 10 minutos sin uso.', 401);
    }
    touchShared_(hash);
  }
  var user = activeUserById_(ses.usuario_id);
  if (!user) {
    endSession_(hash, ses.sesion_id);
    throw new AppError('AUTH', 'Tu usuario ya no tiene acceso. Consulta al administrador.', 401);
  }
  user._sesion_id = ses.sesion_id;
  user._hash = hash;
  return user;
}

function endSession_(hash, sesionId) {
  var cache = CacheService.getScriptCache();
  cache.remove('ses:' + hash);
  cache.remove('act:' + hash);
  try { update_('SYS_Sesiones', sesionId, { revocada: 'SI' }); } catch (e) { /* ya no existe */ }
}

function logout_(user) {
  endSession_(user._hash, user._sesion_id);
  logEvent_(user.correo, 'logout', 'sesion', user._sesion_id, null, null);
  return { ok: true };
}

/** Lo que el frontend necesita saber del usuario para dibujar menús. No es una autorización. */
function profile_(user) {
  var role = ROLES[user.rol] || { nombre: '?', permisos: [] };
  var perms = role.permisos.indexOf('*') >= 0 ? ['*'] : role.permisos;
  return {
    usuario_id: user.usuario_id, correo: user.correo, nombre: user.nombre,
    rol: user.rol, rol_nombre: role.nombre, plantas: userPlants_(user), permisos: perms,
    pantallas: SCREENS.filter(function (s) { return hasPerm_(user, s[1]); }).map(function (s) { return s[0]; })
  };
}
