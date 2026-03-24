const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  partner_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: [true, 'El partner_id es obligatorio']
  },
  endpoint: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true,
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  },
  status_code: {
    type: Number,
    required: true
  },
  request_body: {
    type: mongoose.Schema.Types.Mixed
  },
  response_body: {
    type: mongoose.Schema.Types.Mixed
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice para auditoría
apiLogSchema.index({ partner_id: 1, created_at: -1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);
