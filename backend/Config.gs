/**
 * FoodHub — configuración general del backend.
 *
 * Propiedades del Script (Proyecto > Configuración > Propiedades del script):
 *   ADMIN_EMAIL        Correo del primer administrador; solo lo usa setup().
 *   DB_ID              ID de la hoja de cálculo principal (lo escribe setup()).
 *   LOG_ID             ID de la hoja de bitácora (lo escribe setup()).
 *   PEPPER             Secreto aleatorio para hashear tokens (lo escribe setup(); no compartir).
 *   ALLOWED_ORIGIN     Opcional. URL de GitHub Pages; solo informativo en /health.
 */

var APP = {
  NAME: 'FoodHub',
  VERSION: '0.4.1',
  TZ: 'America/Chihuahua',
  SESSION_REMEMBER_DAYS: 30,          // "Recordar este equipo" (como TalentHub)
  SESSION_HOURS: 6,                   // sin recordar, por ejemplo la tablet compartida
  CODE_MINUTES: 10,                   // vigencia del código enviado por correo
  CODE_ATTEMPTS: 5,                   // intentos antes de pedir otro código
  CODES_PER_HOUR: 5,                  // códigos por correo en una hora
  CACHE_USERS_SEC: 60,
  CACHE_CATALOG_SEC: 300,
  CACHE_SESSION_SEC: 21600,           // 6 h (máximo de CacheService)
  IDEMPOTENCY_HOURS: 24,
  LOCK_WAIT_MS: 20000
};

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function requireProp_(key) {
  var v = prop_(key);
  if (!v) throw new AppError('CONFIG', 'Falta la propiedad del script ' + key + '. Revisa la guía de instalación.');
  return v;
}

/** Error controlado: su mensaje se muestra al usuario. */
function AppError(code, message, status) {
  this.code = code;
  this.message = message;
  this.status = status || 400;
}
AppError.prototype = Object.create(Error.prototype);
AppError.prototype.name = 'AppError';
