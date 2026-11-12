/*
 * Pruebas locales del backend de FoodHub con simulaciones en memoria de los servicios de Google.
 * No sustituyen la prueba real en Apps Script, pero verifican la lógica: sesiones, permisos,
 * idempotencia, control de versión y protección contra fórmulas.
 *
 * Uso: node tools/test/harness.js
 */
const crypto = require('crypto');
const sim = require('./gas-sim');
const { ctx, vm, books, props, cache, google } = sim;
const advance = sim.advance;
// ---------- utilidades de prueba ----------
let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  ok   ' + name); } else { fail++; console.log('  FALLA ' + name + (extra ? ' → ' + JSON.stringify(extra) : '')); }
}
function call(action, payload, session, requestId) {
  return JSON.parse(sim.post({ action, payload, session, requestId }));
}
const rid = () => crypto.randomUUID();


// ---------- pruebas ----------
console.log('Instalación');
props.GOOGLE_CLIENT_ID = 'client-123';
props.ADMIN_EMAIL = 'admin@ejemplo.com';
const rep = vm.runInContext('setup()', ctx);
check('setup crea la base y el administrador', rep.some(l => l.includes('Administrador creado')), rep);
const rep2 = vm.runInContext('setup()', ctx);
check('setup es repetible y no duplica catálogos', !rep2.some(l => l.includes('Catálogo cargado')) && !rep2.some(l => l.includes('Administrador creado')));
const main = books[props.DB_ID];
check('catálogo de servicios cargado (41)', main.getSheetByName('CAT_Servicios').getLastRow() - 1 === 41);
check('PEPPER generado', (props.PEPPER || '').length > 40);

console.log('Inicio de sesión');
check('health responde sin sesión', call('sys.health').ok === true);
let r = call('auth.login', { idToken: google('desconocido@ejemplo.com') });
check('rechaza correo no dado de alta', !r.ok && r.error.code === 'NO_AUTORIZADO', r);
r = call('auth.login', { idToken: google('admin@ejemplo.com', { aud: 'otro-cliente' }) });
check('rechaza token de otra aplicación', !r.ok && r.error.code === 'AUTH', r);
r = call('auth.login', { idToken: google('admin@ejemplo.com', { email_verified: 'false' }) });
check('rechaza correo no verificado', !r.ok && r.error.code === 'AUTH');
r = call('auth.login', { idToken: google('ADMIN@ejemplo.com') });
check('administrador entra (sin importar mayúsculas)', r.ok && r.data.me.rol === 'adm', r);
const adm = r.data.session;
check('token de sesión largo (≥ 43 caracteres)', adm.length >= 43);
const sesSheet = main.getSheetByName('SYS_Sesiones').data;
check('la hoja guarda el hash, nunca el token', !JSON.stringify(sesSheet).includes(adm));
r = call('auth.me', {}, adm);
check('auth.me devuelve todas las pantallas al admin', r.ok && r.data.pantallas.length === 8, r);
r = call('auth.me', {}, 'token-falso');
check('sesión falsa rechazada', !r.ok && r.error.code === 'AUTH');

console.log('Usuarios y permisos');
r = call('admin.users.save', { correo: 'enf.juv@ejemplo.com', nombre: 'Enfermería Juventud', rol: 'enf', plantas: 'PLT-JUV,PLT-BAR' }, adm, rid());
check('admin crea usuario de Enfermería', r.ok, r);
const enfId = r.data.usuario_id;
const reqId = rid();
const a1 = call('admin.users.save', { correo: 'ser@ejemplo.com', rol: 'ser', plantas: '*' }, adm, reqId);
const a2 = call('admin.users.save', { correo: 'ser@ejemplo.com', rol: 'ser', plantas: '*' }, adm, reqId);
check('mismo requestId no duplica (idempotencia)', a1.ok && a2.ok && a1.data.usuario_id === a2.data.usuario_id);
check('solo un registro del usuario de Servicios', main.getSheetByName('SYS_Usuarios').data.filter(x => x[1] === 'ser@ejemplo.com').length === 1);
r = call('admin.users.save', { correo: 'x@ejemplo.com', rol: 'enf', plantas: 'PLT-JUV' }, adm);
check('escritura sin requestId rechazada', !r.ok && r.error.code === 'BAD_REQUEST');
r = call('admin.users.save', { correo: 'x@ejemplo.com', rol: 'enf', plantas: 'PLT-XXX' }, adm, rid());
check('planta inexistente rechazada', !r.ok && r.error.code === 'VALIDATION');
r = call('admin.users.save', { correo: '=HYPERLINK("http://malo")@x.com', nombre: '=1+1', rol: 'enf', plantas: 'PLT-JUV' }, adm, rid());
check('correo con fórmula rechazado por validación', !r.ok);
r = call('admin.users.save', { correo: 'f@ejemplo.com', nombre: '=IMPORTXML("x")', rol: 'enf', plantas: 'PLT-JUV' }, adm, rid());
const stored = main.getSheetByName('SYS_Usuarios').data.find(x => x[1] === 'f@ejemplo.com');
check('nombre con "=" se guarda como texto, no como fórmula', r.ok && stored[2].startsWith("'="), stored);

r = call('auth.login', { idToken: google('enf.juv@ejemplo.com'), compartido: false }, null);
const enf = r.data.session;
check('Enfermería ve solo sus plantas', r.ok && JSON.stringify(r.data.me.plantas) === '["PLT-JUV","PLT-BAR"]', r.data && r.data.me);
check('Enfermería no ve Configuración', !r.data.me.pantallas.includes('configuracion'));
r = call('admin.users.list', {}, enf);
check('Enfermería no puede listar usuarios', !r.ok && r.error.code === 'FORBIDDEN');
r = call('catalog.get', {}, enf);
check('catálogo filtrado por planta (solo JUV y BAR)', r.ok && r.data.servicios.every(s => ['PLT-JUV', 'PLT-BAR'].includes(s.planta_id)) && r.data.plantas.length === 2);
check('catálogo trae tipos de incidencia y puntos de auditoría', r.data.tipos.length === 16 && r.data.auditoriaPuntos.length === 30);

console.log('Control de versión');
const list = call('admin.users.list', {}, adm).data;
const u = list.find(x => x.usuario_id === enfId);
r = call('admin.users.save', Object.assign({}, u, { nombre: 'Cambio A' }), adm, rid());
check('primera edición con versión correcta', r.ok, r);
r = call('admin.users.save', Object.assign({}, u, { nombre: 'Cambio B' }), adm, rid());
check('segunda edición con versión vieja rechazada', !r.ok && r.error.code === 'CONFLICT');

console.log('Baja de usuario');
const u2 = call('admin.users.list', {}, adm).data.find(x => x.usuario_id === enfId);
r = call('admin.users.save', Object.assign({}, u2, { activo: 'NO' }), adm, rid());
check('admin desactiva usuario', r.ok, r);
r = call('auth.me', {}, enf);
check('la sesión del usuario desactivado deja de funcionar', !r.ok && r.error.code === 'AUTH');
const me = call('admin.users.list', {}, adm).data.find(x => x.correo === 'admin@ejemplo.com');
r = call('admin.users.save', Object.assign({}, me, { activo: 'NO' }), adm, rid());
check('el admin no puede desactivarse a sí mismo', !r.ok && r.error.code === 'VALIDATION');

console.log('Sesiones');
const tab = call('auth.login', { idToken: google('ser@ejemplo.com'), compartido: true }).data.session;
advance(9 * 60e3);
check('tablet: sigue activa a los 9 min', call('auth.me', {}, tab).ok);
advance(9 * 60e3);
check('tablet: el uso reinicia el contador (18 min, con actividad)', call('auth.me', {}, tab).ok);
advance(11 * 60e3);
r = call('auth.me', {}, tab);
check('tablet: se cierra tras 10 min sin uso', !r.ok && /10 minutos/.test(r.error.message), r);
check('tablet: queda revocada en la hoja', main.getSheetByName('SYS_Sesiones').data.some(x => x[3] === 'SI' && x[7] === 'SI'));
const desk = call('auth.login', { idToken: google('ser@ejemplo.com') }).data.session;
advance(29 * 86400e3);
for (const k of Object.keys(cache)) delete cache[k];
check('escritorio: sigue activa a los 29 días (aunque se vacíe la caché)', call('auth.me', {}, desk).ok);
advance(2 * 86400e3);
check('escritorio: vence a los 30 días', !call('auth.me', {}, desk).ok);
const d2 = call('auth.login', { idToken: google('ser@ejemplo.com') }).data.session;
check('cerrar sesión', call('auth.logout', {}, d2).ok && !call('auth.me', {}, d2).ok);

console.log('Bitácora');
const logRows = books[props.LOG_ID].getSheetByName('SYS_Bitacora').data;
check('registra inicios de sesión y cambios de usuarios', logRows.some(x => x[3] === 'login') && logRows.some(x => x[3] === 'usuario.crear') && logRows.some(x => x[3] === 'login.rechazado'));

console.log(`\n${pass} correctas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
