// Configuración pública del frontend. Aquí NO van secretos: ambos valores son visibles para cualquier visitante.
window.FOODHUB_CONFIG = {
  // URL de la implementación web de Apps Script (termina en /exec).
  API_URL: 'PEGAR_AQUI_URL_EXEC',
  // ID de cliente OAuth de Google (tipo "Aplicación web"). Es público por diseño.
  GOOGLE_CLIENT_ID: 'PEGAR_AQUI_CLIENT_ID.apps.googleusercontent.com',
  // Minutos sin uso antes de cerrar la sesión en equipo compartido (debe coincidir con el backend).
  SHARED_IDLE_MIN: 10
};
