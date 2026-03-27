const mongoose = require('mongoose');

/**
 * Esquema de Notificación
 */
const notificacionSchema = new mongoose.Schema({
  // Usuario destinatario
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },

  // Tipo de notificación
  tipo: {
    type: String,
    required: true,
    enum: [
      // Notificaciones de usuario
      'usuario.bienvenida',
      'usuario.verificado',
      'usuario.password_cambiado',
      'usuario.login_sospechoso',
      
      // Notificaciones de anuncios
      'anuncio.creado',
      'anuncio.aprobado',
      'anuncio.rechazado',
      'anuncio.completado',
      'anuncio.cancelado',
      'anuncio.expirando',
      'anuncio.nuevo_aplicante',
      
      // Notificaciones de transacciones
      'transaccion.creada',
      'transaccion.completada',
      'transaccion.fallida',
      'transaccion.reembolso',
      'transaccion.pago_liberado',
      
      // Notificaciones de canales
      'canal.aprobado',
      'canal.rechazado',
      'canal.suspendido',
      'canal.reactivado',
      'canal.estadisticas',
      
      // Notificaciones del sistema
      'sistema.mantenimiento',
      'sistema.actualizacion',
      'sistema.promocion',
      'sistema.recordatorio',
      
      // Notificaciones de moderación
      'moderacion.contenido_reportado',
      'moderacion.accion_tomada',
      'moderacion.advertencia',
      
      // Notificaciones de soporte
      'soporte.ticket_creado',
      'soporte.ticket_respondido',
      'soporte.ticket_cerrado'
    ],
    index: true
  },

  // Título de la notificación
  titulo: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },

  // Mensaje de la notificación
  mensaje: {
    type: String,
    required: true,
    maxlength: 1000,
    trim: true
  },

  // Datos adicionales específicos del tipo de notificación
  datos: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Prioridad de la notificación
  prioridad: {
    type: String,
    enum: ['baja', 'normal', 'alta', 'critica'],
    default: 'normal',
    index: true
  },

  // Estado de lectura
  leida: {
    type: Boolean,
    default: false,
    index: true
  },

  // Fecha de lectura
  fechaLectura: {
    type: Date,
    default: null
  },

  // Estado de archivo
  archivada: {
    type: Boolean,
    default: false,
    index: true
  },

  // Fecha de archivo
  fechaArchivo: {
    type: Date,
    default: null
  },

  // Fecha de creación
  fechaCreacion: {
    type: Date,
    default: Date.now,
    index: true
  },

  // Fecha programada (para notificaciones programadas)
  fechaProgramada: {
    type: Date,
    default: null,
    index: true
  },

  // Fecha de expiración (opcional)
  fechaExpiracion: {
    type: Date,
    default: null
  },

  // Canales por los que se envió
  canalesEnviados: [{
    canal: {
      type: String,
      enum: ['database', 'email', 'push', 'sms', 'realtime']
    },
    enviado: {
      type: Boolean,
      default: false
    },
    fechaEnvio: {
      type: Date,
      default: null
    },
    error: {
      type: String,
      default: null
    }
  }],

  // URL de acción (opcional)
  urlAccion: {
    type: String,
    maxlength: 500,
    trim: true
  },

  // Texto del botón de acción (opcional)
  textoAccion: {
    type: String,
    maxlength: 50,
    trim: true
  },

  // Icono de la notificación
  icono: {
    type: String,
    maxlength: 100,
    trim: true
  },

  // Color de la notificación (para UI)
  color: {
    type: String,
    maxlength: 20,
    trim: true
  },

  // Metadatos adicionales
  metadatos: {
    // IP desde donde se generó
    ip: {
      type: String,
      maxlength: 45
    },
    // User agent
    userAgent: {
      type: String,
      maxlength: 500
    },
    // Origen de la notificación
    origen: {
      type: String,
      maxlength: 100
    },
    // ID de referencia externa
    referenciaExterna: {
      type: String,
      maxlength: 100
    }
  }
}, {
  timestamps: true,
  collection: 'notificaciones'
});

// Índices compuestos
notificacionSchema.index({ usuario: 1, leida: 1 });
notificacionSchema.index({ usuario: 1, tipo: 1 });
notificacionSchema.index({ usuario: 1, fechaCreacion: -1 });
notificacionSchema.index({ usuario: 1, prioridad: 1, fechaCreacion: -1 });
notificacionSchema.index({ fechaProgramada: 1 }, { sparse: true });
notificacionSchema.index({ fechaExpiracion: 1 }, { sparse: true });

// Índice de texto para búsqueda
notificacionSchema.index({
  titulo: 'text',
  mensaje: 'text'
}, {
  weights: {
    titulo: 10,
    mensaje: 5
  },
  name: 'notificacion_text_index'
});

// Middleware pre-save
notificacionSchema.pre('save', function(next) {
  // Establecer fecha de lectura si se marca como leída
  if (this.isModified('leida') && this.leida && !this.fechaLectura) {
    this.fechaLectura = new Date();
  }

  // Establecer fecha de archivo si se marca como archivada
  if (this.isModified('archivada') && this.archivada && !this.fechaArchivo) {
    this.fechaArchivo = new Date();
  }

  // Validar fecha de expiración
  if (this.fechaExpiracion && this.fechaExpiracion <= new Date()) {
    return next(new Error('La fecha de expiración debe ser futura'));
  }

  next();
});

// Métodos de instancia
notificacionSchema.methods.marcarComoLeida = function() {
  this.leida = true;
  this.fechaLectura = new Date();
  return this.save();
};

notificacionSchema.methods.archivar = function() {
  this.archivada = true;
  this.fechaArchivo = new Date();
  return this.save();
};

notificacionSchema.methods.estaExpirada = function() {
  return this.fechaExpiracion && this.fechaExpiracion <= new Date();
};

notificacionSchema.methods.esProgramada = function() {
  return this.fechaProgramada && this.fechaProgramada > new Date();
};

notificacionSchema.methods.agregarCanalEnviado = function(canal, exito, error = null) {
  const canalExistente = this.canalesEnviados.find(c => c.canal === canal);
  
  if (canalExistente) {
    canalExistente.enviado = exito;
    canalExistente.fechaEnvio = new Date();
    canalExistente.error = error;
  } else {
    this.canalesEnviados.push({
      canal,
      enviado: exito,
      fechaEnvio: new Date(),
      error
    });
  }
  
  return this.save();
};

// Métodos estáticos
notificacionSchema.statics.obtenerNoLeidas = function(usuarioId) {
  return this.find({
    usuario: usuarioId,
    leida: false,
    archivada: false
  }).sort({ fechaCreacion: -1 });
};

notificacionSchema.statics.contarNoLeidas = function(usuarioId) {
  return this.countDocuments({
    usuario: usuarioId,
    leida: false,
    archivada: false
  });
};

notificacionSchema.statics.obtenerPorTipo = function(usuarioId, tipo, limite = 10) {
  return this.find({
    usuario: usuarioId,
    tipo,
    archivada: false
  })
  .sort({ fechaCreacion: -1 })
  .limit(limite)
  .populate('usuario', 'nombre email');
};

notificacionSchema.statics.limpiarExpiradas = function() {
  return this.deleteMany({
    fechaExpiracion: { $lte: new Date() }
  });
};

notificacionSchema.statics.limpiarAntiguas = function(diasAntiguedad = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
  
  return this.deleteMany({
    fechaCreacion: { $lt: fechaLimite },
    leida: true,
    archivada: true
  });
};

notificacionSchema.statics.obtenerEstadisticas = function(usuarioId) {
  return this.aggregate([
    { $match: { usuario: mongoose.Types.ObjectId(usuarioId) } },
    {
      $group: {
        _id: '$tipo',
        total: { $sum: 1 },
        leidas: { $sum: { $cond: ['$leida', 1, 0] } },
        noLeidas: { $sum: { $cond: ['$leida', 0, 1] } },
        archivadas: { $sum: { $cond: ['$archivada', 1, 0] } }
      }
    },
    {
      $project: {
        tipo: '$_id',
        total: 1,
        leidas: 1,
        noLeidas: 1,
        archivadas: 1,
        tasaLectura: {
          $cond: [
            { $eq: ['$total', 0] },
            0,
            { $divide: ['$leidas', '$total'] }
          ]
        }
      }
    },
    { $sort: { total: -1 } }
  ]);
};

notificacionSchema.statics.obtenerProgramadas = function() {
  return this.find({
    fechaProgramada: { $lte: new Date() },
    'canalesEnviados.enviado': { $ne: true }
  }).populate('usuario', 'nombre email configuracion');
};

notificacionSchema.statics.marcarTodasComoLeidas = function(usuarioId) {
  return this.updateMany(
    {
      usuario: usuarioId,
      leida: false
    },
    {
      $set: {
        leida: true,
        fechaLectura: new Date()
      }
    }
  );
};

notificacionSchema.statics.buscar = function(usuarioId, termino, opciones = {}) {
  const {
    limite = 20,
    pagina = 1,
    tipo = null,
    prioridad = null,
    leida = null
  } = opciones;

  const filtros = {
    usuario: usuarioId,
    $text: { $search: termino }
  };

  if (tipo) filtros.tipo = tipo;
  if (prioridad) filtros.prioridad = prioridad;
  if (leida !== null) filtros.leida = leida;

  return this.find(filtros, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, fechaCreacion: -1 })
    .limit(limite)
    .skip((pagina - 1) * limite);
};

// Virtual para tiempo transcurrido
notificacionSchema.virtual('tiempoTranscurrido').get(function() {
  const ahora = new Date();
  const diferencia = ahora - this.fechaCreacion;
  
  const minutos = Math.floor(diferencia / (1000 * 60));
  const horas = Math.floor(diferencia / (1000 * 60 * 60));
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
  return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
});

// Virtual para estado
notificacionSchema.virtual('estado').get(function() {
  if (this.archivada) return 'archivada';
  if (this.estaExpirada()) return 'expirada';
  if (this.esProgramada()) return 'programada';
  if (this.leida) return 'leida';
  return 'no_leida';
});

// Configurar virtuals en JSON
notificacionSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

notificacionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Notificacion', notificacionSchema);