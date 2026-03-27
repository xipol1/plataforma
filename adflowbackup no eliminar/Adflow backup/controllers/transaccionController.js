const Transaccion = require('../models/Transaccion');
const Usuario = require('../models/Usuario');
const Anuncio = require('../models/Anuncio');
const { validationResult } = require('express-validator');
const config = require('../config/config');
const crypto = require('crypto');
const StripeAPI = require('../integraciones/stripe');
const PayPalAPI = require('../integraciones/paypal');

const stripe = new StripeAPI(config.payments.stripe.secretKey);
const paypal = new PayPalAPI(config.payments.paypal.clientId, config.payments.paypal.clientSecret, config.payments.paypal.mode);

/**
 * Obtener transacciones del usuario autenticado
 */
exports.obtenerMisTransacciones = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      tipo, 
      estado, 
      fechaInicio, 
      fechaFin 
    } = req.query;
    
    // Construir filtros
    const filtros = {
      $or: [
        { anunciante: req.user.id },
        { creador: req.user.id }
      ]
    };
    
    if (tipo) filtros.tipo = tipo;
    if (estado) filtros.estado = estado;
    
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
    }

    // Opciones de paginación
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
          path: 'creador',
          select: 'nombre email perfilCreador.nombreArtistico'
        },
        {
          path: 'anuncio',
          select: 'titulo tipoAnuncio estado',
          populate: {
            path: 'canal',
            select: 'nombreCanal plataforma'
          }
        }
      ]
    };

    const resultado = await Transaccion.paginate(filtros, opciones);

    res.json({
      success: true,
      data: {
        transacciones: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs,
          elementosPorPagina: resultado.limit
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener una transacción específica
 */
exports.obtenerTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transaccion = await Transaccion.findById(id)
      .populate('anunciante', 'nombre email perfilAnunciante')
      .populate('creador', 'nombre email perfilCreador')
      .populate({
        path: 'anuncio',
        select: 'titulo descripcion tipoAnuncio estado presupuesto',
        populate: {
          path: 'canal',
          select: 'nombreCanal plataforma'
        }
      });

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verificar permisos
    const esAnunciante = transaccion.anunciante && transaccion.anunciante._id.toString() === req.user.id;
    const esCreador = transaccion.creador && transaccion.creador._id.toString() === req.user.id;
    const esAdmin = req.user.rol === 'admin';
    
    if (!esAnunciante && !esCreador && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta transacción'
      });
    }

    res.json({
      success: true,
      data: {
        transaccion
      }
    });

  } catch (error) {
    console.error('Error al obtener transacción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Procesar pago de anuncio
 */
exports.procesarPagoAnuncio = async (req, res) => {
  try {
    const { anuncioId, metodoPago, datosPago } = req.body;

    // Verificar errores de validación
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errores: errores.array()
      });
    }

    // Verificar que el anuncio existe y pertenece al usuario
    const anuncio = await Anuncio.findById(anuncioId).populate('canal');
    if (!anuncio) {
      return res.status(404).json({
        success: false,
        message: 'Anuncio no encontrado'
      });
    }

    if (anuncio.anunciante.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para pagar este anuncio'
      });
    }

    // Verificar que el anuncio esté aprobado
    if (anuncio.estado !== 'aprobado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden pagar anuncios aprobados'
      });
    }

    // Verificar que no exista ya una transacción para este anuncio
    const transaccionExistente = await Transaccion.findOne({ anuncio: anuncioId });
    if (transaccionExistente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una transacción para este anuncio'
      });
    }

    // Obtener usuario para verificar saldo
    const usuario = await Usuario.findById(req.user.id);
    if (usuario.billetera.saldo < anuncio.presupuesto.montoTotal) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente para procesar el pago'
      });
    }

    // Generar ID de transacción único
    const transaccionId = `TXN_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Crear transacción
    const nuevaTransaccion = new Transaccion({
      transaccionId,
      anuncio: anuncioId,
      anunciante: req.user.id,
      creador: anuncio.canal.propietario,
      tipo: 'pago_anuncio',
      montoTotal: anuncio.presupuesto.montoTotal,
      montoAnunciante: anuncio.presupuesto.montoTotal,
      montoCreador: anuncio.presupuesto.montoCreador,
      comisionPlataforma: anuncio.presupuesto.comisionPlataforma,
      moneda: anuncio.presupuesto.moneda,
      metodoPago: {
        tipo: metodoPago,
        detalles: datosPago
      },
      estado: 'procesando'
    });

    await nuevaTransaccion.save();

    // Procesamiento real de pago
    try {
      const descripcion = `Pago anuncio: ${anuncio.titulo} (${anuncioId})`;
      const resultadoPago = await procesarPagoReal(
        metodoPago, 
        datosPago, 
        anuncio.presupuesto.montoTotal, 
        anuncio.presupuesto.moneda,
        descripcion
      );
      
      if (resultadoPago.exito) {
        // Pago exitoso
        nuevaTransaccion.estado = 'completado';
        nuevaTransaccion.fechaCompletado = new Date();
        nuevaTransaccion.referenciaExterna = resultadoPago.referenciaExterna;
        
        // Actualizar saldos
        await Usuario.findByIdAndUpdate(req.user.id, {
          $inc: { 
            'billetera.saldo': -anuncio.presupuesto.montoTotal,
            'billetera.fondosReservados': anuncio.presupuesto.montoTotal
          }
        });
        
        // Activar anuncio
        await Anuncio.findByIdAndUpdate(anuncioId, {
          estado: 'activo',
          fechaActivacion: new Date(),
          transaccion: nuevaTransaccion._id
        });
        
      } else {
        // Pago fallido
        nuevaTransaccion.estado = 'fallido';
        nuevaTransaccion.razonFallo = resultadoPago.error;
      }
      
      await nuevaTransaccion.save();
      
    } catch (errorPago) {
      console.error('Error al procesar pago:', errorPago);
      nuevaTransaccion.estado = 'fallido';
      nuevaTransaccion.razonFallo = 'Error en el procesamiento del pago';
      await nuevaTransaccion.save();
    }

    res.status(201).json({
      success: true,
      message: nuevaTransaccion.estado === 'completado' ? 'Pago procesado exitosamente' : 'Error al procesar el pago',
      data: {
        transaccion: {
          id: nuevaTransaccion._id,
          transaccionId: nuevaTransaccion.transaccionId,
          estado: nuevaTransaccion.estado,
          monto: nuevaTransaccion.montoTotal,
          moneda: nuevaTransaccion.moneda
        }
      }
    });

  } catch (error) {
    console.error('Error al procesar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Liberar pago al creador
 */
exports.liberarPagoCreador = async (req, res) => {
  try {
    const { id } = req.params;

    const transaccion = await Transaccion.findById(id).populate('anuncio');
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verificar permisos (anunciante o admin)
    const esAnunciante = transaccion.anunciante.toString() === req.user.id;
    const esAdmin = req.user.rol === 'admin';
    
    if (!esAnunciante && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para liberar este pago'
      });
    }

    // Verificar que la transacción esté completada y el anuncio esté completado
    if (transaccion.estado !== 'completado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden liberar transacciones completadas'
      });
    }

    if (transaccion.anuncio.estado !== 'completado') {
      return res.status(400).json({
        success: false,
        message: 'El anuncio debe estar completado para liberar el pago'
      });
    }

    if (transaccion.pagoCreadorLiberado) {
      return res.status(400).json({
        success: false,
        message: 'El pago ya ha sido liberado al creador'
      });
    }

    // Liberar fondos al creador
    await Usuario.findByIdAndUpdate(transaccion.creador, {
      $inc: { 'billetera.saldo': transaccion.montoCreador }
    });

    // Reducir fondos reservados del anunciante
    await Usuario.findByIdAndUpdate(transaccion.anunciante, {
      $inc: { 'billetera.fondosReservados': -transaccion.montoTotal }
    });

    // Actualizar transacción
    transaccion.pagoCreadorLiberado = true;
    transaccion.fechaLiberacionCreador = new Date();
    await transaccion.save();

    // Actualizar estadísticas del creador
    await Usuario.findByIdAndUpdate(transaccion.creador, {
      $inc: { 
        'estadisticas.ingresosTotales': transaccion.montoCreador,
        'estadisticas.anunciosCompletados': 1
      }
    });

    res.json({
      success: true,
      message: 'Pago liberado exitosamente al creador',
      data: {
        transaccion: {
          id: transaccion._id,
          montoLiberado: transaccion.montoCreador,
          fechaLiberacion: transaccion.fechaLiberacionCreador
        }
      }
    });

  } catch (error) {
    console.error('Error al liberar pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Procesar reembolso
 */
exports.procesarReembolso = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon, montoReembolso } = req.body;

    const transaccion = await Transaccion.findById(id).populate('anuncio');
    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verificar permisos (anunciante o admin)
    const esAnunciante = transaccion.anunciante.toString() === req.user.id;
    const esAdmin = req.user.rol === 'admin';
    
    if (!esAnunciante && !esAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para solicitar reembolso de esta transacción'
      });
    }

    // Verificar que se pueda reembolsar
    if (transaccion.estado !== 'completado') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden reembolsar transacciones completadas'
      });
    }

    if (transaccion.pagoCreadorLiberado) {
      return res.status(400).json({
        success: false,
        message: 'No se puede reembolsar una transacción con pago ya liberado'
      });
    }

    // Validar monto de reembolso
    const montoMaximo = transaccion.montoTotal;
    if (montoReembolso > montoMaximo) {
      return res.status(400).json({
        success: false,
        message: `El monto de reembolso no puede exceder ${montoMaximo}`
      });
    }

    // Generar ID de reembolso
    const reembolsoId = `REF_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Procesar reembolso
    const reembolso = {
      reembolsoId,
      monto: montoReembolso,
      razon,
      fechaSolicitud: new Date(),
      estado: 'procesando',
      solicitadoPor: req.user.id
    };

    transaccion.reembolsos.push(reembolso);

    try {
      // Procesamiento real de reembolso
      const resultadoReembolso = await procesarReembolsoReal(transaccion, montoReembolso, razon);
      
      if (resultadoReembolso.exito) {
        // Reembolso exitoso
        reembolso.estado = 'completado';
        reembolso.fechaCompletado = new Date();
        reembolso.referenciaExterna = resultadoReembolso.referenciaExterna;
        
        // Actualizar saldos
        await Usuario.findByIdAndUpdate(transaccion.anunciante, {
          $inc: { 
            'billetera.saldo': montoReembolso,
            'billetera.fondosReservados': -montoReembolso
          }
        });
        
        // Si es reembolso total, cancelar anuncio
        if (montoReembolso === transaccion.montoTotal) {
          await Anuncio.findByIdAndUpdate(transaccion.anuncio._id, {
            estado: 'cancelado'
          });
        }
        
      } else {
        reembolso.estado = 'fallido';
        reembolso.razonFallo = resultadoReembolso.error;
      }
      
    } catch (errorReembolso) {
      console.error('Error al procesar reembolso:', errorReembolso);
      reembolso.estado = 'fallido';
      reembolso.razonFallo = 'Error en el procesamiento del reembolso';
    }

    await transaccion.save();

    res.json({
      success: true,
      message: reembolso.estado === 'completado' ? 'Reembolso procesado exitosamente' : 'Error al procesar el reembolso',
      data: {
        reembolso: {
          id: reembolso.reembolsoId,
          estado: reembolso.estado,
          monto: reembolso.monto,
          fecha: reembolso.fechaSolicitud
        }
      }
    });

  } catch (error) {
    console.error('Error al procesar reembolso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener estadísticas financieras
 */
exports.obtenerEstadisticasFinancieras = async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;
    const userId = req.user.id;

    // Calcular fecha de inicio
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

    if (req.user.rol === 'anunciante') {
      // Estadísticas para anunciantes
      const transacciones = await Transaccion.find({
        anunciante: userId,
        fechaCreacion: { $gte: fechaInicio },
        estado: 'completado'
      });

      estadisticas = {
        totalGastado: transacciones.reduce((sum, t) => sum + t.montoTotal, 0),
        numeroTransacciones: transacciones.length,
        promedioGasto: transacciones.length > 0 ? transacciones.reduce((sum, t) => sum + t.montoTotal, 0) / transacciones.length : 0,
        comisionesPagadas: transacciones.reduce((sum, t) => sum + t.comisionPlataforma, 0)
      };
    } else if (req.user.rol === 'creador') {
      // Estadísticas para creadores
      const transacciones = await Transaccion.find({
        creador: userId,
        fechaCreacion: { $gte: fechaInicio },
        estado: 'completado',
        pagoCreadorLiberado: true
      });

      estadisticas = {
        totalRecibido: transacciones.reduce((sum, t) => sum + t.montoCreador, 0),
        numeroTransacciones: transacciones.length,
        promedioIngreso: transacciones.length > 0 ? transacciones.reduce((sum, t) => sum + t.montoCreador, 0) / transacciones.length : 0,
        fondosPendientes: await calcularFondosPendientes(userId)
      };
    }

    // Obtener saldo actual
    const usuario = await Usuario.findById(userId).select('billetera');
    estadisticas.saldoActual = usuario.billetera.saldo;
    estadisticas.fondosReservados = usuario.billetera.fondosReservados;

    res.json({
      success: true,
      data: {
        periodo,
        estadisticas
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas financieras:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener transacciones para administración
 */
exports.obtenerTransaccionesAdmin = async (req, res) => {
  try {
    // Verificar permisos de administrador
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado'
      });
    }

    const {
      pagina = 1,
      limite = 20,
      estado,
      tipo,
      fechaInicio,
      fechaFin,
      usuario
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) filtros.estado = estado;
    if (tipo) filtros.tipo = tipo;
    if (usuario) {
      filtros.$or = [
        { anunciante: usuario },
        { creador: usuario }
      ];
    }
    
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
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
          path: 'creador',
          select: 'nombre email perfilCreador.nombreArtistico'
        },
        {
          path: 'anuncio',
          select: 'titulo estado'
        }
      ]
    };

    const resultado = await Transaccion.paginate(filtros, opciones);

    // Calcular estadísticas generales
    const estadisticasGenerales = await Transaccion.aggregate([
      { $match: filtros },
      {
        $group: {
          _id: null,
          totalTransacciones: { $sum: 1 },
          montoTotal: { $sum: '$montoTotal' },
          comisionesTotales: { $sum: '$comisionPlataforma' },
          transaccionesCompletadas: {
            $sum: { $cond: [{ $eq: ['$estado', 'completado'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        transacciones: resultado.docs,
        paginacion: {
          paginaActual: resultado.page,
          totalPaginas: resultado.totalPages,
          totalElementos: resultado.totalDocs
        },
        estadisticas: estadisticasGenerales[0] || {
          totalTransacciones: 0,
          montoTotal: 0,
          comisionesTotales: 0,
          transaccionesCompletadas: 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener transacciones admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Procesamiento real de pago usando Stripe o PayPal
 */
async function procesarPagoReal(metodoPago, datosPago, monto, moneda, descripcion) {
  try {
    if (metodoPago === 'tarjeta_credito' || metodoPago === 'tarjeta_debito') {
      // Usar Stripe para pagos con tarjeta
      const paymentIntent = await stripe.createPaymentIntent({
        amount: Math.round(monto * 100), // Stripe usa centavos
        currency: moneda.toLowerCase(),
        payment_method_types: ['card'],
        description: descripcion,
        metadata: {
          nombreTitular: datosPago.nombreTitular
        }
      });

      return {
        exito: true,
        referenciaExterna: paymentIntent.id,
        detalles: paymentIntent
      };
    } else if (metodoPago === 'paypal') {
      // Usar PayPal para pagos con cuenta PayPal
      const order = await paypal.createOrder({
        intent: 'CAPTURE',
        purchaseUnits: [{
          amount: {
            currencyCode: moneda.toUpperCase(),
            value: monto.toFixed(2)
          },
          description: descripcion
        }]
      });

      return {
        exito: true,
        referenciaExterna: order.id,
        detalles: order
      };
    } else if (metodoPago === 'billetera') {
      // Pago con saldo interno (ya verificado antes de llamar a esta función)
      return {
        exito: true,
        referenciaExterna: `WALLET_${Date.now()}`,
        detalles: { metodo: 'billetera_interna' }
      };
    }

    throw new Error('Método de pago no soportado para procesamiento real');
  } catch (error) {
    console.error(`❌ Error en procesamiento de pago (${metodoPago}):`, error.message);
    return {
      exito: false,
      error: error.message
    };
  }
}

/**
 * Simular procesamiento de reembolso (reemplazar con integración real en el futuro)
 */
async function procesarReembolsoReal(transaccion, monto, razon) {
  try {
    const metodo = transaccion.metodoPago.tipo;
    const idReferencia = transaccion.referenciaExterna;

    if (metodo === 'tarjeta_credito' || metodo === 'tarjeta_debito') {
      // Reembolso en Stripe
      const refund = await stripe.createRefund({
        payment_intent: idReferencia,
        amount: Math.round(monto * 100),
        reason: 'requested_by_customer'
      });
      return { exito: true, referenciaExterna: refund.id };
    } else if (metodo === 'paypal') {
      // Reembolso en PayPal
      const refund = await paypal.refundCapture(idReferencia, {
        amount: {
          currencyCode: transaccion.moneda.toUpperCase(),
          value: monto.toFixed(2)
        },
        noteToPayer: razon
      });
      return { exito: true, referenciaExterna: refund.id };
    }

    return { exito: true, referenciaExterna: `REF_INTERNAL_${Date.now()}` };
  } catch (error) {
    console.error('❌ Error en procesamiento de reembolso:', error.message);
    return { exito: false, error: error.message };
  }
}

/**
 * Calcular fondos pendientes de liberación
 */
async function calcularFondosPendientes(creadorId) {
  const transaccionesPendientes = await Transaccion.find({
    creador: creadorId,
    estado: 'completado',
    pagoCreadorLiberado: false
  });
  
  return transaccionesPendientes.reduce((sum, t) => sum + t.montoCreador, 0);
}

module.exports = exports;