const Partner = require('../../models/Partner');
const ApiLog = require('../../models/ApiLog');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

/**
 * Middleware para autenticar partners mediante API Key (Hardened)
 */
const authPartner = async (req, res, next) => {
  try {
    // Aceptar API Key desde el header 'x-api-key' o 'Authorization: Bearer <API_KEY>'
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    let apiKey;

    if (apiKeyHeader) {
      apiKey = apiKeyHeader;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      apiKey = authHeader.split(' ')[1];
    } else {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Se requiere API Key en el header x-api-key o Authorization: Bearer'
      });
    }
    
    // Hash de la clave proporcionada para búsqueda
    const providedHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Buscar partner por el hash de la API Key
    const partner = await Partner.findOne({ api_key_hash: providedHash });

    if (!partner) {
      // Retardo artificial aleatorio para mitigar ataques de timing y fuerza bruta (enumeración)
      const delay = Math.floor(Math.random() * 200) + 100;
      return setTimeout(() => {
        res.status(401).json({ success: false, message: 'Credenciales inválidas' });
      }, delay);
    }

    // Verificar estado del partner
    if (partner.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Acceso revocado'
      });
    }

    // Verificar expiración de la clave
    if (partner.expires_at && new Date() > partner.expires_at) {
      return res.status(403).json({
        success: false,
        message: 'Clave de API caducada'
      });
    }

    // Validación de IP Whitelisting (Capa extra de seguridad)
    const clientIp = req.ip || req.connection.remoteAddress;
    if (partner.allowed_ips && partner.allowed_ips.length > 0) {
      const isAllowed = partner.allowed_ips.some(ip => {
        // Soporte básico para IP exacta o comodín simple
        return ip === clientIp || ip === '*';
      });

      if (!isAllowed) {
        console.warn(`[Security] Intento de acceso denegado por IP: ${clientIp} para partner ${partner.name}`);
        return res.status(403).json({
          success: false,
          message: 'IP no autorizada'
        });
      }
    }

    // Actualizar métricas de uso (Asíncrono, no bloqueante)
    Partner.updateOne(
      { _id: partner._id },
      { $set: { last_used_at: new Date(), last_ip: clientIp } }
    ).catch(err => console.error('Error actualizando métricas partner:', err));

    // Adjuntar partner al request
    req.partner = partner;
    next();
  } catch (error) {
    console.error('Error crítico en authPartner:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno de seguridad'
    });
  }
};

/**
 * Utility to mask sensitive data in objects
 */
const maskSensitiveData = (obj) => {
  if (!obj) return obj;
  const masked = JSON.parse(JSON.stringify(obj));
  const sensitiveFields = ['api_key', 'password', 'token', 'email', 'auth', 'authorization'];

  const mask = (item) => {
    if (typeof item !== 'object' || item === null) return;
    
    Object.keys(item).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        item[key] = '********';
      } else if (typeof item[key] === 'object') {
        mask(item[key]);
      }
    });
  };

  mask(masked);
  return masked;
};

/**
 * Middleware para logging de todas las requests de integraciones
 */
const logIntegrationRequest = async (req, res, next) => {
  const originalSend = res.send;
  let responseBody;

  res.send = function(body) {
    try {
      responseBody = body ? JSON.parse(body) : undefined;
    } catch (e) {
      responseBody = body;
    }
    return originalSend.apply(res, arguments);
  };

  res.on('finish', async () => {
    try {
      if (req.partner) {
        await ApiLog.create({
          partner_id: req.partner._id,
          endpoint: req.originalUrl,
          method: req.method,
          status_code: res.statusCode,
          request_body: req.method !== 'GET' ? maskSensitiveData(req.body) : undefined,
          response_body: responseBody ? maskSensitiveData(responseBody) : undefined
        });
      }
    } catch (error) {
      console.error('Error al guardar log de API:', error);
    }
  });

  next();
};

/**
 * Rate limiting: Configurable por API Key (Default: 60 req/min)
 */
const partnerRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: (req) => {
    return req.partner ? req.partner.rate_limit : 60;
  },
  keyGenerator: (req) => {
    return req.partner ? req.partner._id.toString() : req.ip;
  },
  message: {
    success: false,
    message: 'Límite de peticiones excedido. Por favor contacte con soporte si necesita ampliar su cuota.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !req.partner // Solo aplicar si el partner está autenticado (ya que authPartner va antes)
});

module.exports = {
  authPartner,
  logIntegrationRequest,
  partnerRateLimiter
};
