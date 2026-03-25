const rateLimit = require('express-rate-limit');

const limitarIntentos = (options = {}) => {
  const windowMs = options.windowMs ?? 15 * 60 * 1000;
  const max = options.max ?? 100;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: options.standardHeaders ?? true,
    legacyHeaders: options.legacyHeaders ?? false,
    message: options.message || { success: false, message: 'Demasiadas solicitudes' }
  });
};

const limitadorAPI = limitarIntentos({
  windowMs: 15 * 60 * 1000,
  max: 1000000,
  standardHeaders: true,
  legacyHeaders: false
});

const limitadorEndpoint = {
  crearCanal: limitarIntentos({ windowMs: 60 * 60 * 1000, max: 1000000 }),
  crearAnuncio: limitarIntentos({ windowMs: 60 * 60 * 1000, max: 1000000 }),
  crearCampania: limitarIntentos({ windowMs: 60 * 60 * 1000, max: 1000000 }),
  procesarPago: limitarIntentos({ windowMs: 15 * 60 * 1000, max: 1000000 })
};

module.exports = { limitarIntentos, limitadorAPI, limitadorEndpoint };
