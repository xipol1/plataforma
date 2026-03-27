const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs').promises;
const FileService = require('../services/fileService');
const Archivo = require('../models/Archivo');
const config = require('../config/config');
const mongoose = require('mongoose');

/**
 * Controlador de Archivos
 */
class FileController {
  constructor() {
    this.fileService = new FileService();
  }

  /**
   * Subir archivo(s)
   */
  static async subirArchivos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          exito: false,
          mensaje: 'No se han subido archivos'
        });
      }

      const usuarioId = req.usuario.id;
      const {
        categoria = 'general',
        descripcion = '',
        esPublico = false,
        procesarImagenes = true
      } = req.body;

      const fileService = new FileService();
      const archivosSubidos = [];
      const errores = [];

      // Procesar cada archivo
      for (const file of req.files) {
        try {
          // Validar archivo
          const validacion = fileService.validarArchivo(file);
          if (!validacion.esValido) {
            errores.push({
              archivo: file.originalname,
              errores: validacion.errores
            });
            continue;
          }

          let archivoData = {
            filename: file.filename,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            categoria,
            descripcion,
            esPublico: esPublico === 'true'
          };

          // Procesar imagen si es necesario
          if (procesarImagenes === 'true' && file.mimetype.startsWith('image/')) {
            try {
              const resultadoProcesamiento = await fileService.procesarImagen(file.path, {
                calidad: 85,
                crearThumbnail: true
              });
              
              archivoData.optimizedPath = resultadoProcesamiento.optimized;
              archivoData.thumbnailPath = resultadoProcesamiento.thumbnail;
              archivoData.metadata = resultadoProcesamiento.metadata;
            } catch (error) {
              console.error('Error al procesar imagen:', error);
              // Continuar sin procesamiento si falla
            }
          }

          // Guardar en base de datos
          const archivo = await fileService.guardarArchivo(archivoData, usuarioId);
          archivosSubidos.push({
            id: archivo._id,
            nombreOriginal: archivo.nombreOriginal,
            tamano: archivo.tamano,
            tipoMime: archivo.tipoMime,
            categoria: archivo.categoria,
            url: fileService.generarUrlArchivo(archivo),
            thumbnailUrl: fileService.generarUrlArchivo(archivo, 'thumbnail')
          });

        } catch (error) {
          console.error('Error al procesar archivo:', error);
          errores.push({
            archivo: file.originalname,
            error: error.message
          });
        }
      }

      // Respuesta
      const respuesta = {
        exito: archivosSubidos.length > 0,
        mensaje: `${archivosSubidos.length} archivo(s) subido(s) exitosamente`,
        datos: {
          archivos: archivosSubidos,
          errores: errores.length > 0 ? errores : undefined
        }
      };

      const statusCode = archivosSubidos.length > 0 ? 201 : 400;
      res.status(statusCode).json(respuesta);

    } catch (error) {
      console.error('Error al subir archivos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener archivo
   */
  static async obtenerArchivo(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const fileService = new FileService();
      const archivo = await fileService.obtenerArchivo(id, usuarioId);

      // Verificar permisos
      if (!archivo.puedeAcceder(usuarioId)) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permisos para acceder a este archivo'
        });
      }

      // Incrementar contador de vistas
      await archivo.incrementarVistas();

      // Configurar headers para descarga
      res.setHeader('Content-Type', archivo.tipoMime);
      res.setHeader('Content-Length', archivo.tamano);
      res.setHeader('Content-Disposition', `inline; filename="${archivo.nombreOriginal}"`);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año

      // Enviar archivo
      res.sendFile(path.resolve(archivo.ruta));

    } catch (error) {
      console.error('Error al obtener archivo:', error);
      
      if (error.message === 'Archivo no encontrado' || error.message === 'Archivo físico no encontrado') {
        return res.status(404).json({
          exito: false,
          mensaje: error.message
        });
      }
      
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Descargar archivo
   */
  static async descargarArchivo(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const fileService = new FileService();
      const archivo = await fileService.obtenerArchivo(id, usuarioId);

      // Verificar permisos
      if (!archivo.puedeAcceder(usuarioId)) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permisos para descargar este archivo'
        });
      }

      // Incrementar contador de descargas
      await archivo.incrementarDescargas();

      // Configurar headers para descarga forzada
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', archivo.tamano);
      res.setHeader('Content-Disposition', `attachment; filename="${archivo.nombreOriginal}"`);

      // Enviar archivo
      res.sendFile(path.resolve(archivo.ruta));

    } catch (error) {
      console.error('Error al descargar archivo:', error);
      
      if (error.message === 'Archivo no encontrado' || error.message === 'Archivo físico no encontrado') {
        return res.status(404).json({
          exito: false,
          mensaje: error.message
        });
      }
      
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener thumbnail de imagen
   */
  static async obtenerThumbnail(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const fileService = new FileService();
      const archivo = await fileService.obtenerArchivo(id, usuarioId);

      // Verificar permisos
      if (!archivo.puedeAcceder(usuarioId)) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permisos para acceder a este archivo'
        });
      }

      // Verificar que tiene thumbnail
      if (!archivo.rutaThumbnail) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Thumbnail no disponible para este archivo'
        });
      }

      // Verificar que el thumbnail existe
      try {
        await fs.access(archivo.rutaThumbnail);
      } catch {
        return res.status(404).json({
          exito: false,
          mensaje: 'Thumbnail no encontrado'
        });
      }

      // Configurar headers
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 año

      // Enviar thumbnail
      res.sendFile(path.resolve(archivo.rutaThumbnail));

    } catch (error) {
      console.error('Error al obtener thumbnail:', error);
      
      if (error.message === 'Archivo no encontrado') {
        return res.status(404).json({
          exito: false,
          mensaje: error.message
        });
      }
      
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Listar archivos del usuario
   */
  static async listarArchivos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const usuarioId = req.usuario.id;
      const {
        pagina = 1,
        limite = 20,
        categoria = null,
        tipoMime = null,
        busqueda = null,
        ordenPor = 'fechaSubida',
        orden = 'desc'
      } = req.query;

      const fileService = new FileService();
      const resultado = await fileService.listarArchivos(usuarioId, {
        pagina,
        limite,
        categoria,
        tipoMime,
        busqueda,
        ordenPor,
        orden
      });

      // Agregar URLs a cada archivo
      const archivosConUrls = resultado.archivos.map(archivo => ({
        ...archivo.toJSON(),
        url: fileService.generarUrlArchivo(archivo),
        thumbnailUrl: fileService.generarUrlArchivo(archivo, 'thumbnail'),
        optimizedUrl: fileService.generarUrlArchivo(archivo, 'optimized')
      }));

      res.json({
        exito: true,
        datos: {
          archivos: archivosConUrls,
          paginacion: resultado.paginacion
        }
      });

    } catch (error) {
      console.error('Error al listar archivos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener información del archivo
   */
  static async obtenerInfoArchivo(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario?.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const fileService = new FileService();
      const info = await fileService.obtenerInfoArchivo(id, usuarioId);

      res.json({
        exito: true,
        datos: { archivo: info }
      });

    } catch (error) {
      console.error('Error al obtener info del archivo:', error);
      
      if (error.message === 'Archivo no encontrado') {
        return res.status(404).json({
          exito: false,
          mensaje: error.message
        });
      }
      
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Actualizar archivo
   */
  static async actualizarArchivo(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const { id } = req.params;
      const usuarioId = req.usuario.id;
      const { descripcion, categoria, esPublico, etiquetas } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const archivo = await Archivo.findOne({
        _id: id,
        usuario: usuarioId
      });

      if (!archivo) {
        return res.status(404).json({
          exito: false,
          mensaje: 'Archivo no encontrado'
        });
      }

      // Verificar permisos de modificación
      if (!archivo.puedeModificar(usuarioId)) {
        return res.status(403).json({
          exito: false,
          mensaje: 'No tienes permisos para modificar este archivo'
        });
      }

      // Actualizar campos
      if (descripcion !== undefined) archivo.descripcion = descripcion;
      if (categoria !== undefined) archivo.categoria = categoria;
      if (esPublico !== undefined) archivo.esPublico = esPublico;
      if (etiquetas !== undefined) archivo.etiquetas = etiquetas;

      await archivo.save();

      const fileService = new FileService();
      res.json({
        exito: true,
        mensaje: 'Archivo actualizado exitosamente',
        datos: {
          archivo: {
            ...archivo.toJSON(),
            url: fileService.generarUrlArchivo(archivo),
            thumbnailUrl: fileService.generarUrlArchivo(archivo, 'thumbnail')
          }
        }
      });

    } catch (error) {
      console.error('Error al actualizar archivo:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar archivo
   */
  static async eliminarArchivo(req, res) {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          exito: false,
          mensaje: 'ID de archivo inválido'
        });
      }

      const fileService = new FileService();
      await fileService.eliminarArchivo(id, usuarioId);

      res.json({
        exito: true,
        mensaje: 'Archivo eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar archivo:', error);
      
      if (error.message === 'Archivo no encontrado') {
        return res.status(404).json({
          exito: false,
          mensaje: error.message
        });
      }
      
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener estadísticas de archivos
   */
  static async obtenerEstadisticas(req, res) {
    try {
      const usuarioId = req.usuario.id;
      const fileService = new FileService();
      const estadisticas = await fileService.obtenerEstadisticas(usuarioId);

      res.json({
        exito: true,
        datos: { estadisticas }
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
   * Buscar archivos
   */
  static async buscarArchivos(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          exito: false,
          mensaje: 'Datos de entrada inválidos',
          errores: errors.array()
        });
      }

      const usuarioId = req.usuario.id;
      const {
        termino,
        pagina = 1,
        limite = 20,
        categoria = null,
        tipoMime = null
      } = req.query;

      const archivos = await Archivo.buscarArchivos(usuarioId, termino, {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        categoria,
        tipoMime
      });

      const fileService = new FileService();
      const archivosConUrls = archivos.map(archivo => ({
        ...archivo.toJSON(),
        url: fileService.generarUrlArchivo(archivo),
        thumbnailUrl: fileService.generarUrlArchivo(archivo, 'thumbnail')
      }));

      res.json({
        exito: true,
        datos: {
          archivos: archivosConUrls,
          termino,
          resultados: archivos.length
        }
      });

    } catch (error) {
      console.error('Error al buscar archivos:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Limpiar archivos temporales (solo admin)
   */
  static async limpiarTemporales(req, res) {
    try {
      const { horas = 24 } = req.query;
      const fileService = new FileService();
      const archivosEliminados = await fileService.limpiarArchivosTemporales(parseInt(horas));

      res.json({
        exito: true,
        mensaje: `${archivosEliminados} archivos temporales eliminados`,
        datos: {
          archivosEliminados,
          horasAntiguedad: parseInt(horas)
        }
      });

    } catch (error) {
      console.error('Error al limpiar archivos temporales:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Limpiar archivos expirados (solo admin)
   */
  static async limpiarExpirados(req, res) {
    try {
      const resultado = await Archivo.limpiarExpirados();

      res.json({
        exito: true,
        mensaje: `${resultado.modifiedCount} archivos marcados como eliminados`,
        datos: {
          archivosAfectados: resultado.modifiedCount
        }
      });

    } catch (error) {
      console.error('Error al limpiar archivos expirados:', error);
      res.status(500).json({
        exito: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = FileController;