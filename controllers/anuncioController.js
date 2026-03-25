const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('anuncios');

module.exports = {
  crearAnuncio: h,
  trackClick: h,
  trackConversion: h,
  obtenerMisAnuncios: h,
  obtenerAnunciosParaCreador: h,
  obtenerEstadisticas: h,
  obtenerAnuncio: h,
  actualizarAnuncio: h,
  eliminarAnuncio: h,
  enviarParaAprobacion: h,
  responderAprobacion: h,
  activarAnuncio: h,
  completarAnuncio: h,
  buscarAnuncios: h
};

