const jwt = require('jsonwebtoken');
const config = require('../config/config');

const autenticar = (req, res, next) => {
  const authHeader = req.headers?.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }

  if (!config.jwt?.secret) {
    console.warn('⚠️ JWT_SECRET no configurado; autenticación deshabilitada');
    return res.status(500).json({ success: false, message: 'Autenticación no configurada' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithms: ['HS256']
    });
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('AUTH ERROR:', error);
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

module.exports = { autenticar };
