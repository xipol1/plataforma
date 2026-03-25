const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('files');

module.exports = {
  obtenerArchivo: h,
  obtenerThumbnail: h,
  subirArchivos: h,
  listarArchivos: h,
  buscarArchivos: h,
  obtenerEstadisticas: h,
  obtenerInfoArchivo: h,
  descargarArchivo: h,
  actualizarArchivo: h,
  eliminarArchivo: h,
  limpiarTemporales: h,
  limpiarExpirados: h
};

