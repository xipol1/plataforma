const { notImplementedHandler } = require('../lib/notImplemented');

const h = notImplementedHandler('estadisticas');

module.exports = {
  getEstadisticasGenerales: h,
  getDashboardStats: h,
  getEstadisticasCanal: h,
  registrarEstadisticasCanal: h,
  getEstadisticasAnuncio: h,
  registrarEstadisticasAnuncio: h
};

