const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('transacciones');

module.exports = {
  obtenerMisTransacciones: h,
  obtenerEstadisticasFinancieras: h,
  obtenerTransaccion: h,
  procesarPagoAnuncio: h,
  liberarPagoCreador: h,
  procesarReembolso: h,
  obtenerTransaccionesAdmin: h
};

