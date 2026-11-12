/**
 * FoodHub — bitácora de actividad (libro aparte, solo inserción).
 * Nunca debe romper la operación principal: si falla, se registra en la consola.
 */
function logEvent_(actor, accion, entidad, entidadId, antes, despues) {
  try {
    insert_('SYS_Bitacora', {
      bitacora_id: uid_('LOG'), fecha: nowIso_(), actor: actor || 'sistema', accion: accion,
      entidad: entidad || '', entidad_id: entidadId || '',
      antes: antes ? JSON.stringify(antes).slice(0, 5000) : '',
      despues: despues ? JSON.stringify(despues).slice(0, 5000) : ''
    });
  } catch (e) {
    console.error('Bitácora no disponible: ' + (e && e.message));
  }
}
