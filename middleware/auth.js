const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const config = require('../config/config');

/**
 * Middleware de autenticación
 * Verifica el token JWT y agrega la información del usuario a req.user
 */
exports.autenticar = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado.'
      });
    }

    // Verificar formato del token (Bearer <token>)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Formato de token inválido.'
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, config.jwt.secret);

    if (decoded && decoded.isDemo) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        verificado: true,
        isDemo: true
      };
      return next();
    }
    
    // Buscar usuario en la base de datos
    const usuario = await Usuario.findById(decoded.userId)
      .select('-password -refreshTokens');
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido. Usuario no encontrado.'
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al soporte.'
      });
    }

    // Agregar usuario a la request
    req.user = {
      id: usuario._id,
      email: usuario.email,
      role: usuario.rol,
      verificado: Boolean(usuario.verificacion?.emailVerificado),
      usuario: usuario // Objeto completo del usuario
    };

    next();

  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};

/**
 * Middleware de autorización por rol
 * Verifica que el usuario tenga uno de los roles permitidos
 */
exports.autorizarRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
      });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Permisos insuficientes.'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar email verificado
 * Requiere que el usuario haya verificado su email
 */
exports.requiereEmailVerificado = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado.'
    });
  }

  if (!req.user.verificado) {
    return res.status(403).json({
      success: false,
      message: 'Email no verificado. Verifica tu email para continuar.'
    });
  }

  next();
};

/**
 * Middleware para verificar propiedad de recurso
 * Verifica que el usuario sea propietario del recurso o admin
 */
exports.verificarPropietario = (campoUsuario = 'usuario') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado.'
        });
      }

      // Los admins pueden acceder a cualquier recurso
      if (req.user.role === 'admin') {
        return next();
      }

      // Obtener ID del recurso desde parámetros o body
      const recursoId = req.params.id || req.body.id;
      
      if (!recursoId) {
        return res.status(400).json({
          success: false,
          message: 'ID del recurso requerido.'
        });
      }

      // El usuario debe ser propietario del recurso
      // Esta verificación se debe hacer en el controlador específico
      // ya que depende del modelo del recurso
      req.verificarPropietario = true;
      req.campoUsuario = campoUsuario;
      
      next();

    } catch (error) {
      console.error('Error en verificación de propietario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor.'
      });
    }
  };
};

/**
 * Middleware opcional de autenticación
 * Agrega información del usuario si está autenticado, pero no requiere autenticación
 */
exports.autenticacionOpcional = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      if (decoded && decoded.isDemo) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          verificado: true,
          isDemo: true
        };
        return next();
      }

      const usuario = await Usuario.findById(decoded.userId)
        .select('-password -refreshTokens');
      
      if (usuario && usuario.activo) {
        req.user = {
          id: usuario._id,
          email: usuario.email,
          role: usuario.rol,
          verificado: Boolean(usuario.verificacion?.emailVerificado),
          usuario: usuario
        };
      }
    } catch (error) {
      // Token inválido o expirado, continuar sin usuario
      void error;
    }

    next();

  } catch (error) {
    console.error('Error en autenticación opcional:', error);
    next(); // Continuar sin usuario en caso de error
  }
};

/**
 * Middleware para verificar límites de API por usuario
 * Implementa rate limiting específico por usuario autenticado
 */
exports.limitePorUsuario = (limite = 100, ventana = 60 * 60 * 1000) => {
  const contadores = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const ahora = Date.now();
    const ventanaInicio = ahora - ventana;

    // Limpiar contadores antiguos
    if (contadores.has(userId)) {
      const solicitudes = contadores.get(userId);
      const solicitudesFiltradas = solicitudes.filter(tiempo => tiempo > ventanaInicio);
      contadores.set(userId, solicitudesFiltradas);
    }

    // Obtener solicitudes actuales
    const solicitudesActuales = contadores.get(userId) || [];

    if (solicitudesActuales.length >= limite) {
      return res.status(429).json({
        success: false,
        message: 'Límite de solicitudes excedido. Intenta de nuevo más tarde.',
        limite,
        ventana: ventana / 1000 / 60, // en minutos
        reinicio: new Date(solicitudesActuales[0] + ventana)
      });
    }

    // Agregar solicitud actual
    solicitudesActuales.push(ahora);
    contadores.set(userId, solicitudesActuales);

    // Agregar headers informativos
    res.set({
      'X-RateLimit-Limit': limite,
      'X-RateLimit-Remaining': limite - solicitudesActuales.length,
      'X-RateLimit-Reset': new Date(ahora + ventana)
    });

    next();
  };
};

/**
 * Middleware para verificar permisos específicos
 * Verifica permisos granulares basados en el usuario y recurso
 */
exports.verificarPermisos = (accion, recurso) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado.'
        });
      }

      // Definir matriz de permisos
      const permisos = {
        admin: {
          '*': ['*'] // Admin puede hacer todo
        },
        creator: {
          canal: ['crear', 'leer', 'actualizar', 'eliminar'], // Solo sus propios canales
          anuncio: ['leer', 'actualizar'], // Solo anuncios dirigidos a sus canales
          transaccion: ['leer'], // Solo sus propias transacciones
          usuario: ['leer', 'actualizar'] // Solo su propio perfil
        },
        advertiser: {
          anuncio: ['crear', 'leer', 'actualizar', 'eliminar'], // Solo sus propios anuncios
          canal: ['leer'], // Puede ver canales públicos
          transaccion: ['leer'], // Solo sus propias transacciones
          usuario: ['leer', 'actualizar'] // Solo su propio perfil
        }
      };

      // Verificar permisos
      const permisosRol = permisos[req.user.role];
      if (!permisosRol) {
        return res.status(403).json({
          success: false,
          message: 'Rol no reconocido.'
        });
      }

      // Admin tiene acceso total
      if (permisosRol['*'] && permisosRol['*'].includes('*')) {
        return next();
      }

      // Verificar permiso específico
      const accionesPermitidas = permisosRol[recurso];
      if (!accionesPermitidas || !accionesPermitidas.includes(accion)) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para ${accion} ${recurso}.`
        });
      }

      next();

    } catch (error) {
      console.error('Error en verificación de permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor.'
      });
    }
  };
};

/**
 * Middleware para logging de actividad del usuario
 * Registra las acciones importantes del usuario
 */
exports.logActividad = (accion, detalles = {}) => {
  return async (req, res, next) => {
    try {
      if (req.user) {
        // Actualizar última actividad del usuario
        await Usuario.findByIdAndUpdate(req.user.id, {
          ultimaActividad: new Date()
        });
      }

      next();

    } catch (error) {
      console.error('Error en logging de actividad:', error);
      next(); // Continuar aunque falle el logging
    }
  };
};

/**
 * Middleware para verificar estado de la cuenta
 * Verifica que la cuenta esté en buen estado (no suspendida, etc.)
 */
exports.verificarEstadoCuenta = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado.'
      });
    }

    const usuario = await Usuario.findById(req.user.id)
      .select('activo estado fechaSuspension motivoSuspension');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al soporte.'
      });
    }

    if (usuario.estado === 'suspendido') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta suspendida.',
        detalles: {
          fechaSuspension: usuario.fechaSuspension,
          motivo: usuario.motivoSuspension
        }
      });
    }

    if (usuario.estado === 'pendiente_verificacion') {
      return res.status(403).json({
        success: false,
        message: 'Cuenta pendiente de verificación. Completa el proceso de verificación.'
      });
    }

    next();

  } catch (error) {
    console.error('Error en verificación de estado de cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor.'
    });
  }
};
