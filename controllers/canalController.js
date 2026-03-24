const Canal = require('../models/Canal');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const config = require('../config/config');
const channelService = require('../services/channelService');
const channelRankingService = require('../services/channelRankingService');
const channelPricingService = require('../services/channelPricingService');

/**
 * Registrar un nuevo canal con scoring
 */
exports.registerChannel = async (req, res) => {
  try {
    const {
      name,
      platform,
      topic,
      subscribers,
      pricePerPost,
      postsPerWeek,
      avgViews,
      isVerified,
      description,
      url,
      category
    } = req.body;

    const result = await channelService.createChannel({
      name,
      platform,
      topic,
      subscribers,
      pricePerPost,
      postsPerWeek,
      avgViews,
      isVerified,
      ownerId: req.user.id,
      description,
      url,
      category
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error al registrar canal:', error);
    res.status(error.message.includes('Faltan campos') ? 400 : 500).json({
      success: false,
      message: error.message || 'Error interno del servidor'
    });
  }
};

/**
 * Crear un nuevo canal
 */
exports.crearCanal = async (req, res) => {
  try {
    // Verificar errores de validación
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errores: errores.array()
      });
    }

    const {
      plataforma,
      identificadorCanal,
      nombreCanal,
      urlCanal,
      categoria,
      descripcion,
      idiomas,
      pais,
      ciudad,
      tarifas,
      politicasContenido,
      configuracionPublicacion
    } = req.body;

    // Verificar que el usuario sea un creador
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Solo los creadores pueden registrar canales'
      });
    }

    // Verificar si ya existe un canal con el mismo identificador en la misma plataforma
    const canalExistente = await Canal.findOne({
      plataforma,
      identificadorCanal
    });

    if (canalExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un canal registrado con este identificador en esta plataforma'
      });
    }

    // Verificar límite de canales por usuario
    const canalesUsuario = await Canal.countDocuments({ propietario: req.user.id });
    const limiteCanales = config.limites.canalesPorUsuario || 10;
    
    if (canalesUsuario >= limiteCanales) {
      return res.status(429).json({
        success: false,
        message: `Has alcanzado el límite máximo de ${limiteCanales} canales`
      });
    }

    // Crear el canal
    const nuevoCanal = new Canal({
      propietario: req.user.id,
      plataforma,
      identificadorCanal,
      nombreCanal,
      urlCanal,
      categoria,
      descripcion,
      idiomas,
      ubicacion: {
        pais,
        ciudad
      },
      tarifas,
      politicasContenido,
      configuracionPublicacion,
      estado: 'pendiente_verificacion'
    });

    await nuevoCanal.save();

    // Actualizar estadísticas del usuario
    await Usuario.findByIdAndUpdate(req.user.id, {
      $inc: { 'estadisticas.canalesRegistrados': 1 }
    });

    res.status(201).json({
      success: true,
      message: 'Canal creado exitosamente',
      data: {
        canal: nuevoCanal
      }
    });

  } catch (error) {
    console.error('Error al crear canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener todos los canales del usuario autenticado
 */
exports.obtenerMisCanales = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, estado, plataforma, categoria } = req.query;
    
    // Construir filtros
    const filtros = { propietario: req.user.id };
    
    if (estado) filtros.estado = estado;
    if (plataforma) filtros.plataforma = plataforma;
    if (categoria) filtros.categoria = categoria;

    // Opciones de paginación
    const opciones = {
      page: parseInt(pagina),
      limit: parseInt(limite),
      sort: { fechaCreacion: -1 },
      populate: [
        {
          path: 'propietario',
          select: 'nombre email perfilCreador.nombreArtistico'
        }
      ]
    };

    const resultado = await Canal.paginate(filtros, opciones);

    res.json({
      success: true,
      data: {
        canales: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs,
          elementosPorPagina: resultado.limit,
          hayPaginaSiguiente: resultado.hasNextPage,
          hayPaginaAnterior: resultado.hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener un canal específico por ID
 */
exports.obtenerCanal = async (req, res) => {
  try {
    const { id } = req.params;
    
    const canal = await Canal.findById(id)
      .populate('propietario', 'nombre email perfilCreador.nombreArtistico perfilCreador.biografia')
      .populate('calificaciones.usuario', 'nombre');

    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // Verificar permisos (propietario o canal público/verificado)
    const esPropio = canal.propietario._id.toString() === req.user.id;
    const esPublico = canal.estado === 'activo' && canal.verificacion.verificado;
    
    if (!esPropio && !esPublico) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este canal'
      });
    }

    // Incrementar vistas si no es el propietario
    if (!esPropio) {
      await Canal.findByIdAndUpdate(id, {
        $inc: { 'estadisticas.vistas': 1 }
      });
    }

    // Calcular precio sugerido
    const pricing = channelPricingService.calculateSuggestedPrice(canal);

    res.json({
      success: true,
      data: {
        canal: {
          ...canal.toObject(),
          suggestedPrice: pricing.suggestedPrice,
          minSuggestedPrice: pricing.minPrice,
          maxSuggestedPrice: pricing.maxPrice
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar información de un canal
 */
exports.actualizarCanal = async (req, res) => {
  try {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errores: errores.array()
      });
    }

    const { id } = req.params;
    const actualizaciones = req.body;

    // Buscar el canal
    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // Verificar propiedad
    if (canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este canal'
      });
    }

    // Campos que no se pueden actualizar directamente
    const camposProtegidos = ['propietario', 'plataforma', 'identificadorCanal', 'estado', 'verificacion', 'estadisticas'];
    camposProtegidos.forEach(campo => delete actualizaciones[campo]);

    // Actualizar canal
    const canalActualizado = await Canal.findByIdAndUpdate(
      id,
      {
        ...actualizaciones,
        fechaActualizacion: new Date()
      },
      { new: true, runValidators: true }
    ).populate('propietario', 'nombre email');

    res.json({
      success: true,
      message: 'Canal actualizado exitosamente',
      data: {
        canal: canalActualizado
      }
    });

  } catch (error) {
    console.error('Error al actualizar canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar un canal
 */
exports.eliminarCanal = async (req, res) => {
  try {
    const { id } = req.params;

    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // Verificar propiedad
    if (canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este canal'
      });
    }

    // Verificar si tiene anuncios activos
    const Anuncio = require('../models/Anuncio');
    const anunciosActivos = await Anuncio.countDocuments({
      canal: id,
      estado: { $in: ['activo', 'en_progreso'] }
    });

    if (anunciosActivos > 0) {
      return res.status(409).json({
        success: false,
        message: 'No puedes eliminar un canal con anuncios activos'
      });
    }

    // Eliminar canal
    await Canal.findByIdAndDelete(id);

    // Actualizar estadísticas del usuario
    await Usuario.findByIdAndUpdate(req.user.id, {
      $inc: { 'estadisticas.canalesRegistrados': -1 }
    });

    res.json({
      success: true,
      message: 'Canal eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Buscar canales públicos
 */
exports.buscarCanales = async (req, res) => {
  try {
    const {
      q, // término de búsqueda
      plataforma,
      categoria,
      pais,
      idioma,
      verificado,
      ordenPor = 'relevancia',
      pagina = 1,
      limite = 20
    } = req.query;

    // Construir filtros
    const filtros = {
      estado: 'activo'
    };

    if (plataforma) filtros.plataforma = plataforma;
    if (categoria) filtros.categoria = categoria;
    if (pais) filtros['ubicacion.pais'] = pais;
    if (idioma) filtros.idiomas = { $in: [idioma] };
    if (verificado === 'true') filtros['verificacion.verificado'] = true;

    // Búsqueda por texto
    if (q) {
      filtros.$or = [
        { nombreCanal: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
        { categoria: { $regex: q, $options: 'i' } }
      ];
    }

    // Configurar ordenamiento
    let ordenamiento = {};
    switch (ordenPor) {
      case 'seguidores':
        ordenamiento = { 'estadisticas.seguidores': -1 };
        break;
      case 'engagement':
        ordenamiento = { 'rendimiento.tasaEngagement': -1 };
        break;
      case 'precio_asc':
        ordenamiento = { 'tarifas.publicacionSimple': 1 };
        break;
      case 'precio_desc':
        ordenamiento = { 'tarifas.publicacionSimple': -1 };
        break;
      case 'fecha':
        ordenamiento = { fechaCreacion: -1 };
        break;
      default: // relevancia
        ordenamiento = {
          'verificacion.verificado': -1,
          'estadisticas.seguidores': -1,
          'rendimiento.tasaEngagement': -1
        };
    }

    const canalesRankeados = await channelRankingService.rankChannels({
      categoria,
      plataforma
    });

    // Paginación manual para los canales rankeados
    const totalElementos = canalesRankeados.length;
    const totalPaginas = Math.ceil(totalElementos / parseInt(limite));
    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    const canalesPaginados = canalesRankeados.slice(skip, skip + parseInt(limite));

    // Agregar precio sugerido y mapear campos
    const data = canalesPaginados.map(canal => {
      const pricing = channelPricingService.calculateSuggestedPrice(canal);
      return {
        ...canal,
        suggestedPrice: pricing.suggestedPrice,
        minSuggestedPrice: pricing.minPrice,
        maxSuggestedPrice: pricing.maxPrice
      };
    });

    res.json({
      success: true,
      data: {
        canales: data,
        paginacion: {
          paginaActual: parseInt(pagina),
          totalPaginas,
          totalElementos,
          elementosPorPagina: parseInt(limite)
        },
        filtrosAplicados: {
          plataforma,
          categoria,
          pais,
          idioma,
          verificado,
          ordenPor
        }
      }
    });

  } catch (error) {
    console.error('Error al buscar canales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar estadísticas de un canal
 */
exports.actualizarEstadisticas = async (req, res) => {
  try {
    const { id } = req.params;
    const { estadisticas } = req.body;

    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // Verificar propiedad
    if (canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar las estadísticas de este canal'
      });
    }

    // Actualizar estadísticas usando el método del modelo
    await canal.actualizarEstadisticas(estadisticas);

    res.json({
      success: true,
      message: 'Estadísticas actualizadas exitosamente',
      data: {
        estadisticas: canal.estadisticas,
        rendimiento: canal.rendimiento
      }
    });

  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Calificar un canal
 */
exports.calificarCanal = async (req, res) => {
  try {
    const { id } = req.params;
    const { puntuacion, comentario } = req.body;

    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // No se puede calificar el propio canal
    if (canal.propietario.toString() === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes calificar tu propio canal'
      });
    }

    // Verificar si ya calificó este canal
    const calificacionExistente = canal.calificaciones.find(
      cal => cal.usuario.toString() === req.user.id
    );

    if (calificacionExistente) {
      // Actualizar calificación existente
      calificacionExistente.puntuacion = puntuacion;
      calificacionExistente.comentario = comentario;
      calificacionExistente.fecha = new Date();
    } else {
      // Agregar nueva calificación
      canal.calificaciones.push({
        usuario: req.user.id,
        puntuacion,
        comentario,
        fecha: new Date()
      });
    }

    await canal.save();

    res.json({
      success: true,
      message: calificacionExistente ? 'Calificación actualizada' : 'Calificación agregada',
      data: {
        promedioCalificacion: canal.promedioCalificacion,
        totalCalificaciones: canal.calificaciones.length
      }
    });

  } catch (error) {
    console.error('Error al calificar canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas del canal
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo = '30d' } = req.query;

    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    // Verificar permisos
    if (canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver las estadísticas de este canal'
      });
    }

    // Calcular estadísticas según el período
    let fechaInicio;
    switch (periodo) {
      case '7d':
        fechaInicio = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fechaInicio = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        fechaInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Obtener anuncios del período
    const Anuncio = require('../models/Anuncio');
    const anunciosPeriodo = await Anuncio.find({
      canal: id,
      fechaCreacion: { $gte: fechaInicio }
    });

    // Calcular métricas
    const metricas = {
      anunciosPublicados: anunciosPeriodo.length,
      anunciosActivos: anunciosPeriodo.filter(a => a.estado === 'activo').length,
      ingresosTotales: anunciosPeriodo.reduce((sum, a) => sum + (a.presupuesto.montoCreador || 0), 0),
      promedioEngagement: canal.rendimiento.tasaEngagement,
      crecimientoSeguidores: canal.estadisticas.seguidores // Aquí se podría calcular el crecimiento real
    };

    res.json({
      success: true,
      data: {
        canal: {
          id: canal._id,
          nombre: canal.nombreCanal,
          plataforma: canal.plataforma
        },
        periodo,
        metricas,
        estadisticasGenerales: canal.estadisticas,
        rendimiento: canal.rendimiento
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Cambiar estado del canal (solo para administradores)
 */
exports.cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, razon } = req.body;

    // Verificar permisos de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo los administradores pueden cambiar el estado de los canales'
      });
    }

    const canal = await Canal.findById(id);
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    const estadoAnterior = canal.estado;
    canal.estado = estado;
    
    // Agregar entrada al historial
    canal.historial.push({
      accion: 'cambio_estado',
      estadoAnterior,
      estadoNuevo: estado,
      usuario: req.user.id,
      razon,
      fecha: new Date()
    });

    await canal.save();

    // Notificar al propietario del canal
    // Aquí se podría implementar el sistema de notificaciones

    res.json({
      success: true,
      message: `Estado del canal cambiado de ${estadoAnterior} a ${estado}`,
      data: {
        canal: {
          id: canal._id,
          estado: canal.estado,
          fechaActualizacion: canal.fechaActualizacion
        }
      }
    });

  } catch (error) {
    console.error('Error al cambiar estado del canal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener canales para moderación (solo administradores)
 */
exports.obtenerCanalesParaModeracion = async (req, res) => {
  try {
    // Verificar permisos
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    const { estado = 'pendiente_verificacion', pagina = 1, limite = 20 } = req.query;

    const opciones = {
      page: parseInt(pagina),
      limit: parseInt(limite),
      sort: { fechaCreacion: 1 }, // Los más antiguos primero
      populate: [
        {
          path: 'propietario',
          select: 'nombre email perfilCreador.nombreArtistico'
        }
      ]
    };

    const resultado = await Canal.paginate({ estado }, opciones);

    res.json({
      success: true,
      data: {
        canales: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener canales para moderación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
