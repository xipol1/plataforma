const mongoose = require('mongoose');

const transaccionSchema = new mongoose.Schema({
  // Identificación única
  numeroTransaccion: {
    type: String,
    unique: true,
    required: [true, 'El número de transacción es obligatorio']
  },
  
  // Relaciones
  anuncio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Anuncio',
    required: [true, 'El anuncio es obligatorio']
  },
  anunciante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El anunciante es obligatorio']
  },
  creador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El creador es obligatorio']
  },
  canal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canal',
    required: [true, 'El canal es obligatorio']
  },
  
  // Tipo de transacción
  tipo: {
    type: String,
    enum: ['pago_anuncio', 'comision_plataforma', 'pago_creador', 'reembolso', 'ajuste', 'bono', 'penalizacion'],
    required: [true, 'El tipo de transacción es obligatorio']
  },
  
  // Montos
  montos: {
    // Monto original del anuncio
    montoOriginal: {
      valor: {
        type: Number,
        required: [true, 'El monto original es obligatorio'],
        min: [0, 'El monto debe ser positivo']
      },
      moneda: {
        type: String,
        required: [true, 'La moneda es obligatoria'],
        enum: ['USD', 'EUR', 'GBP', 'BTC', 'ETH'],
        default: 'USD'
      }
    },
    
    // Desglose de comisiones
    comisiones: {
      plataforma: {
        porcentaje: { type: Number, default: 10 },
        valor: { type: Number, default: 0 }
      },
      procesamiento: {
        porcentaje: { type: Number, default: 2.9 },
        valor: { type: Number, default: 0 },
        fijo: { type: Number, default: 0.30 } // Tarifa fija (ej: Stripe)
      },
      impuestos: {
        porcentaje: { type: Number, default: 0 },
        valor: { type: Number, default: 0 }
      }
    },
    
    // Montos finales
    montoCreador: {
      valor: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' }
    },
    montoPlataforma: {
      valor: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' }
    },
    montoProcesamiento: {
      valor: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' }
    },
    
    // Conversiones de moneda
    tasaCambio: {
      monedaOrigen: String,
      monedaDestino: String,
      tasa: Number,
      fechaTasa: Date,
      proveedor: String // 'coinbase', 'exchangerate-api', etc.
    }
  },
  
  // Estado de la transacción
  estado: {
    type: String,
    enum: ['pendiente', 'procesando', 'completada', 'fallida', 'cancelada', 'reembolsada', 'disputada', 'retenida'],
    default: 'pendiente'
  },
  
  // Información de pago del anunciante
  pagoAnunciante: {
    metodo: {
      tipo: { type: String, enum: ['stripe', 'paypal', 'crypto', 'transferencia', 'wallet'] },
      detalles: {
        // Para Stripe
        paymentIntentId: String,
        chargeId: String,
        
        // Para PayPal
        paypalOrderId: String,
        paypalPaymentId: String,
        
        // Para Crypto
        walletAddress: String,
        transactionHash: String,
        blockchain: String,
        
        // Para transferencia
        numeroReferencia: String,
        banco: String,
        
        // Información general
        ultimosCuatroDigitos: String,
        marca: String // visa, mastercard, etc.
      }
    },
    
    fechaPago: Date,
    estadoPago: {
      type: String,
      enum: ['pendiente', 'autorizado', 'capturado', 'fallido', 'cancelado', 'reembolsado'],
      default: 'pendiente'
    },
    
    // Intentos de pago
    intentos: [{
      fecha: { type: Date, default: Date.now },
      estado: String,
      codigoError: String,
      mensajeError: String,
      monto: Number
    }],
    
    // Información de facturación
    facturacion: {
      nombre: String,
      email: String,
      direccion: {
        linea1: String,
        linea2: String,
        ciudad: String,
        estado: String,
        codigoPostal: String,
        pais: String
      },
      numeroFactura: String,
      fechaFactura: Date
    }
  },
  
  // Información de pago al creador
  pagoCreador: {
    metodo: {
      tipo: { type: String, enum: ['stripe', 'paypal', 'crypto', 'transferencia', 'wallet'] },
      detalles: {
        // Para Stripe Connect
        accountId: String,
        transferId: String,
        
        // Para PayPal
        paypalEmail: String,
        payoutBatchId: String,
        payoutItemId: String,
        
        // Para Crypto
        walletAddress: String,
        transactionHash: String,
        blockchain: String,
        
        // Para transferencia
        numeroCuenta: String,
        banco: String,
        swift: String,
        iban: String
      }
    },
    
    fechaPago: Date,
    estadoPago: {
      type: String,
      enum: ['pendiente', 'procesando', 'completado', 'fallido', 'retenido'],
      default: 'pendiente'
    },
    
    // Retenciones
    retenciones: {
      activa: { type: Boolean, default: false },
      motivo: String,
      fechaInicio: Date,
      fechaFin: Date,
      montoRetenido: Number
    },
    
    // Información fiscal
    informacionFiscal: {
      tipoContribuyente: String,
      numeroIdentificacion: String,
      retencionImpuestos: {
        aplica: { type: Boolean, default: false },
        porcentaje: Number,
        monto: Number
      }
    }
  },
  
  // Fechas importantes
  fechas: {
    creacion: { type: Date, default: Date.now },
    autorizacion: Date,
    captura: Date,
    completacion: Date,
    vencimiento: Date,
    cancelacion: Date,
    
    // Para pagos programados
    fechaProgramada: Date,
    fechaLiberacion: Date // Cuando se libera el pago al creador
  },
  
  // Seguridad y verificación
  verificacion: {
    // Verificación de identidad
    identidadVerificada: { type: Boolean, default: false },
    documentosVerificacion: [String],
    
    // Detección de fraude
    puntuacionRiesgo: { type: Number, min: 0, max: 100 },
    flagsFraude: [String],
    revisadoManualmente: { type: Boolean, default: false },
    
    // 3D Secure para tarjetas
    secure3D: {
      aplicado: { type: Boolean, default: false },
      estado: String,
      version: String
    }
  },
  
  // Disputas y chargebacks
  disputas: [{
    id: String,
    tipo: { type: String, enum: ['chargeback', 'disputa', 'inquiry'] },
    estado: { type: String, enum: ['abierta', 'respondida', 'ganada', 'perdida', 'cerrada'] },
    monto: Number,
    razon: String,
    fechaCreacion: Date,
    fechaRespuesta: Date,
    fechaResolucion: Date,
    evidencia: [{
      tipo: String,
      url: String,
      descripcion: String
    }],
    notas: String
  }],
  
  // Reembolsos
  reembolsos: [{
    id: String,
    monto: Number,
    razon: String,
    estado: { type: String, enum: ['pendiente', 'procesando', 'completado', 'fallido'] },
    fechaSolicitud: Date,
    fechaProcesamiento: Date,
    solicitadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    aprobadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    },
    notas: String
  }],
  
  // Notificaciones y comunicación
  notificaciones: {
    anunciante: {
      enviadas: [{
        tipo: String,
        fecha: Date,
        canal: String, // email, sms, push
        estado: String // enviado, entregado, leido
      }]
    },
    creador: {
      enviadas: [{
        tipo: String,
        fecha: Date,
        canal: String,
        estado: String
      }]
    }
  },
  
  // Metadatos y tracking
  metadata: {
    // Información del dispositivo/navegador
    userAgent: String,
    ipAddress: String,
    geolocalizacion: {
      pais: String,
      region: String,
      ciudad: String,
      latitud: Number,
      longitud: Number
    },
    
    // Información de sesión
    sessionId: String,
    fingerprint: String,
    
    // UTM y tracking
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    },
    
    // Información adicional
    referrer: String,
    canal: String, // web, mobile, api
    version: String // versión de la API/app
  },
  
  // Auditoría y logs
  auditoria: {
    eventos: [{
      fecha: { type: Date, default: Date.now },
      evento: String,
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      },
      detalles: mongoose.Schema.Types.Mixed,
      ipAddress: String
    }],
    
    // Cambios de estado
    cambiosEstado: [{
      fecha: { type: Date, default: Date.now },
      estadoAnterior: String,
      estadoNuevo: String,
      motivo: String,
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
      }
    }]
  },
  
  // Configuración de retención
  retencion: {
    periodo: { type: Number, default: 7 }, // días
    fechaLiberacion: Date,
    liberacionAutomatica: { type: Boolean, default: true },
    condicionesLiberacion: [String]
  },
  
  // Información de reconciliación
  reconciliacion: {
    reconciliada: { type: Boolean, default: false },
    fechaReconciliacion: Date,
    loteReconciliacion: String,
    discrepancias: [{
      campo: String,
      valorEsperado: mongoose.Schema.Types.Mixed,
      valorEncontrado: mongoose.Schema.Types.Mixed,
      resuelto: { type: Boolean, default: false }
    }]
  },
  
  // Notas y comentarios
  notas: {
    internas: String, // Solo para administradores
    publicas: String, // Visibles para anunciante y creador
    soporte: [{
      fecha: { type: Date, default: Date.now },
      usuario: String,
      comentario: String,
      tipo: { type: String, enum: ['nota', 'accion', 'resolucion'] }
    }]
  },
  
  // Control de versiones y estado
  version: { type: Number, default: 1 },
  activa: { type: Boolean, default: true },
  
  // Información de prueba
  esPrueba: { type: Boolean, default: false },
  entornoPrueba: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
transaccionSchema.index({ numeroTransaccion: 1 }, { unique: true });
transaccionSchema.index({ anuncio: 1 });
transaccionSchema.index({ anunciante: 1 });
transaccionSchema.index({ creador: 1 });
transaccionSchema.index({ canal: 1 });
transaccionSchema.index({ estado: 1 });
transaccionSchema.index({ tipo: 1 });
transaccionSchema.index({ 'pagoAnunciante.estadoPago': 1 });
transaccionSchema.index({ 'pagoCreador.estadoPago': 1 });
transaccionSchema.index({ 'fechas.creacion': -1 });
transaccionSchema.index({ 'fechas.completacion': -1 });
transaccionSchema.index({ activa: 1 });
transaccionSchema.index({ esPrueba: 1 });

// Índices compuestos
transaccionSchema.index({ 
  anunciante: 1, 
  estado: 1, 
  'fechas.creacion': -1 
});

transaccionSchema.index({ 
  creador: 1, 
  'pagoCreador.estadoPago': 1, 
  'fechas.creacion': -1 
});

transaccionSchema.index({ 
  tipo: 1, 
  estado: 1, 
  'montos.montoOriginal.valor': -1 
});

// Virtual para verificar si está completada
transaccionSchema.virtual('completada').get(function() {
  return this.estado === 'completada' && 
         this.pagoAnunciante.estadoPago === 'capturado' &&
         this.pagoCreador.estadoPago === 'completado';
});

// Virtual para calcular comisión total
transaccionSchema.virtual('comisionTotal').get(function() {
  return this.montos.comisiones.plataforma.valor + 
         this.montos.comisiones.procesamiento.valor;
});

// Virtual para verificar si está en disputa
transaccionSchema.virtual('enDisputa').get(function() {
  return this.disputas.some(disputa => 
    ['abierta', 'respondida'].includes(disputa.estado)
  );
});

// Middleware pre-save para calcular montos
transaccionSchema.pre('save', function(next) {
  if (this.isModified('montos.montoOriginal') || this.isModified('montos.comisiones')) {
    const montoOriginal = this.montos.montoOriginal.valor;
    
    // Calcular comisión de plataforma
    this.montos.comisiones.plataforma.valor = 
      (montoOriginal * this.montos.comisiones.plataforma.porcentaje) / 100;
    
    // Calcular comisión de procesamiento
    this.montos.comisiones.procesamiento.valor = 
      (montoOriginal * this.montos.comisiones.procesamiento.porcentaje) / 100 +
      this.montos.comisiones.procesamiento.fijo;
    
    // Calcular impuestos
    this.montos.comisiones.impuestos.valor = 
      (montoOriginal * this.montos.comisiones.impuestos.porcentaje) / 100;
    
    // Calcular monto para el creador
    this.montos.montoCreador.valor = montoOriginal - 
      this.montos.comisiones.plataforma.valor - 
      this.montos.comisiones.procesamiento.valor - 
      this.montos.comisiones.impuestos.valor;
    
    // Calcular monto para la plataforma
    this.montos.montoPlataforma.valor = this.montos.comisiones.plataforma.valor;
    
    // Calcular monto de procesamiento
    this.montos.montoProcesamiento.valor = this.montos.comisiones.procesamiento.valor;
  }
  
  next();
});

// Método para generar número de transacción
transaccionSchema.statics.generarNumeroTransaccion = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

// Método para cambiar estado
transaccionSchema.methods.cambiarEstado = function(nuevoEstado, motivo, usuario) {
  const estadoAnterior = this.estado;
  this.estado = nuevoEstado;
  
  // Agregar al historial de cambios
  this.auditoria.cambiosEstado.push({
    estadoAnterior,
    estadoNuevo: nuevoEstado,
    motivo,
    usuario
  });
  
  // Agregar evento de auditoría
  this.auditoria.eventos.push({
    evento: 'cambio_estado',
    usuario,
    detalles: {
      estadoAnterior,
      estadoNuevo: nuevoEstado,
      motivo
    }
  });
  
  return this.save();
};

// Método para procesar reembolso
transaccionSchema.methods.procesarReembolso = function(monto, razon, solicitadoPor) {
  const reembolso = {
    id: `REF-${Date.now()}`,
    monto,
    razon,
    estado: 'pendiente',
    fechaSolicitud: new Date(),
    solicitadoPor
  };
  
  this.reembolsos.push(reembolso);
  
  // Agregar evento de auditoría
  this.auditoria.eventos.push({
    evento: 'solicitud_reembolso',
    usuario: solicitadoPor,
    detalles: { monto, razon }
  });
  
  return this.save();
};

// Método para liberar pago al creador
transaccionSchema.methods.liberarPagoCreador = function() {
  if (this.retencion.fechaLiberacion <= new Date()) {
    this.pagoCreador.estadoPago = 'procesando';
    this.fechas.fechaLiberacion = new Date();
    
    this.auditoria.eventos.push({
      evento: 'liberacion_pago_creador',
      detalles: { monto: this.montos.montoCreador.valor }
    });
    
    return this.save();
  }
  
  throw new Error('El período de retención no ha finalizado');
};

module.exports = mongoose.model('Transaccion', transaccionSchema);