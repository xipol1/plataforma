const rateLimit = require('express-rate-limit');
const MongoStore = require('rate-limit-mongo');
const config = require('../config/config');

/**
 * Configuración base para rate limiting
 */
const configuracionBase = {
  standardHeaders: true, // Retorna rate limit info en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  
  // Función para generar mensaje de error personalizado
  message: (req, res) => {
    return {
      success: false,
      message: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
      limite: req.rateLimit.limit,
      restantes: req.rateLimit.remaining,
      reinicio: new Date(req.rateLimit.resetTime)
    };
  },
  
  // Función para manejar cuando se excede el límite
  handler: (req, res) => {
    const mensaje = typeof configuracionBase.message === 'function' 
      ? configuracionBase.message(req, res)
      : configuracionBase.message;
    
    res.status(429).json(mensaje);
  },
  
  // Función para generar clave única por IP
  keyGenerator: (req) => {
    return req.ip;
  },
  
  // Función para omitir rate limiting (ej: para IPs whitelisted)
  skip: (req) => {
    // Lista de IPs que no tienen rate limiting
    const ipsExentas = process.env.RATE_LIMIT_WHITELIST 
      ? process.env.RATE_LIMIT_WHITELIST.split(',') 
      : [];
    
    return ipsExentas.includes(req.ip);
  }
};

/**
 * Store para MongoDB (opcional, para aplicaciones distribuidas)
 */
const crearMongoStore = () => {
  if (config.database.uri) {
    return new MongoStore({
      uri: config.database.uri,
      collectionName: 'rate_limits',
      expireTimeMs: 15 * 60 * 1000 // 15 minutos
    });
  }
  return undefined;
};

/**
 * Rate limiter general para toda la aplicación
 */
exports.limitadorGeneral = rateLimit({
  ...configuracionBase,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // 1000 solicitudes por IP por ventana
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Límite general excedido.',
    tipo: 'limite_general'
  }
});

/**
 * Rate limiter estricto para autenticación
 */
exports.limitadorAuth = rateLimit({
  ...configuracionBase,
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    tipo: 'limite_auth'
  },
  
  // Solo aplicar a rutas de login/registro
  skip: (req) => {
    const rutasAuth = ['/login', '/registro', '/restablecer-password'];
    const esRutaAuth = rutasAuth.some(ruta => req.path.includes(ruta));
    return !esRutaAuth || configuracionBase.skip(req);
  }
});

/**
 * Rate limiter para APIs públicas
 */
exports.limitadorAPI = rateLimit({
  ...configuracionBase,
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100, // 100 solicitudes por IP por hora
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Límite de API excedido. Máximo 100 solicitudes por hora.',
    tipo: 'limite_api'
  }
});

/**
 * Rate limiter para subida de archivos
 */
exports.limitadorArchivos = rateLimit({
  ...configuracionBase,
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 subidas por IP por hora
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Límite de subida de archivos excedido. Máximo 20 archivos por hora.',
    tipo: 'limite_archivos'
  }
});

/**
 * Rate limiter para búsquedas
 */
exports.limitadorBusqueda = rateLimit({
  ...configuracionBase,
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Demasiadas búsquedas. Máximo 30 búsquedas por minuto.',
    tipo: 'limite_busqueda'
  }
});

/**
 * Rate limiter para emails (verificación, restablecimiento, etc.)
 */
exports.limitadorEmail = rateLimit({
  ...configuracionBase,
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 emails por IP por hora
  store: crearMongoStore(),
  message: {
    success: false,
    message: 'Límite de envío de emails excedido. Máximo 3 emails por hora.',
    tipo: 'limite_email'
  }
});

/**
 * Función para crear rate limiter personalizado
 */
exports.limitarIntentos = (opciones = {}) => {
  const opcionesCompletas = {
    ...configuracionBase,
    windowMs: opciones.windowMs || 15 * 60 * 1000,
    max: opciones.max || 100,
    message: opciones.message || configuracionBase.message,
    store: opciones.useMongoStore ? crearMongoStore() : undefined,
    ...opciones
  };

  return rateLimit(opcionesCompletas);
};

/**
 * Rate limiter basado en usuario autenticado
 */
exports.limitadorPorUsuario = (opciones = {}) => {
  const {
    windowMs = 60 * 60 * 1000, // 1 hora
    max = 1000, // 1000 solicitudes por usuario por hora
    mensaje = 'Límite de solicitudes por usuario excedido'
  } = opciones;

  const contadores = new Map();

  return (req, res, next) => {
    // Si no hay usuario autenticado, usar IP
    const clave = req.user ? `user_${req.user.id}` : `ip_${req.ip}`;
    const ahora = Date.now();
    const ventanaInicio = ahora - windowMs;

    // Limpiar contadores antiguos
    if (contadores.has(clave)) {
      const solicitudes = contadores.get(clave);
      const solicitudesFiltradas = solicitudes.filter(tiempo => tiempo > ventanaInicio);
      contadores.set(clave, solicitudesFiltradas);
    }

    // Obtener solicitudes actuales
    const solicitudesActuales = contadores.get(clave) || [];

    if (solicitudesActuales.length >= max) {
      return res.status(429).json({
        success: false,
        message: mensaje,
        limite: max,
        restantes: 0,
        reinicio: new Date(solicitudesActuales[0] + windowMs),
        tipo: 'limite_usuario'
      });
    }

    // Agregar solicitud actual
    solicitudesActuales.push(ahora);
    contadores.set(clave, solicitudesActuales);

    // Agregar headers informativos
    res.set({
      'X-RateLimit-Limit': max,
      'X-RateLimit-Remaining': max - solicitudesActuales.length,
      'X-RateLimit-Reset': new Date(ahora + windowMs).toISOString(),
      'X-RateLimit-Window': windowMs
    });

    next();
  };
};

/**
 * Rate limiter progresivo (aumenta restricciones con el tiempo)
 */
exports.limitadorProgresivo = (opciones = {}) => {
  const {
    ventanas = [
      { tiempo: 60 * 1000, limite: 10 },      // 1 minuto: 10 solicitudes
      { tiempo: 15 * 60 * 1000, limite: 50 }, // 15 minutos: 50 solicitudes
      { tiempo: 60 * 60 * 1000, limite: 200 } // 1 hora: 200 solicitudes
    ],
    mensaje = 'Límite progresivo excedido'
  } = opciones;

  const contadores = new Map();

  return (req, res, next) => {
    const clave = req.ip;
    const ahora = Date.now();

    // Obtener o crear contador para esta IP
    if (!contadores.has(clave)) {
      contadores.set(clave, []);
    }

    const solicitudes = contadores.get(clave);

    // Verificar cada ventana de tiempo
    for (const ventana of ventanas) {
      const ventanaInicio = ahora - ventana.tiempo;
      const solicitudesEnVentana = solicitudes.filter(tiempo => tiempo > ventanaInicio);

      if (solicitudesEnVentana.length >= ventana.limite) {
        return res.status(429).json({
          success: false,
          message: `${mensaje}. Máximo ${ventana.limite} solicitudes en ${ventana.tiempo / 1000} segundos.`,
          limite: ventana.limite,
          ventana: ventana.tiempo,
          tipo: 'limite_progresivo'
        });
      }
    }

    // Agregar solicitud actual
    solicitudes.push(ahora);

    // Limpiar solicitudes antiguas (mantener solo la ventana más larga)
    const ventanaMasLarga = Math.max(...ventanas.map(v => v.tiempo));
    const solicitudesFiltradas = solicitudes.filter(tiempo => tiempo > ahora - ventanaMasLarga);
    contadores.set(clave, solicitudesFiltradas);

    next();
  };
};

/**
 * Rate limiter para endpoints específicos
 */
exports.limitadorEndpoint = {
  // Para creación de anuncios
  crearAnuncio: rateLimit({
    ...configuracionBase,
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 anuncios por hora
    message: {
      success: false,
      message: 'Límite de creación de anuncios excedido. Máximo 10 anuncios por hora.',
      tipo: 'limite_crear_anuncio'
    }
  }),

  // Para creación de canales
  crearCanal: rateLimit({
    ...configuracionBase,
    windowMs: 24 * 60 * 60 * 1000, // 24 horas
    max: 3, // 3 canales por día
    message: {
      success: false,
      message: 'Límite de creación de canales excedido. Máximo 3 canales por día.',
      tipo: 'limite_crear_canal'
    }
  }),

  // Para mensajes/comunicación
  enviarMensaje: rateLimit({
    ...configuracionBase,
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 mensajes por minuto
    message: {
      success: false,
      message: 'Límite de mensajes excedido. Máximo 5 mensajes por minuto.',
      tipo: 'limite_mensajes'
    }
  }),

  // Para reportes/denuncias
  crearReporte: rateLimit({
    ...configuracionBase,
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // 5 reportes por hora
    message: {
      success: false,
      message: 'Límite de reportes excedido. Máximo 5 reportes por hora.',
      tipo: 'limite_reportes'
    }
  })
};

/**
 * Middleware para logging de rate limiting
 */
exports.logRateLimit = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Si es una respuesta 429 (Too Many Requests), loggear
    if (res.statusCode === 429) {
      console.log(`[RATE LIMIT] IP: ${req.ip}, Ruta: ${req.path}, Usuario: ${req.user?.id || 'Anónimo'}, Tiempo: ${new Date().toISOString()}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Función para limpiar contadores (útil para testing)
 */
exports.limpiarContadores = () => {
  // Esta función se puede usar en tests para limpiar los contadores en memoria
  console.log('Limpiando contadores de rate limiting...');
};

/**
 * Middleware para bypass de rate limiting en desarrollo
 */
exports.bypassEnDesarrollo = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_RATE_LIMIT === 'true') {
    return next();
  }
  
  // En producción, continuar con rate limiting normal
  next();
};