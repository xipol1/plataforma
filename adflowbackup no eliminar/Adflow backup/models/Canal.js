const mongoose = require('mongoose');

const canalSchema = new mongoose.Schema({
  propietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El propietario del canal es obligatorio']
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del canal es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  plataforma: {
    type: String,
    enum: ['telegram', 'whatsapp', 'instagram', 'facebook', 'discord'],
    required: [true, 'La plataforma es obligatoria']
  },
  
  // Identificadores de la plataforma
  identificadores: {
    username: String, // @username para Telegram/Instagram
    chatId: String, // ID del chat para Telegram
    phoneNumber: String, // Número para WhatsApp
    pageId: String, // ID de página para Facebook
    serverId: String, // ID del servidor para Discord
    channelId: String // ID del canal para Discord
  },
  
  // URL del canal
  url: {
    type: String,
    required: [true, 'La URL del canal es obligatoria']
  },
  
  // Categoría del contenido
  categoria: {
    type: String,
    enum: ['tecnologia', 'moda', 'viajes', 'comida', 'deportes', 'entretenimiento', 'educacion', 'negocios', 'salud', 'gaming', 'musica', 'arte', 'otros'],
    required: [true, 'La categoría es obligatoria']
  },
  
  // Subcategorías
  subcategorias: [{
    type: String
  }],
  
  // Idioma principal
  idioma: {
    type: String,
    default: 'es',
    enum: ['es', 'en', 'pt', 'fr', 'de', 'it', 'otros']
  },
  
  // País/región objetivo
  paisObjetivo: {
    type: String,
    default: 'ES'
  },
  
  // Configuración de publicación
  configuracion: {
    publicacionAutomatica: {
      type: Boolean,
      default: true
    },
    whatsapp: {
      modo: {
        type: String,
        enum: ['automatico', 'manual'],
        default: 'automatico'
      }
    }
  },
  
  // Estadísticas del canal
  estadisticas: {
    seguidores: { type: Number, default: 0 },
    seguidoresVerificados: { type: Number, default: 0 },
    promedioVisualizaciones: { type: Number, default: 0 },
    promedioInteracciones: { type: Number, default: 0 },
    tasaEngagement: { type: Number, default: 0 },
    ultimaActualizacion: { type: Date, default: Date.now }
  },
  
  // Scoring fields
  initialScore: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
  performanceScore: { type: Number, default: 0 },
  level: { 
    type: String, 
    enum: ['BRONZE', 'SILVER', 'GOLD', 'ELITE'],
    default: 'BRONZE'
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'PENDING_REVIEW', 'REJECTED'],
    default: 'PENDING_REVIEW'
  },
  isVerified: { type: Boolean, default: false },
  flags: [String],
  
  // Demografía de la audiencia
  demografia: {
    edades: {
      '13-17': { type: Number, default: 0 },
      '18-24': { type: Number, default: 0 },
      '25-34': { type: Number, default: 0 },
      '35-44': { type: Number, default: 0 },
      '45-54': { type: Number, default: 0 },
      '55+': { type: Number, default: 0 }
    },
    generos: {
      masculino: { type: Number, default: 0 },
      femenino: { type: Number, default: 0 },
      otros: { type: Number, default: 0 }
    },
    ubicaciones: [{
      pais: String,
      porcentaje: Number
    }]
  },
  
  // Tarifas por tipo de anuncio
  tarifas: {
    post: {
      precio: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' },
      descripcion: String
    },
    story: {
      precio: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' },
      descripcion: String
    },
    mencion: {
      precio: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' },
      descripcion: String
    },
    video: {
      precio: { type: Number, default: 0 },
      moneda: { type: String, default: 'USD' },
      descripcion: String
    },
    personalizado: [{
      nombre: String,
      precio: Number,
      moneda: { type: String, default: 'USD' },
      descripcion: String
    }]
  },
  
  // Políticas de contenido
  politicasContenido: {
    aceptaAdultos: { type: Boolean, default: false },
    aceptaApuestas: { type: Boolean, default: false },
    aceptaCripto: { type: Boolean, default: true },
    aceptaSupplementos: { type: Boolean, default: true },
    aceptaFinanzas: { type: Boolean, default: true },
    aceptaTecnologia: { type: Boolean, default: true },
    restriccionesAdicionales: String
  },
  
  // Configuración de publicación
  configuracionPublicacion: {
    horariosPreferidos: [{
      dia: { type: String, enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] },
      horaInicio: String, // formato HH:MM
      horaFin: String
    }],
    tiempoMinimoEntreAnuncios: { type: Number, default: 24 }, // horas
    maximoAnunciosPorDia: { type: Number, default: 3 },
    requiereAprobacionPrevia: { type: Boolean, default: true },
    tiempoRespuestaPromedio: { type: Number, default: 24 } // horas
  },
  
  // Estado del canal
  estado: {
    type: String,
    enum: ['pendiente', 'verificado', 'rechazado', 'suspendido', 'inactivo'],
    default: 'pendiente'
  },
  
  // Verificación
  verificacion: {
    verificado: { type: Boolean, default: false },
    fechaVerificacion: Date,
    metodoVerificacion: String,
    documentosVerificacion: [String],
    notasVerificacion: String
  },
  
  // Calificaciones y reviews
  calificaciones: {
    promedio: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    distribucion: {
      '5': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '1': { type: Number, default: 0 }
    }
  },
  
  // Estadísticas de rendimiento
  rendimiento: {
    anunciosPublicados: { type: Number, default: 0 },
    anunciosCompletados: { type: Number, default: 0 },
    anunciosCancelados: { type: Number, default: 0 },
    ingresosTotales: { type: Number, default: 0 },
    ingresosMesActual: { type: Number, default: 0 },
    tasaCompletacion: { type: Number, default: 0 },
    tiempoRespuestaPromedio: { type: Number, default: 0 }
  },
  
  // Configuración de notificaciones
  notificaciones: {
    nuevasSolicitudes: { type: Boolean, default: true },
    recordatoriosPublicacion: { type: Boolean, default: true },
    actualizacionesEstadisticas: { type: Boolean, default: false }
  },
  
  // Metadatos
  activo: { type: Boolean, default: true },
  destacado: { type: Boolean, default: false },
  fechaUltimaActividad: { type: Date, default: Date.now },
  tags: [String],
  notas: String
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices
canalSchema.index({ propietario: 1 });
canalSchema.index({ plataforma: 1 });
canalSchema.index({ categoria: 1 });
canalSchema.index({ estado: 1 });
canalSchema.index({ 'verificacion.verificado': 1 });
canalSchema.index({ activo: 1 });
canalSchema.index({ destacado: 1 });
canalSchema.index({ 'estadisticas.seguidores': -1 });
canalSchema.index({ 'calificaciones.promedio': -1 });
canalSchema.index({ 'tarifas.post.precio': 1 });

// Índice compuesto para búsquedas
canalSchema.index({ 
  categoria: 1, 
  plataforma: 1, 
  'estadisticas.seguidores': -1 
});

// Virtual para URL completa
canalSchema.virtual('urlCompleta').get(function() {
  if (this.plataforma === 'telegram') {
    return `https://t.me/${this.identificadores.username}`;
  } else if (this.plataforma === 'instagram') {
    return `https://instagram.com/${this.identificadores.username}`;
  } else if (this.plataforma === 'whatsapp') {
    return `https://wa.me/${this.identificadores.phoneNumber}`;
  }
  return this.url;
});

// Virtual para verificar si está disponible
canalSchema.virtual('disponible').get(function() {
  return this.activo && this.estado === 'verificado' && this.verificacion.verificado;
});

// Virtual para calcular precio mínimo
canalSchema.virtual('precioMinimo').get(function() {
  const precios = [
    this.tarifas.post.precio,
    this.tarifas.story.precio,
    this.tarifas.mencion.precio,
    this.tarifas.video.precio
  ].filter(precio => precio > 0);
  
  return precios.length > 0 ? Math.min(...precios) : 0;
});

// Método para actualizar estadísticas
canalSchema.methods.actualizarEstadisticas = function(nuevasEstadisticas) {
  this.estadisticas = { ...this.estadisticas, ...nuevasEstadisticas };
  this.estadisticas.ultimaActualizacion = new Date();
  return this.save();
};

// Método para calcular tasa de engagement
canalSchema.methods.calcularEngagement = function() {
  if (this.estadisticas.seguidores > 0) {
    this.estadisticas.tasaEngagement = 
      (this.estadisticas.promedioInteracciones / this.estadisticas.seguidores) * 100;
  }
  return this.estadisticas.tasaEngagement;
};

module.exports = mongoose.model('Canal', canalSchema);