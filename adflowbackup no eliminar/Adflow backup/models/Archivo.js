const mongoose = require('mongoose');

/**
 * Esquema de Archivo
 */
const archivoSchema = new mongoose.Schema({
  // Usuario propietario del archivo
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
    index: true
  },

  // Información básica del archivo
  nombreOriginal: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true
  },

  nombreArchivo: {
    type: String,
    required: true,
    maxlength: 255,
    trim: true,
    unique: true
  },

  tipoMime: {
    type: String,
    required: true,
    maxlength: 100,
    index: true
  },

  tamano: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },

  // Rutas de archivos
  ruta: {
    type: String,
    required: true,
    maxlength: 500
  },

  rutaOptimizada: {
    type: String,
    maxlength: 500,
    default: null
  },

  rutaThumbnail: {
    type: String,
    maxlength: 500,
    default: null
  },

  // Hash del archivo para detectar duplicados
  hash: {
    type: String,
    required: true,
    maxlength: 64,
    index: true
  },

  // Metadatos del archivo
  metadata: {
    // Para imágenes
    ancho: {
      type: Number,
      min: 0
    },
    alto: {
      type: Number,
      min: 0
    },
    formato: {
      type: String,
      maxlength: 20
    },
    hasAlpha: {
      type: Boolean,
      default: false
    },
    // Para documentos
    paginas: {
      type: Number,
      min: 0
    },
    // Metadatos adicionales
    duracion: {
      type: Number,
      min: 0
    },
    bitrate: {
      type: Number,
      min: 0
    },
    // Información EXIF para imágenes
    exif: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    // Metadatos personalizados
    custom: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },

  // Categorización
  categoria: {
    type: String,
    enum: [
      'general',
      'imagen',
      'documento',
      'avatar',
      'anuncio',
      'perfil',
      'verificacion',
      'soporte',
      'temporal'
    ],
    default: 'general',
    index: true
  },

  // Descripción del archivo
  descripcion: {
    type: String,
    maxlength: 500,
    trim: true,
    default: ''
  },

  // Etiquetas para organización
  etiquetas: [{
    type: String,
    maxlength: 50,
    trim: true
  }],

  // Control de acceso
  esPublico: {
    type: Boolean,
    default: false,
    index: true
  },

  // Permisos específicos
  permisos: {
    lectura: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }],
    escritura: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Usuario'
    }]
  },

  // Estado del archivo
  estado: {
    type: String,
    enum: ['activo', 'eliminado', 'procesando', 'error', 'cuarentena'],
    default: 'activo',
    index: true
  },

  // Información de procesamiento
  procesamiento: {
    estado: {
      type: String,
      enum: ['pendiente', 'procesando', 'completado', 'error'],
      default: 'completado'
    },
    fechaInicio: {
      type: Date,
      default: null
    },
    fechaFin: {
      type: Date,
      default: null
    },
    error: {
      type: String,
      maxlength: 500,
      default: null
    },
    progreso: {
      type: Number,
      min: 0,
      max: 100,
      default: 100
    }
  },

  // Estadísticas de uso
  estadisticas: {
    descargas: {
      type: Number,
      default: 0,
      min: 0
    },
    vistas: {
      type: Number,
      default: 0,
      min: 0
    },
    ultimaDescarga: {
      type: Date,
      default: null
    },
    ultimaVista: {
      type: Date,
      default: null
    }
  },

  // Información de seguridad
  seguridad: {
    escaneado: {
      type: Boolean,
      default: false
    },
    fechaEscaneo: {
      type: Date,
      default: null
    },
    resultadoEscaneo: {
      type: String,
      enum: ['limpio', 'sospechoso', 'malicioso', 'no_escaneado'],
      default: 'no_escaneado'
    },
    detallesEscaneo: {
      type: String,
      maxlength: 500,
      default: null
    }
  },

  // Fechas importantes
  fechaSubida: {
    type: Date,
    default: Date.now,
    index: true
  },

  fechaModificacion: {
    type: Date,
    default: Date.now
  },

  fechaExpiracion: {
    type: Date,
    default: null,
    index: true
  },

  fechaEliminacion: {
    type: Date,
    default: null
  },

  // Información adicional
  origen: {
    ip: {
      type: String,
      maxlength: 45
    },
    userAgent: {
      type: String,
      maxlength: 500
    },
    referencia: {
      type: String,
      maxlength: 200
    }
  },

  // Relaciones con otras entidades
  relacionado: {
    tipo: {
      type: String,
      enum: ['anuncio', 'usuario', 'transaccion', 'soporte', 'canal'],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  }
}, {
  timestamps: true,
  collection: 'archivos'
});

// Índices compuestos
archivoSchema.index({ usuario: 1, categoria: 1 });
archivoSchema.index({ usuario: 1, fechaSubida: -1 });
archivoSchema.index({ usuario: 1, estado: 1 });
archivoSchema.index({ tipoMime: 1, categoria: 1 });
archivoSchema.index({ hash: 1, usuario: 1 });
archivoSchema.index({ fechaExpiracion: 1 }, { sparse: true });
archivoSchema.index({ 'relacionado.tipo': 1, 'relacionado.id': 1 }, { sparse: true });

// Índice de texto para búsqueda
archivoSchema.index({
  nombreOriginal: 'text',
  descripcion: 'text',
  etiquetas: 'text'
}, {
  weights: {
    nombreOriginal: 10,
    etiquetas: 5,
    descripcion: 1
  },
  name: 'archivo_text_index'
});

// Middleware pre-save
archivoSchema.pre('save', function(next) {
  // Actualizar fecha de modificación
  this.fechaModificacion = new Date();
  
  // Validar tamaño del archivo
  if (this.tamano > 100 * 1024 * 1024) { // 100MB
    return next(new Error('El archivo es demasiado grande'));
  }
  
  // Validar extensión del archivo
  const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'];
  const extension = this.nombreOriginal.toLowerCase().substring(this.nombreOriginal.lastIndexOf('.'));
  
  if (!extensionesPermitidas.includes(extension)) {
    return next(new Error('Tipo de archivo no permitido'));
  }
  
  next();
});

// Middleware pre-remove
archivoSchema.pre('remove', function(next) {
  // Marcar fecha de eliminación
  this.fechaEliminacion = new Date();
  this.estado = 'eliminado';
  next();
});

// Métodos de instancia
archivoSchema.methods.incrementarDescargas = function() {
  this.estadisticas.descargas += 1;
  this.estadisticas.ultimaDescarga = new Date();
  return this.save();
};

archivoSchema.methods.incrementarVistas = function() {
  this.estadisticas.vistas += 1;
  this.estadisticas.ultimaVista = new Date();
  return this.save();
};

archivoSchema.methods.esImagen = function() {
  return this.tipoMime.startsWith('image/');
};

archivoSchema.methods.esDocumento = function() {
  return this.tipoMime.includes('pdf') || 
         this.tipoMime.includes('document') || 
         this.tipoMime.includes('text');
};

archivoSchema.methods.esVideo = function() {
  return this.tipoMime.startsWith('video/');
};

archivoSchema.methods.esAudio = function() {
  return this.tipoMime.startsWith('audio/');
};

archivoSchema.methods.estaExpirado = function() {
  return this.fechaExpiracion && this.fechaExpiracion <= new Date();
};

archivoSchema.methods.puedeAcceder = function(usuarioId) {
  // El propietario siempre puede acceder
  if (this.usuario.toString() === usuarioId.toString()) {
    return true;
  }
  
  // Si es público, cualquiera puede acceder
  if (this.esPublico) {
    return true;
  }
  
  // Verificar permisos específicos
  return this.permisos.lectura.includes(usuarioId);
};

archivoSchema.methods.puedeModificar = function(usuarioId) {
  // El propietario siempre puede modificar
  if (this.usuario.toString() === usuarioId.toString()) {
    return true;
  }
  
  // Verificar permisos de escritura
  return this.permisos.escritura.includes(usuarioId);
};

archivoSchema.methods.agregarEtiqueta = function(etiqueta) {
  if (!this.etiquetas.includes(etiqueta)) {
    this.etiquetas.push(etiqueta);
    return this.save();
  }
  return Promise.resolve(this);
};

archivoSchema.methods.eliminarEtiqueta = function(etiqueta) {
  this.etiquetas = this.etiquetas.filter(e => e !== etiqueta);
  return this.save();
};

archivoSchema.methods.marcarComoEliminado = function() {
  this.estado = 'eliminado';
  this.fechaEliminacion = new Date();
  return this.save();
};

// Métodos estáticos
archivoSchema.statics.buscarPorHash = function(hash, usuarioId = null) {
  const filtros = { hash };
  if (usuarioId) {
    filtros.usuario = usuarioId;
  }
  return this.findOne(filtros);
};

archivoSchema.statics.obtenerPorCategoria = function(categoria, usuarioId, opciones = {}) {
  const { limite = 20, pagina = 1 } = opciones;
  const skip = (pagina - 1) * limite;
  
  return this.find({
    usuario: usuarioId,
    categoria,
    estado: 'activo'
  })
  .sort({ fechaSubida: -1 })
  .limit(limite)
  .skip(skip);
};

archivoSchema.statics.obtenerExpirados = function() {
  return this.find({
    fechaExpiracion: { $lte: new Date() },
    estado: 'activo'
  });
};

archivoSchema.statics.obtenerEstadisticas = function(usuarioId) {
  return this.aggregate([
    { $match: { usuario: mongoose.Types.ObjectId(usuarioId), estado: 'activo' } },
    {
      $group: {
        _id: null,
        totalArchivos: { $sum: 1 },
        tamanoTotal: { $sum: '$tamano' },
        totalDescargas: { $sum: '$estadisticas.descargas' },
        totalVistas: { $sum: '$estadisticas.vistas' }
      }
    },
    {
      $project: {
        _id: 0,
        totalArchivos: 1,
        tamanoTotal: 1,
        tamanoTotalMB: { $divide: ['$tamanoTotal', 1048576] },
        totalDescargas: 1,
        totalVistas: 1
      }
    }
  ]);
};

archivoSchema.statics.obtenerEstadisticasPorTipo = function(usuarioId) {
  return this.aggregate([
    { $match: { usuario: mongoose.Types.ObjectId(usuarioId), estado: 'activo' } },
    {
      $group: {
        _id: '$tipoMime',
        cantidad: { $sum: 1 },
        tamanoTotal: { $sum: '$tamano' },
        descargas: { $sum: '$estadisticas.descargas' }
      }
    },
    { $sort: { cantidad: -1 } }
  ]);
};

archivoSchema.statics.limpiarExpirados = function() {
  return this.updateMany(
    {
      fechaExpiracion: { $lte: new Date() },
      estado: 'activo'
    },
    {
      $set: {
        estado: 'eliminado',
        fechaEliminacion: new Date()
      }
    }
  );
};

archivoSchema.statics.limpiarEliminados = function(diasAntiguedad = 30) {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
  
  return this.deleteMany({
    estado: 'eliminado',
    fechaEliminacion: { $lt: fechaLimite }
  });
};

archivoSchema.statics.buscarArchivos = function(usuarioId, termino, opciones = {}) {
  const {
    limite = 20,
    pagina = 1,
    categoria = null,
    tipoMime = null
  } = opciones;

  const filtros = {
    usuario: usuarioId,
    estado: 'activo',
    $text: { $search: termino }
  };

  if (categoria) filtros.categoria = categoria;
  if (tipoMime) filtros.tipoMime = new RegExp(tipoMime, 'i');

  return this.find(filtros, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, fechaSubida: -1 })
    .limit(limite)
    .skip((pagina - 1) * limite);
};

archivoSchema.statics.obtenerDuplicados = function(usuarioId) {
  return this.aggregate([
    { $match: { usuario: mongoose.Types.ObjectId(usuarioId), estado: 'activo' } },
    {
      $group: {
        _id: '$hash',
        archivos: { $push: '$$ROOT' },
        cantidad: { $sum: 1 }
      }
    },
    { $match: { cantidad: { $gt: 1 } } },
    { $sort: { cantidad: -1 } }
  ]);
};

// Virtual para URL del archivo
archivoSchema.virtual('url').get(function() {
  return `/api/archivos/${this._id}`;
});

// Virtual para URL del thumbnail
archivoSchema.virtual('thumbnailUrl').get(function() {
  return this.rutaThumbnail ? `/api/archivos/${this._id}/thumbnail` : null;
});

// Virtual para tamaño legible
archivoSchema.virtual('tamanoLegible').get(function() {
  const bytes = this.tamano;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual para tipo de archivo
archivoSchema.virtual('tipoArchivo').get(function() {
  if (this.esImagen()) return 'imagen';
  if (this.esDocumento()) return 'documento';
  if (this.esVideo()) return 'video';
  if (this.esAudio()) return 'audio';
  return 'otro';
});

// Configurar virtuals en JSON
archivoSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    delete ret.ruta; // No exponer la ruta física
    delete ret.rutaOptimizada;
    delete ret.rutaThumbnail;
    return ret;
  }
});

archivoSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Archivo', archivoSchema);