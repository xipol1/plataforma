const Anuncio = require('../models/Anuncio');
const Canal = require('../models/Canal');
const Usuario = require('../models/Usuario');
const Transaccion = require('../models/Transaccion');
const publicationService = require('../services/publicationService');
const { validationResult } = require('express-validator');
const config = require('../config/config');
const channelService = require('../services/channelService');
const UAParser = require('ua-parser-js');
const requestIp = require('request-ip');
const geoip = require('geoip-lite');

/**
 * Crear un nuevo anuncio
 */
exports.crearAnuncio = async (req, res) => {
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
      canal,
      titulo,
      descripcion,
      tipoAnuncio,
      contenido,
      programacion,
      presupuesto,
      audienciaObjetivo,
      objetivos,
      configuracionSeguimiento
    } = req.body;

    // Verificar que el usuario sea un anunciante
    const usuario = await Usuario.findById(req.user.id);
    if (!usuario || usuario.rol !== 'advertiser') {
      return res.status(403).json({
        success: false,
        message: 'Solo los anunciantes pueden crear anuncios'
      });
    }

    // Verificar que el canal existe y está activo
    const canalObj = await Canal.findById(canal);
    if (!canalObj) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }

    if (canalObj.estado !== 'activo') {
      return res.status(400).json({
        success: false,
        message: 'El canal no está disponible para anuncios'
      });
    }

    // Verificar límite de anuncios por usuario
    const anunciosUsuario = await Anuncio.countDocuments({ 
      anunciante: req.user.id,
      estado: { $in: ['borrador', 'pendiente_aprobacion', 'aprobado', 'activo'] }
    });
    
    const limiteAnuncios = config.limites.anunciosPorUsuario || 50;
    if (anunciosUsuario >= limiteAnuncios) {
      return res.status(429).json({
        success: false,
        message: `Has alcanzado el límite máximo de ${limiteAnuncios} anuncios activos`
      });
    }

    // Verificar saldo del usuario para el presupuesto
    if (usuario.billetera.saldo < presupuesto.montoTotal) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para crear este anuncio'
      });
    }

    // Calcular comisiones
    const comisionPlataforma = presupuesto.montoTotal * (config.comisiones.plataforma / 100);
    const montoCreador = presupuesto.montoTotal - comisionPlataforma;

    // Crear el anuncio
    const nuevoAnuncio = new Anuncio({
      anunciante: req.user.id,
      canal,
      titulo,
      descripcion,
      tipoAnuncio,
      contenido,
      programacion,
      presupuesto: {
        ...presupuesto,
        comisionPlataforma,
        montoCreador
      },
      audienciaObjetivo,
      objetivos,
      configuracionSeguimiento,
      estado: 'borrador'
    });

    await nuevoAnuncio.save();

    // Actualizar estadísticas del usuario
    await Usuario.findByIdAndUpdate(req.user.id, {
      $inc: { 'estadisticas.anunciosCreados': 1 }
    });

    // Disparar webhook si el anuncio está asociado a un partner
    if (nuevoAnuncio.partner_id) {
      const Partner = require('../models/Partner');
      const webhookService = require('../services/webhookService');
      const partner = await Partner.findById(nuevoAnuncio.partner_id);
      if (partner) {
        webhookService.sendWebhook(partner, 'campaign.created', {
          campaign_id: nuevoAnuncio._id,
          status: nuevoAnuncio.estado,
          budget: presupuesto.montoTotal,
          channel: {
            id: canalObj._id,
            name: canalObj.nombre,
            platform: canalObj.plataforma
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Anuncio creado exitosamente',
      data: {
        anuncio: nuevoAnuncio
      }
    });

  } catch (error) {
    console.error('Error al crear anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Obtener anuncios del usuario autenticado
 */
exports.obtenerMisAnuncios = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, estado, tipoAnuncio, canal } = req.query;
    
    // Construir filtros
    const filtros = { anunciante: req.user.id };
    
    if (estado) filtros.estado = estado;
    if (tipoAnuncio) filtros.tipoAnuncio = tipoAnuncio;
    if (canal) filtros.canal = canal;

    // Opciones de paginación
    const opciones = {
      page: parseInt(pagina),
      limit: parseInt(limite),
      sort: { fechaCreacion: -1 },
      populate: [
        {
          path: 'canal',
          select: 'nombreCanal plataforma propietario estadisticas',
          populate: {
            path: 'propietario',
            select: 'perfilCreador.nombreArtistico'
          }
        },
        {
          path: 'anunciante',
          select: 'nombre email perfilAnunciante.nombreEmpresa'
        }
      ]
    };

    const resultado = await Anuncio.paginate(filtros, opciones);

    res.json({
      success: true,
      data: {
        anuncios: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs,
          elementosPorPagina: resultado.limit
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener anuncios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener anuncios para un creador (canal)
 */
exports.obtenerAnunciosParaCreador = async (req, res) => {
  try {
    const { pagina = 1, limite = 10, estado, tipoAnuncio } = req.query;
    
    // Obtener canales del usuario
    const canalesUsuario = await Canal.find({ propietario: req.user.id }).select('_id');
    const idsCanales = canalesUsuario.map(canal => canal._id);

    if (idsCanales.length === 0) {
      return res.json({
        success: true,
        data: {
          anuncios: [],
          paginacion: {
            paginaActual: 1,
            totalPaginas: 0,
            totalElementos: 0,
            elementosPorPagina: parseInt(limite)
          }
        }
      });
    }

    // Construir filtros
    const filtros = { canal: { $in: idsCanales } };
    
    if (estado) filtros.estado = estado;
    if (tipoAnuncio) filtros.tipoAnuncio = tipoAnuncio;

    const opciones = {
      page: parseInt(pagina),
      limit: parseInt(limite),
      sort: { fechaCreacion: -1 },
      populate: [
        {
          path: 'canal',
          select: 'nombreCanal plataforma'
        },
        {
          path: 'anunciante',
          select: 'perfilAnunciante.nombreEmpresa perfilAnunciante.sitioWeb'
        }
      ]
    };

    const resultado = await Anuncio.paginate(filtros, opciones);

    res.json({
      success: true,
      data: {
        anuncios: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs,
          elementosPorPagina: resultado.limit
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener anuncios para creador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener un anuncio específico
 */
exports.obtenerAnuncio = async (req, res) => {
  try {
    const { id } = req.params;
    
    const anuncio = await Anuncio.findById(id)
      .populate('anunciante', 'nombre email perfilAnunciante')
      .populate({
        path: 'canal',
        select: 'nombreCanal plataforma propietario estadisticas tarifas',
        populate: {
          path: 'propietario',
          select: 'perfilCreador.nombreArtistico perfilCreador.biografia'
        }
      });

    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar permisos
    const esAnunciante = anuncio.anunciante._id.toString() === req.user.id;
    const esCreador = anuncio.canal.propietario._id.toString() === req.user.id;
    const esAdmin = req.user.role === 'admin';
    
    if (!esAnunciante && !esCreador && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver este anuncio'
      });
    }

    res.json({
      success: true,
      data: {
        anuncio
      }
    });

  } catch (error) {
    console.error('Error al obtener anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Actualizar un anuncio
 */
exports.actualizarAnuncio = async (req, res) => {
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

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar propiedad
    if (anuncio.anunciante.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este anuncio'
      });
    }

    // Solo se puede editar si está en borrador o pendiente de aprobación
    if (!['borrador', 'pendiente_aprobacion'].includes(anuncio.estado)) {
      return res.status(400).json({
        success: false,
        message: 'No se puede editar un anuncio en este estado'
      });
    }

    // Campos que no se pueden actualizar directamente
    const camposProtegidos = ['anunciante', 'canal', 'estado', 'metricas', 'flujoAprobacion', 'facturacion'];
    camposProtegidos.forEach(campo => delete actualizaciones[campo]);

    // Si se actualiza el presupuesto, recalcular comisiones
    if (actualizaciones.presupuesto && actualizaciones.presupuesto.montoTotal) {
      const comisionPlataforma = actualizaciones.presupuesto.montoTotal * (config.comisiones.plataforma / 100);
      actualizaciones.presupuesto.comisionPlataforma = comisionPlataforma;
      actualizaciones.presupuesto.montoCreador = actualizaciones.presupuesto.montoTotal - comisionPlataforma;
    }

    const anuncioActualizado = await Anuncio.findByIdAndUpdate(
      id,
      {
        ...actualizaciones,
        fechaActualizacion: new Date()
      },
      { new: true, runValidators: true }
    ).populate('canal', 'nombreCanal plataforma');

    res.json({
      success: true,
      message: 'Anuncio actualizado exitosamente',
      data: {
        anuncio: anuncioActualizado
      }
    });

  } catch (error) {
    console.error('Error al actualizar anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Eliminar un anuncio
 */
exports.eliminarAnuncio = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar propiedad
    if (anuncio.anunciante.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este anuncio'
      });
    }

    // Solo se puede eliminar si está en borrador
    if (anuncio.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden eliminar anuncios en borrador'
      });
    }

    await Anuncio.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Anuncio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Enviar anuncio para aprobación
 */
exports.enviarParaAprobacion = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await Anuncio.findById(id).populate('canal');
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar propiedad
    if (anuncio.anunciante.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para enviar este anuncio'
      });
    }

    // Solo se puede enviar si está en borrador
    if (anuncio.estado !== 'borrador') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden enviar anuncios en borrador'
      });
    }

    // Verificar que el anuncio esté completo
    const camposRequeridos = ['titulo', 'descripcion', 'contenido', 'programacion', 'presupuesto'];
    const camposFaltantes = camposRequeridos.filter(campo => !anuncio[campo]);
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El anuncio está incompleto',
        camposFaltantes
      });
    }

    // Verificar saldo del usuario
    const usuario = await Usuario.findById(req.user.id);
    if (usuario.billetera.saldo < anuncio.presupuesto.montoTotal) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para enviar este anuncio'
      });
    }

    // Actualizar estado
    anuncio.estado = 'pendiente_aprobacion';
    anuncio.flujoAprobacion.fechaEnvio = new Date();
    
    // Si el canal requiere aprobación manual, mantener pendiente
    // Si no, aprobar automáticamente
    if (!anuncio.canal.configuracionPublicacion.requiereAprobacion) {
      anuncio.estado = 'aprobado';
      anuncio.flujoAprobacion.fechaAprobacion = new Date();
      anuncio.flujoAprobacion.aprobadoPor = 'sistema';
    }

    await anuncio.save();

    // Crear notificación para el creador del canal
    // Aquí se implementaría el sistema de notificaciones

    res.json({
      success: true,
      message: anuncio.estado === 'aprobado' ? 'Anuncio aprobado automáticamente' : 'Anuncio enviado para aprobación',
      data: {
        anuncio: {
          id: anuncio._id,
          estado: anuncio.estado,
          fechaEnvio: anuncio.flujoAprobacion.fechaEnvio
        }
      }
    });

  } catch (error) {
    console.error('Error al enviar anuncio para aprobación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Aprobar o rechazar un anuncio (para creadores)
 */
exports.responderAprobacion = async (req, res) => {
  try {
    const { id } = req.params;
    const { accion, comentarios } = req.body; // accion: 'aprobar' o 'rechazar'

    const anuncio = await Anuncio.findById(id).populate('canal');
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del canal
    if (anuncio.canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para responder a este anuncio'
      });
    }

    // Solo se puede responder si está pendiente de aprobación
    if (anuncio.estado !== 'pendiente_aprobacion') {
      return res.status(400).json({
        success: false,
        message: 'Este anuncio no está pendiente de aprobación'
      });
    }

    if (accion === 'aprobar') {
      anuncio.estado = 'aprobado';
      anuncio.flujoAprobacion.fechaAprobacion = new Date();
      anuncio.flujoAprobacion.aprobadoPor = req.user.id;
      anuncio.flujoAprobacion.comentarios = comentarios;
    } else if (accion === 'rechazar') {
      anuncio.estado = 'rechazado';
      anuncio.flujoAprobacion.fechaRechazo = new Date();
      anuncio.flujoAprobacion.rechazadoPor = req.user.id;
      anuncio.flujoAprobacion.razonRechazo = comentarios;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Acción no válida. Use "aprobar" o "rechazar"'
      });
    }

    await anuncio.save();

    // Crear notificación para el anunciante
    // Aquí se implementaría el sistema de notificaciones

    res.json({
      success: true,
      message: `Anuncio ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} exitosamente`,
      data: {
        anuncio: {
          id: anuncio._id,
          estado: anuncio.estado,
          flujoAprobacion: anuncio.flujoAprobacion
        }
      }
    });

  } catch (error) {
    console.error('Error al responder aprobación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Activar un anuncio aprobado
 */
exports.activarAnuncio = async (req, res) => {
  try {
    const { id } = req.params;

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar propiedad
    if (anuncio.anunciante.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para activar este anuncio'
      });
    }

    // Solo se puede activar si está aprobado
    if (anuncio.estado !== 'aprobado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden activar anuncios aprobados'
      });
    }

    // Verificar saldo del usuario
    const usuario = await Usuario.findById(req.user.id);
    if (usuario.billetera.saldo < anuncio.presupuesto.montoTotal) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para activar este anuncio'
      });
    }

    // Reservar fondos del anunciante
    await Usuario.findByIdAndUpdate(req.user.id, {
      $inc: { 
        'billetera.saldo': -anuncio.presupuesto.montoTotal,
        'billetera.fondosReservados': anuncio.presupuesto.montoTotal
      }
    });

    // Crear transacción
    const nuevaTransaccion = new Transaccion({
      anuncio: anuncio._id,
      anunciante: req.user.id,
      creador: anuncio.canal.propietario,
      tipo: 'pago_anuncio',
      montoTotal: anuncio.presupuesto.montoTotal,
      montoAnunciante: anuncio.presupuesto.montoTotal,
      montoCreador: anuncio.presupuesto.montoCreador,
      comisionPlataforma: anuncio.presupuesto.comisionPlataforma,
      estado: 'pendiente'
    });

    await nuevaTransaccion.save();

    // Activar anuncio
    anuncio.estado = 'activo';
    anuncio.fechaActivacion = new Date();
    anuncio.transaccion = nuevaTransaccion._id;

    await anuncio.save();

    // Intentar publicar automáticamente
    const resultadoPublicacion = await publicationService.publicarAnuncio(anuncio.populate('canal'));
    
    if (resultadoPublicacion.success) {
      anuncio.flujoAprobacion.publicacionAutomatica = {
        exito: true,
        fecha: new Date(),
        resultado: resultadoPublicacion.resultado
      };
    } else {
      console.error(`❌ Fallo en la publicación automática de ${anuncio._id}:`, resultadoPublicacion.error);
      anuncio.flujoAprobacion.publicacionAutomatica = {
        exito: false,
        fecha: new Date(),
        error: resultadoPublicacion.error
      };
    }
    
    await anuncio.save();

    res.json({
      success: true,
      message: 'Anuncio activado exitosamente',
      data: {
        anuncio: {
          id: anuncio._id,
          estado: anuncio.estado,
          fechaActivacion: anuncio.fechaActivacion,
          publicacionAutomatica: anuncio.flujoAprobacion.publicacionAutomatica
        },
        transaccion: {
          id: nuevaTransaccion._id,
          monto: nuevaTransaccion.montoTotal
        }
      }
    });

  } catch (error) {
    console.error('Error al activar anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Marcar anuncio como completado
 */
exports.completarAnuncio = async (req, res) => {
  try {
    const { id } = req.params;
    const { evidencia } = req.body; // URLs de capturas de pantalla, etc.

    const anuncio = await Anuncio.findById(id).populate('canal');
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del canal
    if (anuncio.canal.propietario.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para completar este anuncio'
      });
    }

    // Solo se puede completar si está activo
    if (anuncio.estado !== 'activo') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden completar anuncios activos'
      });
    }

    // Marcar como completado
    anuncio.estado = 'completado';
    anuncio.fechaCompletado = new Date();
    anuncio.evidenciaCompletado = evidencia;

    await anuncio.save();

    // Actualizar transacción
    if (anuncio.transaccion) {
      await Transaccion.findByIdAndUpdate(anuncio.transaccion, {
        estado: 'completado',
        fechaCompletado: new Date()
      });
    }

    // Liberar fondos al creador
    await Usuario.findByIdAndUpdate(anuncio.canal.propietario, {
      $inc: { 'billetera.saldo': anuncio.presupuesto.montoCreador }
    });

    // Actualizar estadísticas
    await Usuario.findByIdAndUpdate(req.user.id, {
      $inc: { 'estadisticas.anunciosCompletados': 1 }
    });

    // Actualizar puntuación del canal basado en desempeño
    await channelService.updateChannelScore(anuncio.canal._id);

    res.json({
      success: true,
      message: 'Anuncio marcado como completado',
      data: {
        anuncio: {
          id: anuncio._id,
          estado: anuncio.estado,
          fechaCompletado: anuncio.fechaCompletado
        }
      }
    });

  } catch (error) {
    console.error('Error al completar anuncio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Tracking de clics en anuncios (Metodología Avanzada)
 */
exports.trackClick = async (req, res) => {
  try {
    const { id } = req.params;
    const { ref, c } = req.query; // ref: plataforma, c: conversion_id opcional

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).send('Anuncio no encontrado');
    }

    // 1. Obtener IP Real
    const clientIp = requestIp.getClientIp(req);
    
    // 2. Parsear User Agent
    const parser = new UAParser(req.get('User-Agent'));
    const uaResult = parser.getResult();
    
    // 3. Geolocalización por IP
    const geo = geoip.lookup(clientIp) || {};

    // 4. Idioma del navegador
    const language = req.acceptsLanguages() ? req.acceptsLanguages()[0] : 'desconocido';

    const clickInfo = {
      fecha: new Date(),
      ip: clientIp,
      userAgent: req.get('User-Agent'),
      referencia: ref || req.get('Referrer') || 'directo',
      dispositivo: uaResult.device.type || 'desktop',
      os: uaResult.os.name,
      navegador: uaResult.browser.name,
      region: geo.country || 'desconocido',
      ciudad: geo.city || 'desconocido',
      idioma: language,
      esBot: /bot|crawler|spider|crawling/i.test(uaResult.ua)
    };

    // No contar clics de bots en las métricas principales
    if (!clickInfo.esBot) {
      // Actualizar tracking en el anuncio
      await Anuncio.findByIdAndUpdate(id, {
        $inc: { 'tracking.clicsTotales': 1 },
        $set: { 'tracking.ultimaInteraccion': new Date() },
        $push: { 
          'tracking.historialClics': {
            $each: [clickInfo],
            $slice: -2000 // Aumentamos el historial a 2000
          }
        }
      });
    }

    // Redireccionar al primer enlace del anuncio si existe
    if (anuncio.contenido.enlaces && anuncio.contenido.enlaces.length > 0) {
      let finalUrl = anuncio.contenido.enlaces[0].url;
      
      // Si el anuncio es una conversión, podríamos pasar el ID
      if (c) {
        finalUrl += (finalUrl.includes('?') ? '&' : '?') + `ext_cid=${c}`;
      }

      return res.redirect(finalUrl);
    }

    res.send('Clic registrado correctamente');

  } catch (error) {
    console.error('Error en tracking avanzado de clic:', error);
    res.status(500).send('Error al procesar el tracking');
  }
};

/**
 * Tracking de conversiones (Ventas, Registros, etc.)
 */
exports.trackConversion = async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, moneda, tipo } = req.body; // valor: monto de la venta, tipo: 'venta', 'lead', etc.

    const anuncio = await Anuncio.findById(id);
    if (!anuncio) {
      return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
    }

    // Incrementar conversiones en el anuncio
    await Anuncio.findByIdAndUpdate(id, {
      $inc: { 
        'tracking.conversiones': 1,
        'tracking.ingresosGenerados': valor || 0
      }
    });

    // Actualizar estadística diaria
    const hoy = new Date();
    const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
    const finDia = new Date(hoy.setHours(23, 59, 59, 999));

    await Estadistica.findOneAndUpdate(
      {
        entidadId: id,
        tipoEntidad: 'ANUNCIO',
        'periodo.inicio': { $gte: inicioDia },
        'periodo.fin': { $lte: finDia }
      },
      {
        $inc: { 
          'metricas.conversiones': 1,
          'metricasFinancieras.ingresosGenerados': valor || 0
        }
      },
      { upsert: true }
    );

    res.json({ success: true, message: 'Conversión registrada' });

  } catch (error) {
    console.error('Error en tracking de conversión:', error);
    res.status(500).json({ success: false, message: 'Error interno' });
  }
};

/**
 * Obtener estadísticas detalladas de un anuncio
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;
    const userId = req.user.id;

    // Calcular fecha de inicio según el período
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

    let estadisticas = {};

    if (req.user.role === 'advertiser') {
      // Estadísticas para anunciantes
      const anuncios = await Anuncio.find({
        anunciante: userId,
        fechaCreacion: { $gte: fechaInicio }
      });

      estadisticas = {
        anunciosCreados: anuncios.length,
        anunciosActivos: anuncios.filter(a => a.estado === 'activo').length,
        anunciosCompletados: anuncios.filter(a => a.estado === 'completado').length,
        inversionTotal: anuncios.reduce((sum, a) => sum + a.presupuesto.montoTotal, 0),
        promedioInversion: anuncios.length > 0 ? anuncios.reduce((sum, a) => sum + a.presupuesto.montoTotal, 0) / anuncios.length : 0
      };
    } else if (req.user.role === 'creator') {
      // Estadísticas para creadores
      const canales = await Canal.find({ propietario: userId }).select('_id');
      const idsCanales = canales.map(c => c._id);
      
      const anuncios = await Anuncio.find({
        canal: { $in: idsCanales },
        fechaCreacion: { $gte: fechaInicio }
      });

      estadisticas = {
        anunciosRecibidos: anuncios.length,
        anunciosAprobados: anuncios.filter(a => ['aprobado', 'activo', 'completado'].includes(a.estado)).length,
        anunciosCompletados: anuncios.filter(a => a.estado === 'completado').length,
        ingresosTotales: anuncios.filter(a => a.estado === 'completado').reduce((sum, a) => sum + a.presupuesto.montoCreador, 0),
        promedioIngresos: anuncios.filter(a => a.estado === 'completado').length > 0 ? 
          anuncios.filter(a => a.estado === 'completado').reduce((sum, a) => sum + a.presupuesto.montoCreador, 0) / anuncios.filter(a => a.estado === 'completado').length : 0
      };
    }

    res.json({
      success: true,
      data: {
        periodo,
        estadisticas
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
 * Buscar anuncios (para administradores)
 */
exports.buscarAnuncios = async (req, res) => {
  try {
    // Verificar permisos de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    const {
      q, // término de búsqueda
      estado,
      tipoAnuncio,
      fechaInicio,
      fechaFin,
      pagina = 1,
      limite = 20
    } = req.query;

    // Construir filtros
    const filtros = {};

    if (estado) filtros.estado = estado;
    if (tipoAnuncio) filtros.tipoAnuncio = tipoAnuncio;
    
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
    }

    // Búsqueda por texto
    if (q) {
      filtros.$or = [
        { titulo: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } }
      ];
    }

    const opciones = {
      page: parseInt(pagina),
      limit: parseInt(limite),
      sort: { fechaCreacion: -1 },
      populate: [
        {
          path: 'anunciante',
          select: 'nombre email perfilAnunciante.nombreEmpresa'
        },
        {
          path: 'canal',
          select: 'nombreCanal plataforma',
          populate: {
            path: 'propietario',
            select: 'perfilCreador.nombreArtistico'
          }
        }
      ]
    };

    const resultado = await Anuncio.paginate(filtros, opciones);

    res.json({
      success: true,
      data: {
        anuncios: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs
        }
      }
    });

  } catch (error) {
    console.error('Error al buscar anuncios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
