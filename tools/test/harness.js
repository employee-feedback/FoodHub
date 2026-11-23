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

console.log('Incidencias');
advance(3600e3);
const admS = login('admin@ejemplo.com', true).data.session;
const rep3 = vm.runInContext('setup()', ctx);
check('setup agrega columnas nuevas y crea la carpeta de evidencias una sola vez', !!props.EVID_FOLDER_ID && Object.keys(sim.folders).length === 1 && !vm.runInContext('setup()', ctx).some(l => /Carpeta/.test(l)), rep3);
check('carpeta de evidencias sin compartir', Object.values(sim.drive).every(f => !f.shared));
call('admin.users.save', { correo: 'enf2@ejemplo.com', nombre: 'Ana Enfermería', rol: 'enf', plantas: 'PLT-JUV,PLT-BAR' }, admS, rid());
call('admin.users.save', { correo: 'enf.can@ejemplo.com', nombre: 'Enfermería Cantera', rol: 'enf', plantas: 'PLT-CAN' }, admS, rid());
call('admin.users.save', { correo: 'ser2@ejemplo.com', nombre: 'Servicios', rol: 'ser', plantas: 'PLT-JUV,PLT-BAR,PLT-CAN,PLT-AME' }, admS, rid());
const enfJ = login('enf2@ejemplo.com', true).data.session;
const enfCan = login('enf.can@ejemplo.com', true).data.session;
const ser = login('ser2@ejemplo.com', true).data.session;
const nowL = () => vm.runInContext('nowIso_()', ctx).slice(0, 16);
const year = nowL().slice(0, 4);
r = call('catalog.get', {}, enfJ);
check('el catálogo trae los campos de los 16 tipos', r.ok && Object.keys(r.data.campos).length === 16 && r.data.campos['TIP-07'].some(f => f.k === 'presentes'));
const base = { planta_id: 'PLT-JUV', servicio_id: 'SRV-JUV-05', detectada: nowL(), descripcion: 'Faltó personal en la línea' };
const t7 = Object.assign({}, base, { tipo_id: 'TIP-07', datos: { turno_conc_id: 'TCO-JUV-1', puesto_id: 'PUE-AUX', presentes: 2, afecto_servicio: 'Sí' } });
const idA = rid();
const c1 = call('inc.create', t7, enfJ, idA);
check('Enfermería registra Personal incompleto y recibe folio', c1.ok && c1.data.folio === 'INC-JUV-' + year + '-0001', c1);
const c1b = call('inc.create', t7, enfJ, idA);
check('doble clic (mismo requestId) no duplica el folio', c1b.ok && c1b.data.folio === c1.data.folio && main.getSheetByName('TRX_Incidencias').data.length === 2);
const f1 = c1.data.folio;
r = call('inc.get', { folio: f1 }, enfJ);
check('requerido sale de la plantilla y faltantes se calculan (4 - 2 = 2)', r.ok && r.data.datos.requerido === 4 && r.data.datos.faltantes === 2, r.data && r.data.datos);
check('se abre un evento de afectación', r.data.eventos.length === 1 && r.data.eventos[0].faltantes === '2' && !r.data.eventos[0].fin);
check('Enfermería no ve botones de reclasificar ni cerrar, sí cancelar', !r.data.puede.cerrar && !r.data.puede.reclasificar && r.data.puede.cancelar && r.data.puede.afectacion);
const c2 = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-15', descripcion: 'Queja por el guisado frío', datos: { tema: 'Comida fría' } }), enfJ, rid());
const c3 = call('inc.create', Object.assign({}, base, { planta_id: 'PLT-BAR', servicio_id: 'SRV-BAR-03', tipo_id: 'TIP-16', descripcion: '=HYPERLINK("http://x")' }), enfJ, rid());
check('folios consecutivos por planta', c2.data.folio === 'INC-JUV-' + year + '-0002' && c3.data.folio === 'INC-BAR-' + year + '-0001', [c2, c3]);
check('texto con fórmula se guarda como texto', main.getSheetByName('TRX_Incidencias').data.some(x => x.includes('\'=HYPERLINK("http://x")')));
r = call('inc.create', Object.assign({}, base, { planta_id: 'PLT-CAN', servicio_id: 'SRV-CAN-02', tipo_id: 'TIP-16' }), enfJ, rid());
check('no registra en una planta que no tiene asignada', !r.ok && r.error.code === 'FORBIDDEN');
r = call('inc.create', Object.assign({}, base, { servicio_id: 'SRV-CAN-02', tipo_id: 'TIP-16' }), enfJ, rid());
check('el servicio debe ser de la planta', !r.ok && r.error.code === 'VALIDATION');
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-07', datos: { turno_conc_id: 'TCO-JUV-1', puesto_id: 'PUE-AUX', afecto_servicio: 'Sí' } }), enfJ, rid());
check('falta un campo obligatorio del tipo', !r.ok && /Personal presente/.test(r.error.message), r);
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-07', datos: { turno_conc_id: 'TCO-JUV-1', puesto_id: 'PUE-AUX', presentes: 4, afecto_servicio: 'No' } }), enfJ, rid());
check('sin faltantes no se registra Personal incompleto', !r.ok && /no hay faltantes/.test(r.error.message));
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-03', datos: { hora_real_cierre: '08:40' } }), enfJ, rid());
check('TIP-03 exige comensales', !r.ok && /no alcanzaron/.test(r.error.message));
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-01', comensales_afectados: 999, datos: { sin_comida: 12, porcion_reducida: 5 } }), enfJ, rid());
const f01 = r.data.folio;
const g01 = call('inc.get', { folio: f01 }, enfJ).data;
check('TIP-01: comensales = sin comida + porción reducida, y es crítica', g01.comensales_afectados === '17' && g01.critica === true, g01);
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-02', datos: { hora_real_inicio: '06:05' } }), enfJ, rid());
check('TIP-02: minutos de retraso calculados (05:40 → 06:05 = 25)', r.ok && call('inc.get', { folio: r.data.folio }, enfJ).data.datos.minutos_retraso === 25, r);
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-04', datos: { componente: 'Pizza' } }), enfJ, rid());
check('opción fuera de la lista rechazada', !r.ok && /elige una opción/.test(r.error.message));
r = call('inc.create', Object.assign({}, base, { detectada: '2099-01-01T10:00', tipo_id: 'TIP-16' }), enfJ, rid());
check('detección en el futuro rechazada', !r.ok);
r = call('inc.create', Object.assign({}, base, { servicio_id: 'SRV-JUV-03', detectada: '2026-11-21T02:30', tipo_id: 'TIP-16', descripcion: 'Cena de madrugada' }), enfJ, rid());
check('día operativo: cena del sábado 02:30 cuenta para el viernes', r.ok && main.getSheetByName('TRX_Incidencias').data.some(x => x[0] === r.data.folio && x.includes('2026-11-20')), r);
r = call('inc.create', Object.assign({}, base, { tipo_id: 'TIP-16' }), admS, rid());
check('administrador registra en cualquier planta', r.ok);

console.log('Seguimiento y permisos por planta');
r = call('inc.list', {}, ser);
check('Servicios ve los folios de sus plantas', r.ok && r.data.rows.some(x => x.folio === f1) && r.data.rows.some(x => x.folio === c3.data.folio));
r = call('inc.list', {}, enfCan);
check('alguien sin esa planta no los ve', r.ok && r.data.rows.length === 0);
r = call('inc.get', { folio: f1 }, enfCan);
check('ni con el folio directo', !r.ok && r.error.code === 'NOT_FOUND');
r = call('inc.list', { planta_id: 'PLT-BAR' }, ser);
check('filtro por planta', r.data.rows.length === 1 && r.data.rows[0].folio === c3.data.folio);
r = call('inc.list', { q: '0002' }, ser);
check('búsqueda por folio', r.data.rows.length >= 1 && r.data.rows.every(x => x.folio.includes('0002')));
r = call('inc.list', { tipo_id: 'TIP-07', categoria_id: 'CAT-PLA' }, ser);
check('filtro por categoría y tipo', r.data.rows.length === 1);

console.log('Acciones sobre el folio');
let v = call('inc.get', { folio: f1 }, enfJ).data.version;
advance(24 * 3600e3);
r = call('inc.action', { folio: f1, accion: 'afectacion', presentes: 3, texto: 'Llegó una persona más', version: v }, enfJ, rid());
check('al día siguiente se actualizan faltantes del mismo folio', r.ok, r);
let g = call('inc.get', { folio: f1 }, ser).data;
check('la línea de tiempo muestra ambos eventos (el primero cerrado)', g.eventos.length === 2 && !!g.eventos[0].fin && g.eventos[1].faltantes === '1' && !g.eventos[1].fin, g.eventos);
check('historial guarda antes y después', g.historial.some(h => h.accion === 'afectacion' && h.campo === 'faltantes' && h.antes === '2' && h.despues === '1'));
check('historial muestra el nombre de quien hizo el cambio', g.historial.some(h => h.actor === 'Ana Enfermería'));
r = call('inc.action', { folio: f1, accion: 'afectacion', presentes: 3, version: v }, enfJ, rid());
check('versión vieja: avisa que otra persona lo cambió', !r.ok && r.error.code === 'CONFLICT');
r = call('inc.action', { folio: c2.data.folio, accion: 'reclasificar', tipo_id: 'TIP-06', datos: { aspecto: 'Temperatura' }, texto: 'Es calidad', version: 1 }, enfJ, rid());
check('Enfermería no puede reclasificar', !r.ok && r.error.code === 'FORBIDDEN');
r = call('inc.action', { folio: c2.data.folio, accion: 'reclasificar', tipo_id: 'TIP-06', datos: { aspecto: 'Temperatura', platillo: 'Guisado' }, texto: 'Es calidad del alimento', version: 1 }, ser, rid());
g = call('inc.get', { folio: c2.data.folio }, ser).data;
check('Servicios reclasifica la queja y el historial guarda el tipo anterior', r.ok && g.tipo_id === 'TIP-06' && g.tipo_original === 'TIP-15' && g.historial.some(h => h.accion === 'reclasificar' && h.antes === 'TIP-15'), r);
r = call('inc.list', { tipo_id: 'TIP-15' }, ser);
check('la queja reclasificada ya no cuenta como queja', r.data.rows.length === 0);
r = call('inc.action', { folio: f1, accion: 'cerrar', texto: 'Plantilla completa', version: g.version }, enfJ, rid());
check('Enfermería no puede cerrar', !r.ok && r.error.code === 'FORBIDDEN');
v = call('inc.get', { folio: f1 }, ser).data.version;
r = call('inc.action', { folio: f1, accion: 'cerrar', texto: '', version: v }, ser, rid());
check('cerrar exige nota', !r.ok && /nota de cierre/.test(r.error.message));
r = call('inc.action', { folio: f1, accion: 'cerrar', texto: 'Plantilla completa desde el lunes', version: v }, ser, rid());
g = call('inc.get', { folio: f1 }, ser).data;
check('Servicios cierra con nota; los eventos abiertos se cierran', r.ok && g.estado === 'Cerrada' && g.nota_cierre && g.eventos.every(e => e.fin), r);
r = call('inc.action', { folio: f1, accion: 'afectacion', presentes: 4, version: g.version }, enfJ, rid());
check('un folio cerrado ya no admite afectación', !r.ok && /cerrada/.test(r.error.message));
r = call('inc.action', { folio: f1, accion: 'nota', texto: 'Verificado en piso' }, enfJ, rid());
check('pero sí notas', r.ok);
r = call('inc.action', { folio: c3.data.folio, accion: 'cancelar', texto: '', version: 1 }, enfJ, rid());
check('cancelar exige motivo', !r.ok && /motivo/.test(r.error.message));
r = call('inc.action', { folio: c3.data.folio, accion: 'cancelar', texto: 'Se registró dos veces', version: 1 }, enfJ, rid());
check('Enfermería cancela un registro por error, con motivo', r.ok && r.data.estado === 'Cancelada', r);
check('la cancelada sale de Seguimiento', !call('inc.list', {}, ser).data.rows.some(x => x.folio === c3.data.folio));
check('y ya no se abre para Enfermería ni Servicios', !call('inc.get', { folio: c3.data.folio }, ser).ok);
r = call('inc.list', { canceladas: true }, admS);
check('pero se conserva: el administrador la consulta con motivo', r.data.rows.some(x => x.folio === c3.data.folio && x.estado === 'Cancelada') && call('inc.get', { folio: c3.data.folio }, admS).data.motivo_cancelacion === 'Se registró dos veces');
check('ninguna fila se borró de la hoja', main.getSheetByName('TRX_Incidencias').data.length - 1 === 7);

console.log('Evidencias');
const jpg = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), crypto.randomBytes(2000)]).toString('base64');
r = call('inc.evidence.add', { folio: f01, nombre: 'linea.jpg', data: jpg }, enfJ, rid());
check('sube una foto JPG a la carpeta privada', r.ok && Object.keys(sim.drive).length === 1, r);
const ev1 = r.data.evidencia_id;
r = call('inc.evidence.add', { folio: f01, nombre: 'persona.jpg', data: jpg, interna: true }, enfJ, rid());
g = call('inc.get', { folio: f01 }, ser).data;
check('marca visible/interna para el concesionario', g.evidencias.length === 2 && g.evidencias[0].visible_proveedor === true && g.evidencias[1].visible_proveedor === false);
r = call('inc.evidence.add', { folio: f01, nombre: 'virus.jpg', data: Buffer.from('<script>alert(1)</script>').toString('base64') }, enfJ, rid());
check('revisa el tipo real del archivo, no el nombre', !r.ok && /JPG o PNG/.test(r.error.message));
r = call('inc.evidence.add', { folio: f01, nombre: 'grande.pdf', data: Buffer.concat([Buffer.from('%PDF-1.4'), Buffer.alloc(5.2 * 1024 * 1024)]).toString('base64') }, enfJ, rid());
check('PDF de más de 5 MB rechazado', !r.ok && /5 MB/.test(r.error.message));
r = call('inc.evidence.get', { evidencia_id: ev1 }, ser);
check('Servicios ve la foto a través de FoodHub', r.ok && r.data.data === jpg && r.data.tipo === 'image/jpeg');
r = call('inc.evidence.get', { evidencia_id: ev1 }, enfCan);
check('alguien sin la planta no puede verla', !r.ok && r.error.code === 'NOT_FOUND');
r = call('inc.evidence.add', { folio: f01, nombre: 'x.jpg', data: jpg }, enfCan, rid());
check('ni subir evidencia a ese folio', !r.ok);
r = call('inc.evidence.retire', { evidencia_id: ev1, motivo: '' }, enfJ, rid());
check('retirar exige motivo', !r.ok);
r = call('inc.evidence.retire', { evidencia_id: ev1, motivo: 'Foto equivocada' }, enfJ, rid());
g = call('inc.get', { folio: f01 }, ser).data;
check('retirar marca la foto, no la borra de Drive', r.ok && g.evidencias[0].retirada && Object.keys(sim.drive).length === 2 && g.historial.some(h => h.accion === 'evidencia.retirada'));

console.log('Inicio');
r = call('inc.summary', {}, ser);
check('cifras reales sin contar canceladas', r.ok && r.data.abiertas === 5 && r.data.criticas_abiertas === 1 && r.data.cerradas_mes + r.data.abiertas === 6 && r.data.recientes.length === 6 && !r.data.recientes.some(x => x.estado === 'Cancelada'), r.data);
r = call('inc.summary', {}, enfCan);
check('Inicio de otra planta en ceros', r.data.abiertas === 0 && r.data.recientes.length === 0);

console.log('Bitácora');
const logRows = books[props.LOG_ID].getSheetByName('SYS_Bitacora').data;
check('registra inicios de sesión y cambios de usuarios', logRows.some(x => x[3] === 'login') && logRows.some(x => x[3] === 'usuario.crear') && logRows.some(x => x[3] === 'login.codigo.rechazado') && logRows.some(x => x[3] === 'login.codigo.incorrecto'));

console.log(`\n${pass} correctas, ${fail} fallidas`);
process.exit(fail ? 1 : 0);
