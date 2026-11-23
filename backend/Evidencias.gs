/**
 * FoodHub — evidencias (fotos y PDF) en una carpeta privada de Drive.
 *
 * - La carpeta "FoodHub – Evidencias" la crea setup() y no se comparte con nadie.
 * - El navegador reduce las fotos a 1600 px en JPG antes de enviarlas.
 * - El servidor revisa el tipo real por los primeros bytes, no por el nombre.
 * - Los archivos solo se ven a través del backend, con sesión y permiso sobre la planta.
 * - Una evidencia no se borra: se marca como retirada, con motivo, y queda en el historial.
 */

var EVID = {
  MAX_BYTES: 5 * 1024 * 1024,
  MAX_POR_FOLIO: 20,              // límite técnico de archivos activos por folio
  TIPOS: { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }
};

function evidFolder_() {
  var id = requireProp_('EVID_FOLDER_ID');
  return DriveApp.getFolderById(id);
}

/** Tipo real por la firma de los primeros bytes. */
function sniffMime_(bytes) {
  var b = function (i) { return (bytes[i] + 256) % 256; };
  if (bytes.length > 3 && b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) return 'image/jpeg';
  if (bytes.length > 8 && b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) return 'image/png';
  if (bytes.length > 4 && b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return 'application/pdf';
  return null;
}

function apiEvidAdd_(user, p) {
  var inc = incFind_(user, p.folio);
  if (!incAllowed_(user, inc).evidencia) throw new AppError('FORBIDDEN', 'No puedes agregar evidencia a este folio.', 403);
  var data = String(p.data || '');
  if (!data) throw new AppError('VALIDATION', 'Falta el archivo.');
  if (data.length > Math.ceil(EVID.MAX_BYTES / 3) * 4 + 8) throw new AppError('VALIDATION', 'El archivo pasa de 5 MB.');
  var bytes;
  try { bytes = Utilities.base64Decode(data); } catch (e) { throw new AppError('VALIDATION', 'El archivo llegó dañado. Intenta de nuevo.'); }
  if (bytes.length > EVID.MAX_BYTES) throw new AppError('VALIDATION', 'El archivo pasa de 5 MB.');
  var mime = sniffMime_(bytes);
  if (!mime) throw new AppError('VALIDATION', 'Solo se aceptan fotos JPG o PNG y documentos PDF.');
  var activos = all_('TRX_Evidencias').filter(function (e) { return e.entidad === 'incidencia' && e.entidad_id === inc.folio && e.retirada !== 'SI'; });
  if (activos.length >= EVID.MAX_POR_FOLIO) throw new AppError('VALIDATION', 'Este folio ya tiene ' + EVID.MAX_POR_FOLIO + ' archivos. Retira alguno antes de agregar otro.');

  var id = uid_('EVI');
  var nombre = cleanText_(p.nombre, 120).replace(/[\\\/:*?"<>|]/g, '_') || ('evidencia.' + EVID.TIPOS[mime]);
  var file = evidFolder_().createFile(Utilities.newBlob(bytes, mime, inc.folio + '_' + id + '.' + EVID.TIPOS[mime]));
  insert_('TRX_Evidencias', {
    evidencia_id: id, entidad: 'incidencia', entidad_id: inc.folio, archivo_id: file.getId(), nombre: nombre,
    tipo: mime, bytes: bytes.length, visible_proveedor: p.interna ? 'NO' : 'SI', retirada: 'NO'
  }, user.correo);
  history_(inc.folio, user.correo, 'evidencia', nombre, '', p.interna ? 'interna' : 'visible para el concesionario');
  logEvent_(user.correo, 'evidencia.subir', 'incidencia', inc.folio, null, { evidencia_id: id, bytes: bytes.length, tipo: mime });
  return { evidencia_id: id };
}

function evidFind_(user, evidenciaId) {
  var e = findBy_('TRX_Evidencias', 'evidencia_id', String(evidenciaId || ''));
  if (!e || e.entidad !== 'incidencia') throw new AppError('NOT_FOUND', 'No se encontró el archivo.', 404);
  var inc = incFind_(user, e.entidad_id);
  return { e: e, inc: inc };
}

/** Entrega el archivo en base64 solo a quien puede ver la planta del folio. */
function apiEvidGet_(user, p) {
  var f = evidFind_(user, p.evidencia_id);
  var blob = DriveApp.getFileById(f.e.archivo_id).getBlob();
  return { evidencia_id: f.e.evidencia_id, nombre: f.e.nombre, tipo: f.e.tipo, data: Utilities.base64Encode(blob.getBytes()) };
}

/** Retira (no borra) una evidencia: quien la subió, Servicios o Admin, con motivo. */
function apiEvidRetire_(user, p) {
  var f = evidFind_(user, p.evidencia_id);
  if (f.e.retirada === 'SI') throw new AppError('VALIDATION', 'Ese archivo ya estaba retirado.');
  if (f.e.creado_por !== user.correo && !hasPerm_(user, 'incidencia.cerrar')) throw new AppError('FORBIDDEN', 'Solo quien subió el archivo, Servicios o el administrador pueden retirarlo.', 403);
  var motivo = cleanText_(p.motivo, 500);
  if (!motivo) throw new AppError('VALIDATION', 'Escribe el motivo para retirar el archivo.');
  update_('TRX_Evidencias', f.e.evidencia_id, { retirada: 'SI', motivo_retiro: motivo }, user.correo);
  history_(f.inc.folio, user.correo, 'evidencia.retirada', f.e.nombre, '', motivo);
  logEvent_(user.correo, 'evidencia.retirar', 'incidencia', f.inc.folio, null, { evidencia_id: f.e.evidencia_id, motivo: motivo });
  return { ok: true };
}
