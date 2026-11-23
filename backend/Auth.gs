/**
 * FoodHub — autenticación de usuarios internos (igual que TalentHub).
 *
 * 1. auth.requestCode: si el correo está activo en SYS_Usuarios, se le envía un código de 6 dígitos
 *    (vence en 10 min, 5 intentos, máximo 5 códigos por hora). La respuesta es la misma exista o no
 *    el correo, para no revelar quién tiene acceso.
 * 2. auth.verifyCode: valida el código y emite un token de sesión propio (256 bits).
 *    - "Recordar este equipo": 30 días.
 *    - Sin marcar (por ejemplo la tablet compartida): 6 horas.
 * Solo se guardan huellas (SHA-256 con PEPPER) de códigos y tokens, nunca el valor.
 */

var CODE_SENT_MSG = 'Si tu correo está dado de alta, en un momento te llega un código de 6 dígitos. Revisa también el correo no deseado.';

function cacheJson_(key) {
  var v = CacheService.getScriptCache().get(key);
  return v ? JSON.parse(v) : null;
}

function cachePutJson_(key, obj, seconds) {
  CacheService.getScriptCache().put(key, JSON.stringify(obj), Math.max(1, Math.min(Math.floor(seconds), 21600)));
}

function normEmail_(email) {
  var e = String(email || '').trim().toLowerCase();
  if (e.length > 120 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e)) {
    throw new AppError('VALIDACION', 'Escribe un correo válido.');
  }
  return e;
}

function randomCode_() {
  var n = parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 1000000;
  return ('00000' + n).slice(-6);
}

/** Cuenta eventos por clave dentro de una ventana; lanza error al pasar el máximo. */
function rateLimit_(key, max, seconds, message) {
  var k = 'rl:' + hashToken_(key);
  withLock_(function () {
    var cur = cacheJson_(k) || { n: 0, fin: Date.now() + seconds * 1000 };
    if (cur.n >= max) throw new AppError('LIMITE', message, 429);
    cur.n++;
    cachePutJson_(k, cur, (cur.fin - Date.now()) / 1000);
  });
}

function requestCode_(email) {
  var e = normEmail_(email);
  rateLimit_('code|' + e, APP.CODES_PER_HOUR, 3600, 'Ya pediste varios códigos. Espera un rato antes de pedir otro.');
  var user = activeUserByEmail_(e);
  if (!user) {
    logEvent_(e, 'login.codigo.rechazado', 'usuario', e, null, null);
    return { mensaje: CODE_SENT_MSG };
  }
  if (MailApp.getRemainingDailyQuota() < 1) {
    throw new AppError('CUOTA', 'Hoy ya no se pueden enviar más correos desde FoodHub. Intenta mañana o avisa al administrador.', 503);
  }
  var code = randomCode_();
  cachePutJson_('otp:' + hashToken_(e), { h: hashToken_(e + '|' + code), i: 0, fin: Date.now() + APP.CODE_MINUTES * 60000 },
    APP.CODE_MINUTES * 60);
  MailApp.sendEmail({
    to: e,
    subject: 'FoodHub: tu código de acceso es ' + code,
    name: 'FoodHub',
    body: 'Hola ' + user.nombre + ', usa este código para entrar a FoodHub: ' + code +
      '\n\nVence en ' + APP.CODE_MINUTES + ' minutos. Si tú no lo pediste, ignora este correo.',
    htmlBody: '<p>Hola ' + escHtml_(user.nombre) + ', usa este código para entrar a FoodHub:</p>' +
      '<p style="font-size:28px;font-weight:bold;letter-spacing:6px">' + code + '</p>' +
      '<p>Vence en ' + APP.CODE_MINUTES + ' minutos. Si tú no lo pediste, ignora este correo.</p>'
  });
  logEvent_(user.correo, 'login.codigo', 'usuario', user.usuario_id, null, null);
  return { mensaje: CODE_SENT_MSG };
}

function escHtml_(s) {
  return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

function verifyCode_(email, code, recordar, dispositivo) {
  var e = normEmail_(email);
  var c = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) throw new AppError('VALIDACION', 'El código tiene 6 números.');
  var key = 'otp:' + hashToken_(e);
  var r = withLock_(function () {
    var p = cacheJson_(key);
    if (!p || p.fin < Date.now()) return { error: 'VENCIDO' };
    if (p.h === hashToken_(e + '|' + c)) { CacheService.getScriptCache().remove(key); return { error: '' }; }
    p.i++;
    if (p.i >= APP.CODE_ATTEMPTS) { CacheService.getScriptCache().remove(key); return { error: 'BLOQUEADO', i: p.i }; }
    cachePutJson_(key, p, (p.fin - Date.now()) / 1000);
    return { error: 'INCORRECTO', i: p.i };
  });
  if (r.error === 'VENCIDO') throw new AppError('CODIGO', 'El código venció o ya se usó. Pide uno nuevo.', 401);
  if (r.error) {
    logEvent_(e, 'login.codigo.incorrecto', 'usuario', e, null, { intento: r.i });
    if (r.error === 'BLOQUEADO') throw new AppError('CODIGO', 'Demasiados intentos. Pide un código nuevo.', 401);
    var left = APP.CODE_ATTEMPTS - r.i;
    throw new AppError('CODIGO', 'El código no es correcto. Te ' + (left === 1 ? 'queda 1 intento.' : 'quedan ' + left + ' intentos.'), 401);
  }
  var user = activeUserByEmail_(e);
  if (!user) throw new AppError('NO_AUTORIZADO', 'Tu correo ya no tiene acceso. Consulta al administrador.', 403);
  return startSession_(user, recordar === true, dispositivo);
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

function startSession_(user, recordar, dispositivo) {
  var token = randomToken_();
  var hash = hashToken_(token);
  var now = new Date();
  var vence = recordar
    ? new Date(now.getTime() + APP.SESSION_REMEMBER_DAYS * 86400 * 1000)
    : new Date(now.getTime() + APP.SESSION_HOURS * 3600 * 1000);
  var ses = {
    sesion_id: uid_('SES'), usuario_id: user.usuario_id, token_hash: hash,
    recordar: recordar ? 'SI' : 'NO', emitida: isoDate_(now), vence: isoDate_(vence),
    ultimo_uso: isoDate_(now), revocada: 'NO', dispositivo: String(dispositivo || '').slice(0, 120)
  };
  insert_('SYS_Sesiones', ses);
  cacheSession_(hash, ses);
  logEvent_(user.correo, 'login', 'sesion', ses.sesion_id, null, { recordar: ses.recordar });
  return { session: token, vence: ses.vence, recordar: recordar, me: profile_(user) };
}

function cacheSession_(hash, ses) {
  var data = { sesion_id: ses.sesion_id, usuario_id: ses.usuario_id, vence: ses.vence };
  CacheService.getScriptCache().put('ses:' + hash, JSON.stringify(data), APP.CACHE_SESSION_SEC);
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
