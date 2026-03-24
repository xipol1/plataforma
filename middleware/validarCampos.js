const { validationResult } = require('express-validator');

/**
 * Middleware para validar campos usando express-validator
 * Verifica si hay errores de validación y los retorna en formato estándar
 */
exports.validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    // Formatear errores para respuesta consistente
    const erroresFormateados = errores.array().map(error => ({
      campo: error.path || error.param,
      valor: error.value,
      mensaje: error.msg,
      ubicacion: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errores: erroresFormateados,
      // Para compatibilidad con frontend
      errors: erroresFormateados.reduce((acc, error) => {
        acc[error.campo] = error.mensaje;
        return acc;
      }, {})
    });
  }

  next();
};

/**
 * Middleware para validar campos con respuesta personalizada
 * Permite personalizar el mensaje de error principal
 */
exports.validarCamposPersonalizado = (mensajePersonalizado) => {
  return (req, res, next) => {
    const errores = validationResult(req);
    
    if (!errores.isEmpty()) {
      const erroresFormateados = errores.array().map(error => ({
        campo: error.path || error.param,
        valor: error.value,
        mensaje: error.msg,
        ubicacion: error.location
      }));

      return res.status(400).json({
        success: false,
        message: mensajePersonalizado || 'Errores de validación',
        errores: erroresFormateados,
        errors: erroresFormateados.reduce((acc, error) => {
          acc[error.campo] = error.mensaje;
          return acc;
        }, {})
      });
    }

    next();
  };
};

/**
 * Middleware para validar y sanitizar datos de entrada
 * Combina validación con sanitización básica
 */
exports.validarYSanitizar = (req, res, next) => {
  const errores = validationResult(req);
  
  if (!errores.isEmpty()) {
    const erroresFormateados = errores.array().map(error => ({
      campo: error.path || error.param,
      valor: error.value,
      mensaje: error.msg,
      ubicacion: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errores: erroresFormateados,
      errors: erroresFormateados.reduce((acc, error) => {
        acc[error.campo] = error.mensaje;
        return acc;
      }, {})
    });
  }

  // Sanitización básica adicional
  if (req.body) {
    // Remover campos vacíos y null
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === '' || req.body[key] === null) {
        delete req.body[key];
      }
      
      // Trim strings
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
        
        // Remover si queda vacío después del trim
        if (req.body[key] === '') {
          delete req.body[key];
        }
      }
    });
  }

  next();
};

/**
 * Middleware para validar archivos subidos
 * Valida tipo, tamaño y otros aspectos de archivos
 */
exports.validarArchivos = (opciones = {}) => {
  const {
    tiposPermitidos = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    tamañoMaximo = 5 * 1024 * 1024, // 5MB por defecto
    cantidadMaxima = 5,
    requerido = false
  } = opciones;

  return (req, res, next) => {
    const archivos = req.files;
    const errores = [];

    // Verificar si es requerido
    if (requerido && (!archivos || archivos.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Al menos un archivo es requerido',
        errores: [{
          campo: 'archivos',
          mensaje: 'Al menos un archivo es requerido'
        }]
      });
    }

    // Si no hay archivos y no es requerido, continuar
    if (!archivos || archivos.length === 0) {
      return next();
    }

    // Verificar cantidad
    if (archivos.length > cantidadMaxima) {
      errores.push({
        campo: 'archivos',
        mensaje: `Máximo ${cantidadMaxima} archivos permitidos`
      });
    }

    // Validar cada archivo
    archivos.forEach((archivo, index) => {
      // Verificar tipo
      if (!tiposPermitidos.includes(archivo.mimetype)) {
        errores.push({
          campo: `archivo_${index}`,
          mensaje: `Tipo de archivo no permitido: ${archivo.mimetype}. Tipos permitidos: ${tiposPermitidos.join(', ')}`
        });
      }

      // Verificar tamaño
      if (archivo.size > tamañoMaximo) {
        errores.push({
          campo: `archivo_${index}`,
          mensaje: `Archivo demasiado grande: ${(archivo.size / 1024 / 1024).toFixed(2)}MB. Máximo permitido: ${(tamañoMaximo / 1024 / 1024).toFixed(2)}MB`
        });
      }

      // Verificar nombre de archivo
      if (!archivo.originalname || archivo.originalname.length > 255) {
        errores.push({
          campo: `archivo_${index}`,
          mensaje: 'Nombre de archivo inválido o demasiado largo'
        });
      }
    });

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Errores en la validación de archivos',
        errores
      });
    }

    next();
  };
};

/**
 * Middleware para validar parámetros de paginación
 * Valida y sanitiza parámetros comunes de paginación
 */
exports.validarPaginacion = (req, res, next) => {
  const { page = 1, limit = 10, sort, order = 'desc' } = req.query;

  // Validar y convertir página
  const pageNum = parseInt(page, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      message: 'Número de página inválido',
      errores: [{
        campo: 'page',
        mensaje: 'La página debe ser un número mayor a 0'
      }]
    });
  }

  // Validar y convertir límite
  const limitNum = parseInt(limit, 10);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      message: 'Límite inválido',
      errores: [{
        campo: 'limit',
        mensaje: 'El límite debe ser un número entre 1 y 100'
      }]
    });
  }

  // Validar orden
  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Orden inválido',
      errores: [{
        campo: 'order',
        mensaje: 'El orden debe ser "asc" o "desc"'
      }]
    });
  }

  // Agregar parámetros validados a req
  req.paginacion = {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
    sort: sort || 'createdAt',
    order: order.toLowerCase()
  };

  next();
};

/**
 * Middleware para validar filtros de búsqueda
 * Valida y sanitiza parámetros de filtrado
 */
exports.validarFiltros = (filtrosPermitidos = []) => {
  return (req, res, next) => {
    const filtros = {};
    const errores = [];

    // Procesar cada filtro en query
    Object.keys(req.query).forEach(key => {
      // Ignorar parámetros de paginación
      if (['page', 'limit', 'sort', 'order'].includes(key)) {
        return;
      }

      // Verificar si el filtro está permitido
      if (filtrosPermitidos.length > 0 && !filtrosPermitidos.includes(key)) {
        errores.push({
          campo: key,
          mensaje: `Filtro no permitido: ${key}. Filtros permitidos: ${filtrosPermitidos.join(', ')}`
        });
        return;
      }

      const valor = req.query[key];

      // Sanitizar valor
      if (typeof valor === 'string') {
        const valorLimpio = valor.trim();
        if (valorLimpio) {
          filtros[key] = valorLimpio;
        }
      } else if (Array.isArray(valor)) {
        const valoresLimpios = valor
          .map(v => typeof v === 'string' ? v.trim() : v)
          .filter(v => v !== '');
        if (valoresLimpios.length > 0) {
          filtros[key] = valoresLimpios;
        }
      } else {
        filtros[key] = valor;
      }
    });

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Filtros inválidos',
        errores
      });
    }

    req.filtros = filtros;
    next();
  };
};

/**
 * Middleware para validar IDs de MongoDB
 * Valida que los IDs en parámetros sean ObjectIds válidos
 */
exports.validarObjectIds = (...parametros) => {
  return (req, res, next) => {
    const errores = [];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;

    parametros.forEach(param => {
      const valor = req.params[param];
      if (valor && !objectIdRegex.test(valor)) {
        errores.push({
          campo: param,
          mensaje: `ID inválido: ${param}`
        });
      }
    });

    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs inválidos',
        errores
      });
    }

    next();
  };
};

/**
 * Middleware para validar JSON
 * Verifica que el body sea JSON válido
 */
exports.validarJSON = (req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    
    if (contentType && contentType.includes('application/json')) {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Body JSON requerido',
          errores: [{
            campo: 'body',
            mensaje: 'El cuerpo de la petición debe contener datos JSON válidos'
          }]
        });
      }
    }
  }

  next();
};

/**
 * Middleware para limpiar datos de entrada
 * Remueve campos no deseados y sanitiza datos
 */
exports.limpiarDatos = (camposPermitidos = []) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      // Si se especifican campos permitidos, filtrar
      if (camposPermitidos.length > 0) {
        const bodyLimpio = {};
        camposPermitidos.forEach(campo => {
          if (req.body.hasOwnProperty(campo)) {
            bodyLimpio[campo] = req.body[campo];
          }
        });
        req.body = bodyLimpio;
      }

      // Remover campos que empiecen con $ o contengan . (prevenir inyección NoSQL)
      Object.keys(req.body).forEach(key => {
        if (key.startsWith('$') || key.includes('.')) {
          delete req.body[key];
        }
      });

      // Sanitizar strings recursivamente
      const sanitizarObjeto = (obj) => {
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'string') {
            // Remover caracteres peligrosos básicos
            obj[key] = obj[key]
              .replace(/<script[^>]*>.*?<\/script>/gi, '')
              .replace(/<[^>]*>/g, '')
              .trim();
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            sanitizarObjeto(obj[key]);
          }
        });
      };

      sanitizarObjeto(req.body);
    }

    next();
  };
};