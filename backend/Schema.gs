/**
 * FoodHub — estructura de la base de datos en Google Sheets.
 *
 * Cada hoja es una tabla: fila 1 = encabezados, columna 1 = clave primaria.
 * Las tablas editables llevan además las columnas de control STD.
 * Los catálogos CAT_/AUD_Secciones/AUD_Puntos/IND_Indicadores toman sus columnas de Seed.gs.
 */

var STD = ['creado_en', 'creado_por', 'actualizado_en', 'actualizado_por', 'version', 'activo'];

var SCHEMA = {
  // ---- Sistema ----
  SYS_Usuarios:      ['usuario_id', 'correo', 'nombre', 'rol', 'plantas'],
  SYS_Sesiones:      ['sesion_id', 'usuario_id', 'token_hash', 'compartido', 'emitida', 'vence', 'ultimo_uso', 'revocada', 'dispositivo'],
  SYS_Idempotencia:  ['request_id', 'accion', 'usuario_id', 'resultado', 'expira'],
  SYS_Contadores:    ['contador_id', 'valor'],
  SYS_Notificaciones:['notificacion_id', 'clave', 'plantilla', 'destinatarios', 'entidad', 'entidad_id', 'programada', 'enviada', 'estado', 'error'],
  SYS_SyncEncuesta:  ['sync_id', 'inicio', 'fin', 'leidas', 'nuevas', 'actualizadas', 'faltantes', 'estado', 'error'],

  // ---- Transacciones (se usan desde la Fase 5) ----
  TRX_Incidencias:         ['folio', 'planta_id', 'servicio_id', 'tipo_id', 'categoria_id', 'reporta_usuario_id', 'detectada', 'registrada', 'notificada', 'primera_respuesta', 'solucion_reportada', 'solucion_verificada', 'cerrada', 'estado', 'critica', 'comensales_afectados', 'descripcion', 'datos', 'auditoria_respuesta_id'],
  TRX_HistorialIncidencia: ['historial_id', 'folio', 'fecha', 'actor', 'accion', 'campo', 'antes', 'despues'],
  TRX_EventosAfectacion:   ['evento_id', 'folio', 'inicio', 'fin', 'puesto_id', 'faltantes', 'comensales_afectados'],
  TRX_RespuestasProveedor: ['respuesta_id', 'folio', 'fecha', 'tipo', 'causa', 'accion', 'responsable', 'texto'],
  TRX_Compromisos:         ['compromiso_id', 'folio', 'numero', 'fecha_compromiso', 'estado', 'solicitado', 'resuelto_por', 'resuelto_en', 'motivo'],
  TRX_TokensAcceso:        ['token_id', 'folio', 'token_hash', 'emitido', 'vence', 'revocado', 'usos', 'ultimo_uso'],
  TRX_Evidencias:          ['evidencia_id', 'entidad', 'entidad_id', 'archivo_id', 'nombre', 'tipo', 'bytes', 'visible_proveedor'],

  // ---- Auditoría ----
  AUD_Programacion: ['programacion_id', 'planta_id', 'periodo', 'fecha', 'responsable_enfermeria', 'responsable_servicios', 'contacto_proveedor', 'estado'],
  AUD_Auditorias:   ['auditoria_id', 'programacion_id', 'evaluador', 'participante_proveedor', 'inicio', 'fin', 'avance', 'estado'],
  AUD_Respuestas:   ['respuesta_id', 'auditoria_id', 'punto_id', 'resultado', 'observacion', 'justificacion', 'folio_generado'],

  // ---- Indicadores y encuesta ----
  IND_MetasPonderaciones:  ['meta_id', 'indicador_id', 'grupo', 'meta', 'peso', 'vigencia', 'estado', 'aprobado_por'],
  IND_ResultadosMensuales: ['resultado_id', 'planta_id', 'periodo', 'indicador_id', 'numerador', 'denominador', 'valor', 'version_calculo'],
  ENC_Respuestas:          ['enc_id', 'huella', 'ocurrencia', 'fecha', 'planta_id', 'calificacion', 'etiqueta', 'motivos', 'comentario', 'servicio_id', 'esquema', 'positiva', 'origen_servicio', 'vista_primera', 'vista_ultima', 'en_origen']
};

/** Tablas sin columnas STD (registros de solo inserción o técnicos). */
var NO_STD = { SYS_Sesiones: 1, SYS_Idempotencia: 1, SYS_Contadores: 1, TRX_HistorialIncidencia: 1, SYS_SyncEncuesta: 1 };

/** La bitácora vive en un libro aparte para no crecer el principal. */
var LOG_SCHEMA = { SYS_Bitacora: ['bitacora_id', 'fecha', 'actor', 'accion', 'entidad', 'entidad_id', 'antes', 'despues'] };

/** Roles fijos y sus permisos. Las plantas de cada usuario se configuran en SYS_Usuarios. */
var ROLES = {
  adm: { nombre: 'Administrador', permisos: ['*'] },
  enf: { nombre: 'Enfermería', permisos: [
    'catalogo.ver', 'incidencia.crear', 'incidencia.ver', 'incidencia.afectacion',
    'auditoria.realizar', 'evidencia.subir', 'solucion.verificar', 'evaluacion.ver', 'reporte.ver'] },
  ser: { nombre: 'Servicios', permisos: [
    'catalogo.ver', 'incidencia.crear', 'incidencia.ver', 'incidencia.afectacion', 'incidencia.cerrar',
    'auditoria.realizar', 'auditoria.programar', 'compromiso.revisar', 'prorroga.aprobar', 'solucion.validar',
    'enlace.revocar', 'evidencia.subir', 'solucion.verificar', 'evaluacion.ver', 'reporte.ver', 'config.responsables'] }
};

/** Pantallas del frontend por permiso (el backend vuelve a validar cada acción). */
var SCREENS = [
  ['inicio', 'evaluacion.ver'], ['nueva', 'incidencia.crear'], ['seguimiento', 'incidencia.ver'],
  ['auditoria', 'auditoria.realizar'], ['calendario', 'auditoria.realizar'], ['evaluacion', 'evaluacion.ver'],
  ['reportes', 'reporte.ver'], ['configuracion', 'config.responsables']
];

function hasPerm_(user, perm) {
  var r = ROLES[user.rol];
  if (!r) return false;
  return r.permisos.indexOf('*') >= 0 || r.permisos.indexOf(perm) >= 0;
}

/** Plantas visibles para el usuario: '*' = todas. */
function userPlants_(user) {
  var p = String(user.plantas || '').trim();
  if (user.rol === 'adm' || p === '*') return '*';
  return p.split(',').map(function (s) { return s.trim(); }).filter(String);
}

function canSeePlant_(user, plantaId) {
  var p = userPlants_(user);
  return p === '*' || p.indexOf(plantaId) >= 0;
}
