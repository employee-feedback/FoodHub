/*
 * Pruebas locales del backend de FoodHub con simulaciones en memoria de los servicios de Google.
 * No sustituyen la prueba real en Apps Script, pero verifican la lógica: sesiones, permisos,
 * idempotencia, control de versión y protección contra fórmulas.
 *
 * Uso: node tools/test/harness.js
 */
const crypto = require('crypto');
const sim = require('./gas-sim');
const { ctx, vm, books, props, cache, mails, mailQuota, codeFor } = sim;
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
/** Pide el código, lo toma del correo y entra. */
function login(email, recordar) {
  call('auth.requestCode', { correo: email });
  return call('auth.verifyCode', { correo: email, codigo: codeFor(email), recordar });
}


// ---------- pruebas ----------
console.log('Instalación');
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
let r = call('auth.requestCode', { correo: 'desconocido@ejemplo.com' });
check('correo no dado de alta: misma respuesta y no se envía correo', r.ok && /Si tu correo/.test(r.data.mensaje) && mails.length === 0, r);
r = call('auth.requestCode', { correo: 'no-es-correo' });
check('valida el formato del correo', !r.ok && r.error.code === 'VALIDACION');
r = call('auth.requestCode', { correo: 'ADMIN@ejemplo.com' });
check('envía el código al correo dado de alta', r.ok && mails.length === 1 && mails[0].to === 'admin@ejemplo.com' && /^\d{6}$/.test(codeFor('admin@ejemplo.com')));
const good = codeFor('admin@ejemplo.com');
const bad = good === '000000' ? '111111' : '000000';
r = call('auth.verifyCode', { correo: 'admin@ejemplo.com', codigo: bad });
check('código incorrecto dice cuántos intentos quedan', !r.ok && /quedan 4 intentos/.test(r.error.message), r);
check('el código no se guarda en texto en la caché', !JSON.stringify(cache).includes(good));
r = call('auth.verifyCode', { correo: 'Admin@Ejemplo.com', codigo: good, recordar: true });
check('administrador entra con el código (sin importar mayúsculas)', r.ok && r.data.me.rol === 'adm', r);
const reuse = call('auth.verifyCode', { correo: 'admin@ejemplo.com', codigo: good });
check('el código solo sirve una vez', !reuse.ok && /venció o ya se usó/.test(reuse.error.message));
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

r = login('enf.juv@ejemplo.com', true);
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
call('auth.requestCode', { correo: 'ser@ejemplo.com' });
let last;
for (let i = 0; i < 5; i++) last = call('auth.verifyCode', { correo: 'ser@ejemplo.com', codigo: codeFor('ser@ejemplo.com') === '999999' ? '888888' : '999999' });
check('5 intentos fallidos anulan el código', !last.ok && /Demasiados intentos/.test(last.error.message));
check('después de bloquearse, ni el código correcto sirve', !call('auth.verifyCode', { correo: 'ser@ejemplo.com', codigo: codeFor('ser@ejemplo.com') }).ok);
advance(3600e3);
call('auth.requestCode', { correo: 'ser@ejemplo.com' });
advance(11 * 60e3);
r = call('auth.verifyCode', { correo: 'ser@ejemplo.com', codigo: codeFor('ser@ejemplo.com') });
check('el código vence a los 10 minutos', !r.ok && /venció/.test(r.error.message));
for (let i = 0; i < 4; i++) call('auth.requestCode', { correo: 'ser@ejemplo.com' });
r = call('auth.requestCode', { correo: 'ser@ejemplo.com' });
check('máximo 5 códigos por hora por correo', !r.ok && r.error.code === 'LIMITE', r);
advance(3600e3);
const tab = login('ser@ejemplo.com', false).data.session;
advance(5 * 3600e3);
check('sin "Recordar": sigue activa a las 5 h', call('auth.me', {}, tab).ok);
advance(1.1 * 3600e3);
check('sin "Recordar": vence a las 6 h', !call('auth.me', {}, tab).ok);
const q = mailQuota.n; mailQuota.n = 0;
r = call('auth.requestCode', { correo: 'ser@ejemplo.com' });
check('sin cuota de correo avisa claro', !r.ok && r.error.code === 'CUOTA');
mailQuota.n = q;
const desk = login('ser@ejemplo.com', true).data.session;
advance(29 * 86400e3);
for (const k of Object.keys(cache)) delete cache[k];
check('Recordar equipo: sigue activa a los 29 días (aunque se vacíe la caché)', call('auth.me', {}, desk).ok);
advance(2 * 86400e3);
check('Recordar equipo: vence a los 30 días', !call('auth.me', {}, desk).ok);
const d2 = login('ser@ejemplo.com', true).data.session;
check('cerrar sesión', call('auth.logout', {}, d2).ok && !call('auth.me', {}, d2).ok);

console.log('Bitácora');
const logRows = books[props.LOG_ID].getSheetByName('SYS_Bitacora').data;
check('registra inicios de sesión y cambios de usuarios', logRows.some(x => x[3] === 'login') && logRows.some(x => x[3] === 'usuario.crear') && logRows.some(x => x[3] === 'login.codigo.rechazado') && logRows.some(x => x[3] === 'login.codigo.incorrecto'));

console.log(`\n${pass} correctas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
