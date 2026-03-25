const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('canales');

module.exports = {
  registerChannel: h,
  buscarCanales: h,
  obtenerCanal: h,
  crearCanal: h,
  obtenerMisCanales: h,
  actualizarCanal: h,
  eliminarCanal: h,
  actualizarEstadisticas: h,
  calificarCanal: h,
  obtenerEstadisticas: h,
  cambiarEstado: h,
  obtenerCanalesParaModeracion: h
};

