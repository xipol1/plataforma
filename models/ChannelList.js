const mongoose = require('mongoose');

const channelListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre de la lista es obligatorio'],
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El usuario es obligatorio']
  },
  category: {
    type: String,
    enum: ['tecnologia', 'moda', 'viajes', 'comida', 'deportes', 'entretenimiento', 'educacion', 'negocios', 'salud', 'gaming', 'musica', 'arte', 'otros'],
    default: 'otros'
  },
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canal'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for user lists
channelListSchema.index({ userId: 1 });

module.exports = mongoose.model('ChannelList', channelListSchema);
