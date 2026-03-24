const { validationResult } = require('express-validator');
const Notificacion = require('../models/Notificacion');
const Usuario = require('../models/Usuario');
const NotificationService = require('../services/notificationService');
const config = require('../config/config');
const mongoose = require('mongoose');

/**
 * Controlador de Notificaciones
 */
class NotificationController {
  /**
   * Obtener notificaciones del usuario
   */
  static async obtenerNotificaciones(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const {
        pagina = 1,
        limite = 20,
        tipo = null,
        prioridad = null,
        leida = null,
        archivada = false
      } = req.query;

      const usuarioId = req.usuario.id;
      const skip = (parseInt(pagina) - 1) * parseInt(limite);

      // Construir filtros
      const filtros = {
        usuario: usuarioId,
        archivada: archivada === 'true'
      };

      if (tipo) filtros.tipo = tipo;
      if (prioridad) filtros.prioridad = prioridad;
      if (leida !== null) filtros.leida = leida === 'true';

      // Obtener notificaciones
      const [notificaciones, total] = await Promise.all([
        Notificacion.find(filtros)
          .sort({ fechaCreacion: -1 })
          .limit(parseInt(limite))
          .skip(skip)
          .populate('usuario', 'nombre email'),
        Notificacion.countDocuments(filtros)
      ]);

      // Calcular información de paginación
      const totalPaginas = Math.ceil(total / parseInt(limite));
      const tieneSiguiente = parseInt(pagina) < totalPaginas;
      const tieneAnterior = parseInt(pagina) > 1;

      res.json({
        exito: true,
        datos: {
          notificaciones,
          paginacion: {
            paginaActual: parseInt(pagina),
            totalPaginas,
            totalElementos: total,
            elementosPorPagina: parseInt(limite),
            tieneSiguiente,
            tieneAnterior
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener notificación por ID
   */
  static async obtenerNotificacion(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de notificación inválido'
        });
      }

      const notificacion = await Notificacion.findOne({
        _id: id,
        usuario: usuarioId
      }).populate('usuario', 'nombre email');

      if (!notificacion) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Notificación no encontrada'
        });
      }

      res.json({
        exito: true,
        datos: { notificacion }
      });

    } catch (error) {
      console.error('Error al obtener notificación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Marcar notificación como leída
   */
  static async marcarComoLeida(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de notificación inválido'
        });
      }

      const notificacion = await Notificacion.findOne({
        _id: id,
        usuario: usuarioId
      });

      if (!notificacion) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Notificación no encontrada'
        });
      }

      await notificacion.marcarComoLeida();

      res.json({
        exito: true,
        mensaje: 'Notificación marcada como leída',
        datos: { notificacion }
      });

    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  static async marcarTodasComoLeidas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const resultado = await Notificacion.marcarTodasComoLeidas(usuarioId);

      res.json({
        exito: true,
        mensaje: `${resultado.modifiedCount} notificaciones marcadas como leídas`,
        datos: {
          notificacionesActualizadas: resultado.modifiedCount
        }
      });

    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Archivar notificación
   */
  static async archivarNotificacion(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de notificación inválido'
        });
      }

      const notificacion = await Notificacion.findOne({
        _id: id,
        usuario: usuarioId
      });

      if (!notificacion) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Notificación no encontrada'
        });
      }

      await notificacion.archivar();

      res.json({
        exito: true,
        mensaje: 'Notificación archivada',
        datos: { notificacion }
      });

    } catch (error) {
      console.error('Error al archivar notificación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar notificación
   */
  static async eliminarNotificacion(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de notificación inválido'
        });
      }

      const notificacion = await Notificacion.findOneAndDelete({
        _id: id,
        usuario: usuarioId
      });

      if (!notificacion) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Notificación no encontrada'
        });
      }

      res.json({
        exito: true,
        mensaje: 'Notificación eliminada'
      });

    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener contador de notificaciones no leídas
   */
  static async contarNoLeidas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const contador = await Notificacion.contarNoLeidas(usuarioId);

      res.json({
        exito: true,
        datos: {
          noLeidas: contador
        }
      });

    } catch (error) {
      console.error('Error al contar notificaciones no leídas:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Buscar notificaciones
   */
  static async buscarNotificaciones(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const {
        termino,
        pagina = 1,
        limite = 20,
        tipo = null,
        prioridad = null,
        leida = null
      } = req.query;

      const usuarioId = req.usuario.id;

      const opciones = {
        limite: parseInt(limite),
        pagina: parseInt(pagina),
        tipo,
        prioridad,
        leida: leida !== null ? leida === 'true' : null
      };

      const notificaciones = await Notificacion.buscar(usuarioId, termino, opciones);

      res.json({
        exito: true,
        datos: {
          notificaciones,
          termino,
          opciones
        }
      });

    } catch (error) {
      console.error('Error al buscar notificaciones:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;

      const [estadisticas, noLeidas, total] = await Promise.all([
        Notificacion.obtenerEstadisticas(usuarioId),
        Notificacion.contarNoLeidas(usuarioId),
        Notificacion.countDocuments({ usuario: usuarioId })
      ]);

      res.json({
        exito: true,
        datos: {
          estadisticasPorTipo: estadisticas,
          resumen: {
            total,
            noLeidas,
            leidas: total - noLeidas,
            tasaLecturaGeneral: total > 0 ? ((total - noLeidas) / total) : 0
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear notificación (solo para administradores)
   */
  static async crearNotificacion(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const {
        usuarioId,
        tipo,
        titulo,
        mensaje,
        datos = {},
        prioridad = 'normal',
        fechaProgramada = null,
        fechaExpiracion = null,
        urlAccion = null,
        textoAccion = null,
        icono = null,
        color = null
      } = req.body;

      // Verificar que el usuario existe
      const usuario = await Usuario.findById(usuarioId);
      if (!usuario) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Usuario no encontrado'
        });
      }

      // Crear la notificación
      const notificacion = new Notificacion({
        usuario: usuarioId,
        tipo,
        titulo,
        mensaje,
        datos,
        prioridad,
        fechaProgramada,
        fechaExpiracion,
        urlAccion,
        textoAccion,
        icono,
        color,
        metadatos: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          origen: 'admin_panel',
          referenciaExterna: req.usuario.id
        }
      });

      await notificacion.save();

      // Si no está programada, enviarla inmediatamente
      if (!fechaProgramada || new Date(fechaProgramada) <= new Date()) {
        const notificationService = new NotificationService();
        await notificationService.enviarNotificacion(notificacion);
      }

      res.status(201).json({
        exito: true,
        mensaje: 'Notificación creada exitosamente',
        datos: { notificacion }
      });

    } catch (error) {
      console.error('Error al crear notificación:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Enviar notificación masiva (solo para administradores)
   */
  static async enviarNotificacionMasiva(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const {
        filtroUsuarios = {},
        tipo,
        titulo,
        mensaje,
        datos = {},
        prioridad = 'normal',
        fechaProgramada = null,
        canales = ['database', 'email']
      } = req.body;

      // Obtener usuarios según el filtro
      const usuarios = await Usuario.find(filtroUsuarios).select('_id nombre email');

      if (usuarios.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'No se encontraron usuarios que coincidan con el filtro'
        });
      }

      // Crear notificaciones para cada usuario
      const notificaciones = usuarios.map(usuario => ({
        usuario: usuario._id,
        tipo,
        titulo,
        mensaje,
        datos,
        prioridad,
        fechaProgramada,
        metadatos: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          origen: 'notificacion_masiva',
          referenciaExterna: req.usuario.id
        }
      }));

      const notificacionesCreadas = await Notificacion.insertMany(notificaciones);

      // Enviar notificaciones si no están programadas
      if (!fechaProgramada || new Date(fechaProgramada) <= new Date()) {
        const notificationService = new NotificationService();
        
        // Enviar en lotes para evitar sobrecarga
        const tamanoLote = 50;
        for (let i = 0; i < notificacionesCreadas.length; i += tamanoLote) {
          const lote = notificacionesCreadas.slice(i, i + tamanoLote);
          await Promise.all(
            lote.map(notificacion => 
              notificationService.enviarNotificacion(notificacion, canales)
            )
          );
        }
      }

      res.status(201).json({
        exito: true,
        mensaje: `Notificación masiva enviada a ${usuarios.length} usuarios`,
        datos: {
          usuariosAfectados: usuarios.length,
          notificacionesCreadas: notificacionesCreadas.length
        }
      });

    } catch (error) {
      console.error('Error al enviar notificación masiva:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Limpiar notificaciones expiradas (tarea de mantenimiento)
   */
  static async limpiarExpiradas(req, res) {
    try {
      const resultado = await Notificacion.limpiarExpiradas();

      res.json({
        exito: true,
        mensaje: `${resultado.deletedCount} notificaciones expiradas eliminadas`,
        datos: {
          notificacionesEliminadas: resultado.deletedCount
        }
      });

    } catch (error) {
      console.error('Error al limpiar notificaciones expiradas:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Limpiar notificaciones antiguas (tarea de mantenimiento)
   */
  static async limpiarAntiguas(req, res) {
    try {
      const { dias = 30 } = req.query;
      const resultado = await Notificacion.limpiarAntiguas(parseInt(dias));

      res.json({
        exito: true,
        mensaje: `${resultado.deletedCount} notificaciones antiguas eliminadas`,
        datos: {
          notificacionesEliminadas: resultado.deletedCount,
          diasAntiguedad: parseInt(dias)
        }
      });

    } catch (error) {
      console.error('Error al limpiar notificaciones antiguas:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = NotificationController;