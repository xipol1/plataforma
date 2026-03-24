const mongoose = require('mongoose');

const estadisticaSchema = new mongoose.Schema({
  entidadId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  tipoEntidad: {
    type: String,
    enum: ['CANAL', 'ANUNCIO'],
    required: true
  },
  periodo: {
    inicio: {
      type: Date,
      required: true
    },
    fin: {
      type: Date,
      required: true
    }
  },
  metricas: {
    impresiones: {
      type: Number,
      default: 0
    },
    alcance: {
      type: Number,
      default: 0
    },
    interacciones: {
      type: Number,
      default: 0
    },
    clics: {
      type: Number,
      default: 0
    },
    clicsUnicos: {
      type: Number,
      default: 0
    },
    tasaClics: {
      type: Number,
      default: 0 // CTR: clics / impresiones
    },
    conversiones: {
      type: Number,
      default: 0
    },
    compartidos: {
      type: Number,
      default: 0
    },
    comentarios: {
      type: Number,
      default: 0
    },
    reacciones: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    },
    tasaRebote: {
      type: Number,
      default: 0
    },
    tiempoPromedioEnPagina: {
      type: Number,
      default: 0
    }
  },
  metricasFinancieras: {
    inversionTotal: { type: Number, default: 0 },
    ingresosGenerados: { type: Number, default: 0 },
    roi: { type: Number, default: 0 }, // Return on Investment
    roas: { type: Number, default: 0 }, // Return on Ad Spend
    cpc: { type: Number, default: 0 }, // Cost Per Click
    cpm: { type: Number, default: 0 }, // Cost Per Mille
    cpa: { type: Number, default: 0 }  // Cost Per Action/Conversion
  },
  metricasSociales: {
    telegram: {
      vistas: { type: Number, default: 0 },
      forwards: { type: Number, default: 0 },
      miembrosAlPublicar: { type: Number, default: 0 }
    },
    whatsapp: {
      entregados: { type: Number, default: 0 },
      leidos: { type: Number, default: 0 }
    },
    discord: {
      reacciones: { type: Number, default: 0 },
      miembrosActivos: { type: Number, default: 0 }
    },
    instagram: {
      likes: { type: Number, default: 0 },
      comentarios: { type: Number, default: 0 },
      guardados: { type: Number, default: 0 }
    }
  },
  desglose: {
    porDia: [{
      fecha: Date,
      clics: Number,
      impresiones: Number,
      interacciones: Number,
      conversiones: Number
    }],
    porRegion: [{
      region: String,
      clics: Number,
      conversiones: Number
    }],
    porDemografia: {
      edades: Object,
      generos: Object,
      idiomas: Object
    },
    porDispositivo: [{
      dispositivo: String, // mobile, desktop, tablet, smartTV, console
      os: String, // Android, iOS, Windows, macOS, Linux
      navegador: String, // Chrome, Safari, Firefox, Edge
      clics: Number
    }],
    porFuente: [{
      fuente: String, // telegram, whatsapp, instagram, facebook, discord, direct
      clics: Number,
      conversiones: Number
    }],
    porHora: [{
      hora: Number, // 0-23
      clics: Number
    }]
  },
  fuente: {
    type: String,
    enum: ['MANUAL', 'API', 'ESTIMADO'],
    default: 'ESTIMADO'
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
estadisticaSchema.index({ entidadId: 1, tipoEntidad: 1 });
estadisticaSchema.index({ 'periodo.inicio': 1, 'periodo.fin': 1 });

const Estadistica = mongoose.model('Estadistica', estadisticaSchema);

module.exports = Estadistica;
