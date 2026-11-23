/**
 * FoodHub — registro y seguimiento de incidencias.
 *
 * Reglas:
 *  - El reporte original no se edita: los cambios posteriores son acciones con historial
 *    (quién, cuándo, antes y después).
 *  - Estados: Registrada → Cerrada (Servicios/Admin, con nota) o Cancelada (registro por error, con motivo).
 *    Una cancelada desaparece de Seguimiento e indicadores, pero se conserva en la base.
 *  - El folio sale de un contador con bloqueo: INC-<PLANTA>-<AÑO>-0001, consecutivo por planta y año.
 *  - Los campos específicos de cada tipo salen de CAT_TiposIncidencia.campos_especificos (Fase 2).
 */

var INC = { REG: 'Registrada', CER: 'Cerrada', CAN: 'Cancelada' };
var INC_TEXT_MAX = 2000;
var INC_LIST_MAX = 1000;
var SI_NO = ['Sí', 'No'];

/**
 * Campos específicos por tipo. t: num | text | time | datetime | bool | select | turno | puesto | auto | calc.
 * auto/calc los llena el servidor; el navegador solo los muestra.
 */
var TIPO_CAMPOS = {
  'TIP-01': [
    { k: 'sin_comida', l: 'Comensales sin comida', t: 'num', req: true },
    { k: 'porcion_reducida', l: 'Comensales con porción reducida', t: 'num' },
    { k: 'se_ofrecio', l: 'Qué se ofreció en su lugar', t: 'text' },
    { k: 'hora_normalizo', l: 'Hora en que se normalizó', t: 'time' }],
  'TIP-02': [
    { k: 'hora_programada', l: 'Hora programada', t: 'auto' },
    { k: 'hora_real_inicio', l: 'Hora real de inicio', t: 'time', req: true },
    { k: 'minutos_retraso', l: 'Minutos de retraso', t: 'calc' }],
  'TIP-03': [
    { k: 'hora_cierre_programada', l: 'Hora programada de cierre', t: 'auto' },
    { k: 'hora_real_cierre', l: 'Hora real de cierre', t: 'time', req: true }],
  'TIP-04': [
    { k: 'componente', l: 'Componente', t: 'select', o: ['Proteína', 'Guarnición', 'Verdura', 'Fruta', 'Postre', 'Bebida'], req: true },
    { k: 'publicado', l: 'Qué estaba publicado', t: 'text' },
    { k: 'servido', l: 'Qué se sirvió', t: 'text' },
    { k: 'aviso_previo', l: '¿Hubo aviso previo?', t: 'bool' },
    { k: 'aviso_fecha', l: 'Fecha y hora del aviso', t: 'datetime', si: ['aviso_previo', 'Sí'] },
    { k: 'aviso_a', l: 'A quién se avisó', t: 'text', si: ['aviso_previo', 'Sí'] }],
  'TIP-05': [
    { k: 'insumo', l: 'Componente o insumo faltante', t: 'text', req: true },
    { k: 'servicios_afectados', l: 'Servicios afectados', t: 'text' },
    { k: 'sustituto', l: 'Qué se sustituyó', t: 'text' }],
  'TIP-06': [
    { k: 'aspecto', l: 'Aspecto', t: 'select', o: ['Sabor', 'Temperatura', 'Presentación', 'Porción', 'Cocción', 'Cuerpo extraño'], req: true },
    { k: 'platillo', l: 'Platillo', t: 'text' },
    { k: 'retirado', l: '¿Se retiró de la línea?', t: 'bool' }],
  'TIP-07': [
    { k: 'turno_conc_id', l: 'Turno del concesionario', t: 'turno', req: true },
    { k: 'puesto_id', l: 'Puesto faltante', t: 'puesto', req: true },
    { k: 'requerido', l: 'Personal requerido (plantilla)', t: 'calc' },
    { k: 'presentes', l: 'Personal presente', t: 'num', req: true },
    { k: 'faltantes', l: 'Faltantes', t: 'calc' },
    { k: 'afecto_servicio', l: '¿Afectó el servicio?', t: 'bool', req: true }],
  'TIP-08': [
    { k: 'practica', l: 'Práctica observada', t: 'select', o: ['Uniforme', 'Cofia', 'Cubrebocas', 'Guantes', 'Lavado de manos', 'Otra'], req: true },
    { k: 'area', l: 'Área', t: 'text' },
    { k: 'corregido', l: '¿Se corrigió en el momento?', t: 'bool' }],
  'TIP-09': [
    { k: 'tipo_plaga', l: 'Tipo', t: 'select', o: ['Insecto', 'Roedor', 'Ave', 'Otro'], req: true },
    { k: 'area', l: 'Área', t: 'text' },
    { k: 'area_suspendida', l: '¿Se suspendió el uso del área?', t: 'bool' }],
  'TIP-10': [
    { k: 'personas', l: 'Número de personas', t: 'num', req: true },
    { k: 'sintomas', l: 'Síntomas generales', t: 'text', h: 'Sin nombres ni datos médicos personales.' },
    { k: 'platillos', l: 'Platillos consumidos', t: 'text' },
    { k: 'muestra_testigo', l: '¿Se conservó muestra testigo?', t: 'bool' }],
  'TIP-11': [
    { k: 'objeto', l: 'Tipo de objeto', t: 'text', req: true },
    { k: 'platillo', l: 'Platillo', t: 'text' },
    { k: 'muestra', l: '¿Se conservó la muestra?', t: 'bool' }],
  'TIP-12': [
    { k: 'equipo', l: 'Equipo', t: 'select', o: ['Refrigeración', 'Cocción', 'Línea caliente/fría', 'Lavaloza', 'Mobiliario', 'Otro'], req: true },
    { k: 'afecta_servicio', l: '¿Afecta el servicio?', t: 'bool' },
    { k: 'mantenimiento', l: 'Responsable del mantenimiento', t: 'select', o: ['Concesionario', 'Empresa'] }],
  'TIP-13': [
    { k: 'area', l: 'Área', t: 'select', o: ['Mesas', 'Piso', 'Línea', 'Baños', 'Otra'], req: true }],
  'TIP-14': [
    { k: 'condicion', l: 'Tipo', t: 'select', o: ['Gas', 'Extintor', 'Cableado', 'Aceite', 'Residuos', 'Otro'], req: true },
    { k: 'riesgo_inmediato', l: '¿Riesgo inmediato?', t: 'bool' }],
  'TIP-15': [
    { k: 'tema', l: 'Tema', t: 'text', req: true, h: 'Si la queja corresponde a otro tipo, Servicios la reclasifica y cuenta solo una vez.' }],
  'TIP-16': []
};

/** Tipos en los que los comensales afectados son obligatorios (decisión 3 de la Fase 5). */
var COMENSALES_OBLIGATORIOS = { 'TIP-01': 'calc', 'TIP-03': 'Comensales que no alcanzaron servicio' };

// ---------------- utilidades de fecha y catálogo ----------------

/** 'YYYY-MM-DDTHH:mm' en hora de planta → Date. */
function localToDate_(s) {
  s = String(s || '').trim().slice(0, 16);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) throw new AppError('VALIDATION', 'La fecha y hora no son válidas.');
  return Utilities.parseDate(s, APP.TZ, "yyyy-MM-dd'T'HH:mm");
}

function minutesOf_(hhmm) {
  var m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ''));
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Día de la semana (0 = domingo) de 'YYYY-MM-DD'. */
function dow_(ymd) {
  var p = ymd.split('-').map(Number);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
}

function addDays_(ymd, n) {
  var p = ymd.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2);
}

/** Días que cubre un texto del catálogo como 'L-V', 'S-D', 'V-L', 'Sáb, Dom'. null = sin restricción conocida. */
function parseDias_(txt) {
  var t = String(txt || '').toLowerCase().replace(/\(.*?\)/g, '');
  var map = { l: 1, lun: 1, m: 2, mar: 2, x: 3, mi: 3, 'mié': 3, mie: 3, j: 4, jue: 4, v: 5, vie: 5, s: 6, 'sáb': 6, sab: 6, d: 0, dom: 0 };
  var out = {};
  var any = false;
  t.split(/[,y\/]+/).forEach(function (part) {
    part = part.trim();
    if (!part) return;
    var r = part.split(/\s*-\s*/);
    if (r.length === 2 && map[r[0]] !== undefined && map[r[1]] !== undefined) {
      var a = map[r[0]], b = map[r[1]];
      for (var i = 0; i < 7; i++) { var d = (a + i) % 7; out[d] = true; any = true; if (d === b) break; }
    } else if (map[part] !== undefined) { out[map[part]] = true; any = true; }
  });
  return any ? out : null;
}

function diasIncluye_(txt, dow) {
  var d = parseDias_(txt);
  return !d || !!d[dow];
}

/**
 * Día operativo: un servicio de madrugada (antes de las 06:00) pertenece al día anterior cuando el
 * catálogo lo programa ese día. Ej.: cena de las 02:00 del sábado → tercer turno del viernes.
 */
function diaOperativo_(localIso, servicio) {
  var ymd = localIso.slice(0, 10);
  var min = minutesOf_(localIso.slice(11, 16));
  if (min < 360) {
    var prev = addDays_(ymd, -1);
    if (!servicio || diasIncluye_(servicio.dias_operacion, dow_(prev))) return prev;
  }
  return ymd;
}

function catRow_(table, field, id) {
  var rows = cachedAll_(table);
  for (var i = 0; i < rows.length; i++) if (rows[i][field] === id && rows[i].activo !== 'NO') return rows[i];
  return null;
}

function requiredStaff_(plantaId, turnoId, puestoId, ymd) {
  var n = null;
  cachedAll_('CAT_PlantillaRequerida').forEach(function (r) {
    if (r.activo === 'NO' || r.planta_id !== plantaId || r.turno_conc_id !== turnoId || r.puesto_id !== puestoId) return;
    if (r.vigente_desde && r.vigente_desde > ymd) return;
    if (r.vigente_hasta && r.vigente_hasta < ymd) return;
    n = (n || 0) + Number(r.cantidad || 0);
  });
  return n;
}

// ---------------- validación de datos ----------------

function cleanText_(v, max) {
  return String(v == null ? '' : v).replace(/\s+$/g, '').replace(/^\s+/g, '').slice(0, max || 500);
}

function cleanNum_(v, label) {
  if (v === '' || v === null || v === undefined) return '';
  var n = Number(v);
  if (!isFinite(n) || n < 0 || n > 100000 || Math.floor(n) !== n) throw new AppError('VALIDATION', label + ': escribe un número entero.');
  return n;
}

/**
 * Valida y completa los campos específicos de un tipo.
 * ctx: { planta_id, servicio, detLocal, ymd }
 */
function validateDatos_(tipoId, datos, ctx) {
  datos = datos && typeof datos === 'object' ? datos : {};
  var defs = TIPO_CAMPOS[tipoId] || [];
  var out = {};
  defs.forEach(function (f) {
    if (f.t === 'auto' || f.t === 'calc') return;
    if (f.si && datos[f.si[0]] !== f.si[1]) return;
    var v = datos[f.k];
    if (f.t === 'num') v = cleanNum_(v, f.l);
    else if (f.t === 'bool') { v = v === true ? 'Sí' : v === false ? 'No' : String(v || ''); if (v && SI_NO.indexOf(v) < 0) throw new AppError('VALIDATION', f.l + ': responde Sí o No.'); }
    else if (f.t === 'select') { v = String(v || ''); if (v && f.o.indexOf(v) < 0) throw new AppError('VALIDATION', f.l + ': elige una opción de la lista.'); }
    else if (f.t === 'time') { v = String(v || ''); if (v && minutesOf_(v) === null) throw new AppError('VALIDATION', f.l + ': hora no válida.'); }
    else if (f.t === 'datetime') { v = String(v || '').slice(0, 16); if (v) localToDate_(v); }
    else if (f.t === 'turno') {
      v = String(v || '');
      var t = v && catRow_('CAT_TurnosConcesionario', 'turno_conc_id', v);
      if (v && (!t || t.planta_id !== ctx.planta_id)) throw new AppError('VALIDATION', 'Elige un turno del concesionario de esta planta.');
    } else if (f.t === 'puesto') {
      v = String(v || '');
      if (v && !catRow_('CAT_Puestos', 'puesto_id', v)) throw new AppError('VALIDATION', 'Elige un puesto de la lista.');
    } else v = cleanText_(v);
    if (f.req && (v === '' || v === null)) throw new AppError('VALIDATION', 'Falta: ' + f.l + '.');
    if (v !== '') out[f.k] = v;
  });

  var srv = ctx.servicio;
  if (tipoId === 'TIP-02') {
    out.hora_programada = srv.inicio;
    var d = minutesOf_(out.hora_real_inicio) - minutesOf_(srv.inicio);
    d = ((d % 1440) + 1440) % 1440;
    if (d > 720) throw new AppError('VALIDATION', 'La hora real de inicio es anterior a la programada (' + srv.inicio + ').');
    out.minutos_retraso = d;
  }
  if (tipoId === 'TIP-03') out.hora_cierre_programada = srv.fin;
  if (tipoId === 'TIP-07') {
    var req = requiredStaff_(ctx.planta_id, out.turno_conc_id, out.puesto_id, ctx.ymd);
    if (req === null) throw new AppError('VALIDATION', 'Ese puesto no está en la plantilla de ese turno. Revisa el turno o el puesto.');
    out.requerido = req;
    if (out.presentes > req) throw new AppError('VALIDATION', 'El personal presente no puede ser mayor al requerido (' + req + ').');
    out.faltantes = req - out.presentes;
    if (out.faltantes === 0) throw new AppError('VALIDATION', 'Con ese personal presente no hay faltantes.');
  }
  return out;
}

function comensales_(tipoId, raw, datos) {
  if (tipoId === 'TIP-01') return Number(datos.sin_comida || 0) + Number(datos.porcion_reducida || 0);
  var n = cleanNum_(raw, 'Comensales afectados');
  if (COMENSALES_OBLIGATORIOS[tipoId] && n === '') throw new AppError('VALIDATION', 'Falta: ' + COMENSALES_OBLIGATORIOS[tipoId] + '.');
  return n;
}

// ---------------- lectura ----------------

function incFind_(user, folio) {
  var inc = findBy_('TRX_Incidencias', 'folio', String(folio || ''));
  if (!inc || !canSeePlant_(user, inc.planta_id) || (inc.estado === INC.CAN && user.rol !== 'adm')) {
    throw new AppError('NOT_FOUND', 'No se encontró el folio o no tienes acceso a esa planta.', 404);
  }
  return inc;
}

function parseJson_(s) { try { return s ? JSON.parse(s) : {}; } catch (e) { return {}; } }

function userNames_() {
  var m = {};
  cachedAll_('SYS_Usuarios', APP.CACHE_USERS_SEC).forEach(function (u) { m[u.usuario_id] = u.nombre || u.correo; m[u.correo] = u.nombre || u.correo; });
  return m;
}

function incPublic_(r, names) {
  return {
    folio: r.folio, planta_id: r.planta_id, servicio_id: r.servicio_id, tipo_id: r.tipo_id, categoria_id: r.categoria_id,
    reporta: names[r.reporta_usuario_id] || '', detectada: r.detectada, registrada: r.registrada, dia_operativo: r.dia_operativo,
    turno: r.turno, estado: r.estado, critica: r.critica === 'SI', comensales_afectados: r.comensales_afectados,
    cerrada: r.cerrada, version: Number(r.version)
  };
}

function apiIncList_(user, p) {
  var names = userNames_();
  var desde = String(p.desde || ''), hasta = String(p.hasta || '');
  var q = String(p.q || '').trim().toUpperCase();
  var rows = all_('TRX_Incidencias').filter(function (r) {
    if (!canSeePlant_(user, r.planta_id)) return false;
    if (r.estado === INC.CAN && !(p.canceladas && user.rol === 'adm')) return false;
    if (p.planta_id && r.planta_id !== p.planta_id) return false;
    if (p.estado && r.estado !== p.estado) return false;
    if (p.categoria_id && r.categoria_id !== p.categoria_id) return false;
    if (p.tipo_id && r.tipo_id !== p.tipo_id) return false;
    if (p.critica && r.critica !== 'SI') return false;
    var day = String(r.detectada).slice(0, 10);
    if (desde && day < desde) return false;
    if (hasta && day > hasta) return false;
    if (q && String(r.folio).toUpperCase().indexOf(q) < 0) return false;
    return true;
  });
  rows.sort(function (a, b) { return a.registrada < b.registrada ? 1 : a.registrada > b.registrada ? -1 : 0; });
  var total = rows.length;
  return { total: total, truncado: total > INC_LIST_MAX, rows: rows.slice(0, INC_LIST_MAX).map(function (r) { return incPublic_(r, names); }) };
}

function apiIncGet_(user, p) {
  var r = incFind_(user, p.folio);
  var names = userNames_();
  var out = incPublic_(r, names);
  out.descripcion = r.descripcion;
  out.datos = parseJson_(r.datos);
  out.tipo_original = r.tipo_original;
  out.nota_cierre = r.nota_cierre;
  out.cerrada_por = names[r.cerrada_por] || r.cerrada_por;
  out.motivo_cancelacion = r.motivo_cancelacion;
  out.historial = all_('TRX_HistorialIncidencia').filter(function (h) { return h.folio === r.folio; }).map(function (h) {
    return { fecha: h.fecha, actor: names[h.actor] || h.actor, accion: h.accion, campo: h.campo, antes: h.antes, despues: h.despues };
  });
  out.eventos = all_('TRX_EventosAfectacion').filter(function (e) { return e.folio === r.folio && e.activo !== 'NO'; }).map(strip_);
  out.evidencias = all_('TRX_Evidencias').filter(function (e) { return e.entidad === 'incidencia' && e.entidad_id === r.folio; }).map(function (e) {
    return { evidencia_id: e.evidencia_id, nombre: e.nombre, tipo: e.tipo, bytes: Number(e.bytes), visible_proveedor: e.visible_proveedor === 'SI',
      retirada: e.retirada === 'SI', motivo_retiro: e.motivo_retiro, subida: e.creado_en, subida_por: names[e.creado_por] || e.creado_por,
      propia: e.creado_por === user.correo };
  });
  out.puede = incAllowed_(user, r);
  return out;
}

/** Acciones que el usuario puede hacer sobre el folio (el servidor las vuelve a validar al ejecutarlas). */
function incAllowed_(user, r) {
  var open = r.estado === INC.REG;
  return {
    nota: r.estado !== INC.CAN && hasPerm_(user, 'incidencia.nota'),
    evidencia: r.estado !== INC.CAN && hasPerm_(user, 'evidencia.subir'),
    afectacion: open && hasPerm_(user, 'incidencia.afectacion'),
    reclasificar: open && hasPerm_(user, 'incidencia.reclasificar'),
    cerrar: open && hasPerm_(user, 'incidencia.cerrar'),
    cancelar: open && hasPerm_(user, 'incidencia.cancelar')
  };
}

/** Cifras de Inicio: solo conteos reales de incidencias no canceladas. */
function apiIncSummary_(user, p) {
  var names = userNames_();
  var now = nowIso_();
  var month = now.slice(0, 7);
  var months = [];
  var y = Number(now.slice(0, 4)), m = Number(now.slice(5, 7));
  for (var i = 5; i >= 0; i--) {
    var mm = m - i, yy = y;
    while (mm < 1) { mm += 12; yy--; }
    months.push(yy + '-' + ('0' + mm).slice(-2));
  }
  var out = { abiertas: 0, criticas_abiertas: 0, registradas_mes: 0, cerradas_mes: 0, meses: months, por_mes: {}, recientes: [] };
  months.forEach(function (k) { out.por_mes[k] = {}; });
  var rows = all_('TRX_Incidencias').filter(function (r) {
    return r.estado !== INC.CAN && canSeePlant_(user, r.planta_id) && (!p.planta_id || r.planta_id === p.planta_id);
  });
  rows.forEach(function (r) {
    if (r.estado === INC.REG) { out.abiertas++; if (r.critica === 'SI') out.criticas_abiertas++; }
    var dm = String(r.detectada).slice(0, 7);
    if (dm === month) out.registradas_mes++;
    if (r.estado === INC.CER && String(r.cerrada).slice(0, 7) === month) out.cerradas_mes++;
    if (out.por_mes[dm]) out.por_mes[dm][r.categoria_id] = (out.por_mes[dm][r.categoria_id] || 0) + 1;
  });
  rows.sort(function (a, b) { return a.registrada < b.registrada ? 1 : -1; });
  out.recientes = rows.slice(0, 8).map(function (r) { return incPublic_(r, names); });
  return out;
}

// ---------------- escritura ----------------

function history_(folio, actor, accion, campo, antes, despues) {
  var s = function (v) { return v === undefined || v === null ? '' : (typeof v === 'object' ? JSON.stringify(v) : String(v)).slice(0, 5000); };
  insert_('TRX_HistorialIncidencia', { historial_id: uid_('HIS'), folio: folio, fecha: nowIso_(), actor: actor, accion: accion, campo: campo || '', antes: s(antes), despues: s(despues) });
}

function openEvent_(folio, inicio, datos, comensales, actor) {
  insert_('TRX_EventosAfectacion', { evento_id: uid_('EVT'), folio: folio, inicio: inicio, fin: '', puesto_id: datos.puesto_id || '', faltantes: datos.faltantes, comensales_afectados: comensales }, actor);
}

function closeEvents_(folio, fin, actor) {
  all_('TRX_EventosAfectacion').forEach(function (e) {
    if (e.folio === folio && !e.fin && e.activo !== 'NO') update_('TRX_EventosAfectacion', e.evento_id, { fin: fin }, actor);
  });
}

function apiIncCreate_(user, p) {
  var plantaId = String(p.planta_id || '');
  var planta = catRow_('CAT_Plantas', 'planta_id', plantaId);
  if (!planta || !canSeePlant_(user, plantaId)) throw new AppError('FORBIDDEN', 'No tienes acceso a esa planta.', 403);
  var srv = catRow_('CAT_Servicios', 'servicio_id', String(p.servicio_id || ''));
  if (!srv || srv.planta_id !== plantaId) throw new AppError('VALIDATION', 'Elige un servicio de esa planta.');
  var tipo = catRow_('CAT_TiposIncidencia', 'tipo_id', String(p.tipo_id || ''));
  if (!tipo) throw new AppError('VALIDATION', 'Elige el tipo de incumplimiento.');

  var det = localToDate_(p.detectada);
  if (det.getTime() > Date.now() + 5 * 60000) throw new AppError('VALIDATION', 'La fecha de detección no puede ser futura.');
  var detIso = isoDate_(det);
  var ymd = diaOperativo_(detIso, srv);

  var descripcion = cleanText_(p.descripcion, INC_TEXT_MAX);
  if (descripcion.length < 5) throw new AppError('VALIDATION', 'Describe brevemente lo que pasó.');
  var datos = validateDatos_(tipo.tipo_id, p.datos, { planta_id: plantaId, servicio: srv, ymd: ymd });
  var comensales = comensales_(tipo.tipo_id, p.comensales_afectados, datos);

  // idempotent_ ya corre dentro del bloqueo: el contador no se repite.
  var now = nowIso_();
  var n = nextCounter_('INC-' + planta.clave + '-' + now.slice(0, 4));
  var folio = 'INC-' + planta.clave + '-' + now.slice(0, 4) + '-' + ('000' + n).slice(-4);
  insert_('TRX_Incidencias', {
    folio: folio, planta_id: plantaId, servicio_id: srv.servicio_id, tipo_id: tipo.tipo_id, categoria_id: tipo.categoria_id,
    reporta_usuario_id: user.usuario_id, detectada: detIso, registrada: now, estado: INC.REG, critica: tipo.critico === 'Sí' ? 'SI' : 'NO',
    comensales_afectados: comensales, descripcion: descripcion, datos: JSON.stringify(datos), dia_operativo: ymd, turno: srv.turno_esquema
  }, user.correo);
  history_(folio, user.correo, 'registro', '', '', { tipo_id: tipo.tipo_id, estado: INC.REG });
  if (tipo.tipo_id === 'TIP-07') openEvent_(folio, detIso, datos, comensales, user.correo);
  logEvent_(user.correo, 'incidencia.crear', 'incidencia', folio, null, { planta_id: plantaId, tipo_id: tipo.tipo_id });
  return { folio: folio, version: 1 };
}

/** Acciones posteriores sobre un folio: nota, afectacion, reclasificar, cerrar, cancelar. */
function apiIncAction_(user, p) {
  var r = incFind_(user, p.folio);
  var can = incAllowed_(user, r);
  var accion = String(p.accion || '');
  if (!can.hasOwnProperty(accion) || accion === 'evidencia') throw new AppError('BAD_REQUEST', 'Acción desconocida.');
  if (!can[accion]) {
    if (r.estado !== INC.REG) throw new AppError('VALIDATION', 'El folio está ' + r.estado.toLowerCase() + '; ya no admite esa acción.');
    throw new AppError('FORBIDDEN', 'Tu rol no tiene permiso para esta acción.', 403);
  }
  if (accion !== 'nota' && p.version !== undefined && p.version !== null && Number(p.version) !== Number(r.version)) {
    throw new AppError('CONFLICT', 'Otra persona modificó este folio. Recarga para ver la versión actual.', 409);
  }
  var actor = user.correo;
  var now = nowIso_();
  var texto = cleanText_(p.texto, INC_TEXT_MAX);
  var res;

  if (accion === 'nota') {
    if (!texto) throw new AppError('VALIDATION', 'Escribe la nota.');
    res = { before: {}, after: r };   // una nota no cambia el folio ni su versión
    history_(r.folio, actor, 'nota', '', '', texto);
  }

  if (accion === 'afectacion') {
    var datos = parseJson_(r.datos);
    var patch = {};
    var changes = [];
    var desde = p.desde ? isoDate_(localToDate_(p.desde)) : now;
    if (desde > now) throw new AppError('VALIDATION', 'La hora del cambio no puede ser futura.');
    if (r.tipo_id === 'TIP-07') {
      var presentes = cleanNum_(p.presentes, 'Personal presente');
      if (presentes === '') throw new AppError('VALIDATION', 'Falta: Personal presente.');
      if (presentes > Number(datos.requerido)) throw new AppError('VALIDATION', 'El personal presente no puede ser mayor al requerido (' + datos.requerido + ').');
      var faltantes = Number(datos.requerido) - presentes;
      if (faltantes !== Number(datos.faltantes)) changes.push(['faltantes', datos.faltantes, faltantes]);
      datos.presentes = presentes; datos.faltantes = faltantes;
      patch.datos = JSON.stringify(datos);
    }
    if (p.comensales_afectados !== undefined && p.comensales_afectados !== '' && r.tipo_id !== 'TIP-01') {
      var c = cleanNum_(p.comensales_afectados, 'Comensales afectados');
      if (String(c) !== String(r.comensales_afectados)) { changes.push(['comensales_afectados', r.comensales_afectados, c]); patch.comensales_afectados = c; }
    }
    if (!changes.length) throw new AppError('VALIDATION', 'No hay cambios en la afectación.');
    res = update_('TRX_Incidencias', r.folio, patch, actor, p.version);
    changes.forEach(function (ch) { history_(r.folio, actor, 'afectacion', ch[0], ch[1], ch[2]); });
    if (texto) history_(r.folio, actor, 'nota', '', '', texto);
    if (r.tipo_id === 'TIP-07' && changes.some(function (ch) { return ch[0] === 'faltantes'; })) {
      closeEvents_(r.folio, desde, actor);
      if (datos.faltantes > 0) openEvent_(r.folio, desde, datos, res.after.comensales_afectados, actor);
    }
  }

  if (accion === 'reclasificar') {
    var tipo = catRow_('CAT_TiposIncidencia', 'tipo_id', String(p.tipo_id || ''));
    if (!tipo) throw new AppError('VALIDATION', 'Elige el nuevo tipo.');
    if (tipo.tipo_id === r.tipo_id) throw new AppError('VALIDATION', 'Elige un tipo distinto al actual.');
    if (!texto) throw new AppError('VALIDATION', 'Explica por qué se reclasifica.');
    var srv = catRow_('CAT_Servicios', 'servicio_id', r.servicio_id) || {};
    var nd = validateDatos_(tipo.tipo_id, p.datos, { planta_id: r.planta_id, servicio: srv, ymd: r.dia_operativo || String(r.detectada).slice(0, 10) });
    var nc = comensales_(tipo.tipo_id, p.comensales_afectados !== undefined ? p.comensales_afectados : r.comensales_afectados, nd);
    res = update_('TRX_Incidencias', r.folio, {
      tipo_id: tipo.tipo_id, categoria_id: tipo.categoria_id, critica: tipo.critico === 'Sí' ? 'SI' : 'NO',
      datos: JSON.stringify(nd), comensales_afectados: nc, tipo_original: r.tipo_original || r.tipo_id
    }, actor, p.version);
    history_(r.folio, actor, 'reclasificar', 'tipo_id', r.tipo_id, tipo.tipo_id);
    history_(r.folio, actor, 'reclasificar', 'datos', parseJson_(r.datos), nd);
    history_(r.folio, actor, 'nota', '', '', texto);
    if (r.tipo_id === 'TIP-07') closeEvents_(r.folio, now, actor);
    if (tipo.tipo_id === 'TIP-07') openEvent_(r.folio, now, nd, nc, actor);
  }

  if (accion === 'cerrar' || accion === 'cancelar') {
    if (!texto) throw new AppError('VALIDATION', accion === 'cerrar' ? 'Escribe la nota de cierre.' : 'Escribe el motivo de la cancelación.');
    var cp = accion === 'cerrar'
      ? { estado: INC.CER, cerrada: now, cerrada_por: actor, nota_cierre: texto }
      : { estado: INC.CAN, cancelada: now, cancelada_por: actor, motivo_cancelacion: texto };
    res = update_('TRX_Incidencias', r.folio, cp, actor, p.version);
    history_(r.folio, actor, accion === 'cerrar' ? 'cierre' : 'cancelacion', 'estado', r.estado, cp.estado);
    history_(r.folio, actor, 'nota', '', '', texto);
    closeEvents_(r.folio, now, actor);
  }

  logEvent_(actor, 'incidencia.' + accion, 'incidencia', r.folio, res.before, { estado: res.after.estado, tipo_id: res.after.tipo_id });
  return { folio: r.folio, version: Number(res.after.version), estado: res.after.estado };
}
