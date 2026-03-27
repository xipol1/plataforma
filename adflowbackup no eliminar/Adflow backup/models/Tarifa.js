const mongoose = require('mongoose');

const tarifaSchema = new mongoose.Schema({
  canalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canal',
    required: true
  },
  tipoAnuncio: {
    type: String,
    enum: ['POST', 'HISTORIA', 'MENCION', 'PATROCINADO'],
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  moneda: {
    type: String,
    default: 'USD',
    required: true
  },
  duracion: {
    type: Number, // en horas
    default: 24
  },
  descripcion: {
    type: String,
    trim: true
  },
  restricciones: [{
    type: String
  }],
  activa: {
    type: Boolean,
    default: true
  },
  caracteristicas: {
    incluyeRedaccion: {
      type: Boolean,
      default: false
    },
    incluyeDiseno: {
      type: Boolean,
      default: false
    },
    incluyeMultimedia: {
      type: Boolean,
      default: false
    },
    cantidadRevisiones: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
tarifaSchema.index({ canalId: 1 });
tarifaSchema.index({ tipoAnuncio: 1 });
tarifaSchema.index({ precio: 1 });
tarifaSchema.index({ activa: 1 });

const Tarifa = mongoose.model('Tarifa', tarifaSchema);

module.exports = Tarifa;
