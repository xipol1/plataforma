const Estadistica = require('../models/Estadistica');
const Anuncio = require('../models/Anuncio');
const Canal = require('../models/Canal');

// Obtener estadísticas generales
exports.getEstadisticasGenerales = async (req, res) => {
  try {
    // Verificar permisos (solo administradores pueden ver estadísticas generales)
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver estadísticas generales'
      });
    }
    
    // Obtener parámetros de filtro
    const { desde, hasta } = req.query;
    const filtro = {};
    
    if (desde && hasta) {
      filtro['periodo.inicio'] = { $gte: new Date(desde) };
      filtro['periodo.fin'] = { $lte: new Date(hasta) };
    }
    
    // Obtener estadísticas
    const estadisticas = await Estadistica.find(filtro).sort({ 'periodo.inicio': -1 });
    
    // Agrupar estadísticas por tipo de entidad
    const estadisticasPorTipo = estadisticas.reduce((result, est) => {
      if (!result[est.tipoEntidad]) {
        result[est.tipoEntidad] = [];
      }
      result[est.tipoEntidad].push(est);
      return result;
    }, {});
    
    res.status(200).json({
      success: true,
      count: estadisticas.length,
      data: estadisticasPorTipo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas generales',
      error: error.message
    });
  }
};

// Obtener estadísticas de un canal
exports.getEstadisticasCanal = async (req, res) => {
  try {
    // Verificar que el canal existe
    const canal = await Canal.findById(req.params.id);
    
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }
    
    // Verificar permisos
    if (req.user.tipo === 'CREADOR' && canal.creadorId.toString() !== req.user.id && req.user.tipo !== 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver las estadísticas de este canal'
      });
    }
    
    // Obtener parámetros de filtro
    const { desde, hasta } = req.query;
    const filtro = {
      entidadId: canal._id,
      tipoEntidad: 'CANAL'
    };
    
    if (desde && hasta) {
      filtro['periodo.inicio'] = { $gte: new Date(desde) };
      filtro['periodo.fin'] = { $lte: new Date(hasta) };
    }
    
    // Obtener estadísticas
    const estadisticas = await Estadistica.find(filtro).sort({ 'periodo.inicio': -1 });
    
    res.status(200).json({
      success: true,
      count: estadisticas.length,
      data: estadisticas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del canal',
      error: error.message
    });
  }
};

// Obtener estadísticas de un anuncio
exports.getEstadisticasAnuncio = async (req, res) => {
  try {
    // Verificar que el anuncio existe
    const anuncio = await Anuncio.findById(req.params.id);
    
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }
    
    // Verificar permisos
    if (
      req.user.tipo === 'ANUNCIANTE' && anuncio.anuncianteId.toString() !== req.user.id ||
      req.user.tipo === 'CREADOR'
    ) {
      const canal = await Canal.findById(anuncio.canalId);
      if (canal.creadorId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver las estadísticas de este anuncio'
        });
      }
    }
    
    // Obtener parámetros de filtro
    const { desde, hasta } = req.query;
    const filtro = {
      entidadId: anuncio._id,
      tipoEntidad: 'ANUNCIO'
    };
    
    if (desde && hasta) {
      filtro['periodo.inicio'] = { $gte: new Date(desde) };
      filtro['periodo.fin'] = { $lte: new Date(hasta) };
    }
    
    // Obtener estadísticas
    const estadisticas = await Estadistica.find(filtro).sort({ 'periodo.inicio': -1 });
    
    res.status(200).json({
      success: true,
      count: estadisticas.length,
      data: estadisticas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del anuncio',
      error: error.message
    });
  }
};

// Registrar estadísticas de un canal
exports.registrarEstadisticasCanal = async (req, res) => {
  try {
    // Verificar que el canal existe
    const canal = await Canal.findById(req.params.id);
    
    if (!canal) {
      return res.status(404).json({
        success: false,
        message: 'Canal no encontrado'
      });
    }
    
    // Verificar permisos (solo el creador del canal o admin puede registrar estadísticas)
    if (req.user.tipo === 'CREADOR' && canal.creadorId.toString() !== req.user.id && req.user.tipo !== 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para registrar estadísticas para este canal'
      });
    }
    
    // Verificar que se proporcionaron los datos necesarios
    if (!req.body.periodo || !req.body.metricas) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar periodo y métricas'
      });
    }
    
    // Crear estadística
    const estadistica = await Estadistica.create({
      entidadId: canal._id,
      tipoEntidad: 'CANAL',
      periodo: req.body.periodo,
      metricas: req.body.metricas,
      fuente: req.body.fuente || 'MANUAL'
    });
    
    res.status(201).json({
      success: true,
      message: 'Estadísticas registradas exitosamente',
      data: estadistica
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar estadísticas',
      error: error.message
    });
  }
};

// Registrar estadísticas de un anuncio
exports.registrarEstadisticasAnuncio = async (req, res) => {
  try {
    // Verificar que el anuncio existe
    const anuncio = await Anuncio.findById(req.params.id);
    
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }
    
    // Verificar permisos
    const canal = await Canal.findById(anuncio.canalId);
    
    if (req.user.tipo === 'CREADOR' && canal.creadorId.toString() !== req.user.id && req.user.tipo !== 'ADMINISTRADOR') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para registrar estadísticas para este anuncio'
      });
    }
    
    // Verificar que se proporcionaron los datos necesarios
    if (!req.body.periodo || !req.body.metricas) {
      return res.status(400).json({
        success: false,
        message: 'Debes proporcionar periodo y métricas'
      });
    }
    
    // Crear estadística
    const estadistica = await Estadistica.create({
      entidadId: anuncio._id,
      tipoEntidad: 'ANUNCIO',
      periodo: req.body.periodo,
      metricas: req.body.metricas,
      fuente: req.body.fuente || 'MANUAL'
    });
    
    res.status(201).json({
      success: true,
      message: 'Estadísticas registradas exitosamente',
      data: estadistica
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar estadísticas',
      error: error.message
    });
  }
};

// Obtener resumen de estadísticas para dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {};
    const rol = req.user.role;
    
    // Estadísticas según el tipo de usuario
    if (rol === 'advertiser') {
      // Obtener anuncios del anunciante
      const anuncios = await Anuncio.find({ anuncianteId: req.user.id });
      const anunciosIds = anuncios.map(a => a._id);
      
      // Totales agregados
      const totalClics = anuncios.reduce((acc, a) => acc + (a.tracking?.clicsTotales || 0), 0);
      const totalImpresiones = anuncios.reduce((acc, a) => acc + (a.tracking?.impresiones || 0), 0);
      const totalConversiones = anuncios.reduce((acc, a) => acc + (a.tracking?.conversiones || 0), 0);
      const totalInversion = anuncios.reduce((acc, a) => acc + (a.presupuesto?.montoTotal || 0), 0);
      const totalIngresos = anuncios.reduce((acc, a) => acc + (a.tracking?.ingresosGenerados || 0), 0);

      stats.resumen = {
        totalAnuncios: anuncios.length,
        clicsTotales: totalClics,
        impresionesTotales: totalImpresiones,
        conversionesTotales: totalConversiones,
        anunciosActivos: anuncios.filter(a => a.estado === 'activo').length,
        ctr: totalImpresiones > 0 ? (totalClics / totalImpresiones) * 100 : 0,
        cpc: totalClics > 0 ? totalInversion / totalClics : 0,
        cpm: totalImpresiones > 0 ? (totalInversion / totalImpresiones) * 1000 : 0,
        roi: totalInversion > 0 ? ((totalIngresos - totalInversion) / totalInversion) * 100 : 0,
        ingresosGenerados: totalIngresos
      };

      // Contar anuncios por estado
      stats.anunciosPorEstado = anuncios.reduce((result, anuncio) => {
        if (!result[anuncio.estado]) {
          result[anuncio.estado] = 0;
        }
        result[anuncio.estado]++;
        return result;
      }, {});
      
      // Obtener estadísticas detalladas
      const estadisticasAnuncios = await Estadistica.find({
        entidadId: { $in: anunciosIds },
        tipoEntidad: 'ANUNCIO'
      }).sort({ 'periodo.fin': -1 }).limit(20);
      
      stats.ultimasEstadisticas = estadisticasAnuncios;
      
    } else if (rol === 'creator') {
      // Obtener canales del creador
      const canales = await Canal.find({ creadorId: req.user.id });
      const canalesIds = canales.map(c => c._id);
      
      // Obtener anuncios en los canales del creador
      const anuncios = await Anuncio.find({ canalId: { $in: canalesIds } });
      
      const ingresosConfirmados = anuncios
        .filter(a => a.estado === 'completado')
        .reduce((acc, a) => acc + (a.presupuesto?.montoTotal || 0), 0);
      
      const ingresosPendientes = anuncios
        .filter(a => ['activo', 'programado'].includes(a.estado))
        .reduce((acc, a) => acc + (a.presupuesto?.montoTotal || 0), 0);

      stats.resumen = {
        totalCanales: canales.length,
        canalesActivos: canales.filter(c => c.estado === 'activo').length,
        ingresosConfirmados,
        ingresosPendientes,
        totalIngresos: ingresosConfirmados + ingresosPendientes,
        totalAnunciosRecibidos: anuncios.length
      };

      // Contar canales por plataforma
      stats.canalesPorPlataforma = canales.reduce((result, canal) => {
        if (!result[canal.plataforma]) {
          result[canal.plataforma] = 0;
        }
        result[canal.plataforma]++;
        return result;
      }, {});

      // Contar anuncios por estado
      stats.anunciosPorEstado = anuncios.reduce((result, anuncio) => {
        if (!result[anuncio.estado]) {
          result[anuncio.estado] = 0;
        }
        result[anuncio.estado]++;
        return result;
      }, {});
      
      // Obtener estadísticas de canales
      const estadisticasCanales = await Estadistica.find({
        entidadId: { $in: canalesIds },
        tipoEntidad: 'CANAL'
      }).sort({ 'periodo.fin': -1 }).limit(10);
      
      stats.estadisticasCanales = estadisticasCanales;
      
    } else if (rol === 'admin') {
      // Contar usuarios por tipo
      const usuariosPorTipo = await Usuario.aggregate([
        { $group: { _id: '$rol', count: { $sum: 1 } } }
      ]);
      
      stats.usuariosPorTipo = usuariosPorTipo.reduce((result, item) => {
        result[item._id] = item.count;
        return result;
      }, {});
      
      stats.totalAnuncios = await Anuncio.countDocuments();
      stats.totalCanales = await Canal.countDocuments();
      stats.totalTransacciones = await Transaccion.countDocuments();
    }
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: error.message
    });
  }
};
