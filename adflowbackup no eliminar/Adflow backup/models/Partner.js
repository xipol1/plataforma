const mongoose = require('mongoose');
const crypto = require('crypto');

const partnerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del partner es obligatorio'],
    trim: true,
    unique: true
  },
  api_key_hash: {
    type: String,
    required: true,
    unique: true,
    select: false
  },
  api_key_hint: {
    type: String, // Últimos 4 caracteres para identificación manual
    select: true
  },
  allowed_ips: [{
    type: String, // Lista blanca de IPs (opcional)
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'revoked'],
    default: 'active'
  },
  last_used_at: {
    type: Date
  },
  last_ip: {
    type: String
  },
  rate_limit: {
    type: Number,
    default: 60 // Peticiones por minuto
  },
  expires_at: {
    type: Date // Fecha de caducidad opcional
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas por el hash de la API Key
partnerSchema.index({ api_key_hash: 1 });

/**
 * Método estático para generar una nueva API Key y guardarla de forma segura
 * Devuelve el objeto partner y la clave en texto plano (solo esta vez)
 */
partnerSchema.statics.generateNewPartner = async function(name, allowedIps = []) {
  const plainKey = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(plainKey).digest('hex');
  const hint = plainKey.slice(-4);

  const partner = await this.create({
    name,
    api_key_hash: hash,
    api_key_hint: hint,
    allowed_ips: allowedIps
  });

  return { partner, plainKey };
};

/**
 * Método para verificar si una clave proporcionada es válida (usando comparación de hash)
 */
partnerSchema.methods.verifyApiKey = function(providedKey) {
  const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
  // Usar timingSafeEqual para evitar ataques de timing (aunque con hash SHA256 es menos crítico, es buena práctica)
  const hashBuffer = Buffer.from(this.api_key_hash, 'hex');
  const providedBuffer = Buffer.from(providedHash, 'hex');
  
  if (hashBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(hashBuffer, providedBuffer);
};

module.exports = mongoose.model('Partner', partnerSchema);
