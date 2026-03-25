const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('notifications');

module.exports = {
  obtenerNotificaciones: h,
  contarNoLeidas: h,
  buscarNotificaciones: h,
  obtenerEstadisticas: h,
  obtenerNotificacion: h,
  marcarTodasComoLeidas: h,
  marcarComoLeida: h,
  archivarNotificacion: h,
  eliminarNotificacion: h,
  crearNotificacion: h,
  enviarNotificacionMasiva: h,
  limpiarExpiradas: h,
  limpiarAntiguas: h
};

