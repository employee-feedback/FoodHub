/**
 * FoodHub — API. Un solo punto de entrada (doPost) con enrutador por acción.
 *
 * Petición (POST, Content-Type: text/plain para evitar la verificación previa de CORS):
 *   { "action": "auth.me", "session": "<token>", "requestId": "<uuid>", "payload": { ... } }
 * Respuesta:
 *   { "ok": true, "data": ... }  |  { "ok": false, "error": { "code": "...", "message": "..." } }
 *
 * Apps Script no permite fijar códigos HTTP: el estado va en el cuerpo.
 */

var ROUTES = {
  // acción: [permiso | null (pública) | 'session' (cualquier sesión válida), función, ¿escritura idempotente?]
  'sys.health':        [null, apiHealth_, false],
  'auth.requestCode':  [null, function (p) { return requestCode_(p.correo); }, false],
  'auth.verifyCode':   [null, function (p) { return verifyCode_(p.correo, p.codigo, p.recordar, p.dispositivo); }, false],
  'auth.logout':       ['session', function (u) { return logout_(u); }, false],
  'auth.me':           ['session', function (u) { return profile_(u); }, false],
  'catalog.get':       ['catalogo.ver', apiCatalog_, false],
  'admin.users.list':  ['usuarios.administrar', apiUsersList_, false],
  'admin.users.save':  ['usuarios.administrar', apiUsersSave_, true],
  'admin.sessions.revokeUser': ['usuarios.administrar', apiRevokeUser_, true],
  'admin.log.list':    ['bitacora.ver', apiLogList_, false],
  'inc.create':        ['incidencia.crear', apiIncCreate_, true],
  'inc.list':          ['incidencia.ver', apiIncList_, false],
  'inc.get':           ['incidencia.ver', apiIncGet_, false],
  'inc.summary':       ['incidencia.ver', apiIncSummary_, false],
  'inc.action':        ['incidencia.ver', apiIncAction_, true],      // cada acción revisa su propio permiso
  'inc.evidence.add':  ['evidencia.subir', apiEvidAdd_, true],
  'inc.evidence.get':  ['incidencia.ver', apiEvidGet_, false],
  'inc.evidence.retire': ['incidencia.ver', apiEvidRetire_, true]
};

function doGet() {
  return json_({ ok: true, data: apiHealth_() });
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: { code: 'BAD_REQUEST', message: 'La petición no es JSON válido.' } });
  }
  try {
    return json_({ ok: true, data: handle_(req) });
  } catch (err) {
    if (err instanceof AppError) return json_({ ok: false, error: { code: err.code, message: err.message } });
    console.error(err && err.stack || err);
    return json_({ ok: false, error: { code: 'INTERNAL', message: 'Ocurrió un error inesperado. Ya quedó registrado; intenta de nuevo.' } });
  }
}

function handle_(req) {
  var action = String(req.action || '');
  var route = ROUTES[action];
  if (!route) throw new AppError('BAD_REQUEST', 'Acción desconocida: ' + action);
  var payload = req.payload && typeof req.payload === 'object' ? req.payload : {};
  if (route[0] === null) return route[1](payload, req);

  var user = sessionUser_(req.session);
  if (route[0] !== 'session' && !hasPerm_(user, route[0])) {
    throw new AppError('FORBIDDEN', 'Tu rol no tiene permiso para esta acción.', 403);
  }
  if (!route[2]) return route[1](user, payload, req);
  return idempotent_(String(req.requestId || ''), action, user, function () { return route[1](user, payload, req); });
}

/** Si la misma petición llega dos veces (doble clic, reintento), se devuelve el primer resultado. */
function idempotent_(requestId, action, user, fn) {
  if (!/^[A-Za-z0-9-]{16,64}$/.test(requestId)) throw new AppError('BAD_REQUEST', 'Falta requestId en una operación de escritura.');
  var cache = CacheService.getScriptCache();
  var key = 'idem:' + requestId;
  var hit = cache.get(key);
  if (hit) return JSON.parse(hit);
  return withLock_(function () {
    var prev = findBy_('SYS_Idempotencia', 'request_id', requestId);
    if (prev) return JSON.parse(prev.resultado || 'null');
    var result = fn();
    var json = JSON.stringify(result === undefined ? null : result);
    insert_('SYS_Idempotencia', {
      request_id: requestId, accion: action, usuario_id: user.usuario_id, resultado: json.length < 45000 ? json : '{"ok":true}',
      expira: isoDate_(new Date(Date.now() + APP.IDEMPOTENCY_HOURS * 3600 * 1000))
    });
    if (json.length < 90000) cache.put(key, json, 3600);
    return result;
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- acciones ----------

function apiHealth_() {
  return { app: APP.NAME, version: APP.VERSION, time: nowIso_(), configured: !!prop_('DB_ID') };
}

/** Catálogos filtrados por las plantas del usuario. */
function apiCatalog_(user) {
  var plants = userPlants_(user);
  var inScope = function (r) { return r.activo !== 'NO' && (plants === '*' || plants.indexOf(r.planta_id) >= 0); };
  var active = function (r) { return r.activo !== 'NO'; };
  return {
    plantas: cachedAll_('CAT_Plantas').filter(function (r) { return plants === '*' || plants.indexOf(r.planta_id) >= 0; }).map(strip_),
    servicios: cachedAll_('CAT_Servicios').filter(inScope).map(strip_),
    turnosConcesionario: cachedAll_('CAT_TurnosConcesionario').filter(inScope).map(strip_),
    plantilla: cachedAll_('CAT_PlantillaRequerida').filter(inScope).map(strip_),
    puestos: cachedAll_('CAT_Puestos').filter(active).map(strip_),
    categorias: cachedAll_('CAT_Categorias').filter(active).map(strip_),
    tipos: cachedAll_('CAT_TiposIncidencia').filter(active).map(strip_),
    criterios: cachedAll_('CAT_Criterios').filter(active).map(strip_),
    auditoriaSecciones: cachedAll_('AUD_Secciones').filter(active).map(strip_),
    auditoriaPuntos: cachedAll_('AUD_Puntos').filter(active).map(strip_),
    indicadores: cachedAll_('IND_Indicadores').filter(active).map(strip_),
    campos: TIPO_CAMPOS,
    comensalesObligatorios: COMENSALES_OBLIGATORIOS
  };
}

function strip_(r) {
  var o = {};
  Object.keys(r).forEach(function (k) { if (k.charAt(0) !== '_' && STD.indexOf(k) < 0) o[k] = r[k]; });
  return o;
}

function apiUsersList_() {
  return all_('SYS_Usuarios').map(function (u) {
    return { usuario_id: u.usuario_id, correo: u.correo, nombre: u.nombre, rol: u.rol, plantas: u.plantas, activo: u.activo, version: Number(u.version) };
  });
}

function apiUsersSave_(admin, p) {
  var correo = String(p.correo || '').trim().toLowerCase();
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(correo)) throw new AppError('VALIDATION', 'Escribe un correo válido.');
  if (!ROLES[p.rol]) throw new AppError('VALIDATION', 'Elige un rol válido.');
  var validPlants = all_('CAT_Plantas').map(function (r) { return r.planta_id; });
  var plantas = p.rol === 'adm' ? '*' : String(p.plantas || '').split(',').map(function (s) { return s.trim(); }).filter(String);
  if (plantas !== '*') {
    if (!plantas.length) throw new AppError('VALIDATION', 'Asigna al menos una planta.');
    plantas.forEach(function (x) { if (x !== '*' && validPlants.indexOf(x) < 0) throw new AppError('VALIDATION', 'Planta desconocida: ' + x); });
    plantas = plantas.indexOf('*') >= 0 ? '*' : plantas.join(',');
  }
  var activo = p.activo === 'NO' ? 'NO' : 'SI';
  var nombre = String(p.nombre || '').trim().slice(0, 120);
  var existing = findBy_('SYS_Usuarios', 'correo', correo);

  if (p.usuario_id) {
    if (existing && existing.usuario_id !== p.usuario_id) throw new AppError('VALIDATION', 'Ese correo ya pertenece a otro usuario.');
    if (p.usuario_id === admin.usuario_id && (activo === 'NO' || p.rol !== 'adm')) {
      throw new AppError('VALIDATION', 'No puedes quitarte a ti mismo el rol de administrador ni desactivarte.');
    }
    var res = update_('SYS_Usuarios', p.usuario_id, { correo: correo, nombre: nombre, rol: p.rol, plantas: plantas, activo: activo }, admin.correo, p.version);
    if (activo === 'NO') revokeUserSessions_(p.usuario_id);
    logEvent_(admin.correo, 'usuario.actualizar', 'usuario', p.usuario_id, res.before, strip_(res.after));
    return { usuario_id: p.usuario_id, version: Number(res.after.version) };
  }
  if (existing) throw new AppError('VALIDATION', 'Ese correo ya está dado de alta.');
  var u = insert_('SYS_Usuarios', { usuario_id: uid_('USR'), correo: correo, nombre: nombre, rol: p.rol, plantas: plantas, activo: activo }, admin.correo);
  logEvent_(admin.correo, 'usuario.crear', 'usuario', u.usuario_id, null, strip_(u));
  return { usuario_id: u.usuario_id, version: 1 };
}

function apiRevokeUser_(admin, p) {
  var n = revokeUserSessions_(String(p.usuario_id || ''));
  logEvent_(admin.correo, 'sesiones.revocar', 'usuario', p.usuario_id, null, { sesiones: n });
  return { revocadas: n };
}

function revokeUserSessions_(usuarioId) {
  var n = 0;
  all_('SYS_Sesiones').forEach(function (s) {
    if (s.usuario_id === usuarioId && s.revocada !== 'SI') { endSession_(s.token_hash, s.sesion_id); n++; }
  });
  return n;
}

function apiLogList_(user, p) {
  var rows = all_('SYS_Bitacora');
  var limit = Math.min(Number(p.limit) || 100, 500);
  return rows.slice(-limit).reverse().map(strip_);
}
