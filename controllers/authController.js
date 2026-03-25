const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const AuthService = require('../services/authService');
const config = require('../config/config');
const database = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const isDev = env !== 'production';
const logDev = (...args) => {
  if (isDev) console.log(...args);
};

const errorPayload = (error) => (isDev ? { error: error?.message } : {});
const serviceUnavailablePayload = (message, error) => ({
  success: false,
  message,
  ...errorPayload(error)
});

const normalizeEmail = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const buildUserResponse = (usuario) => {
  return {
    id: usuario?._id ? usuario._id.toString() : undefined,
    email: usuario?.email,
    role: usuario?.rol,
    nombre: usuario?.nombre,
    apellido: usuario?.apellido,
    emailVerificado: usuario?.emailVerificado
  };
};

const login = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  try {
    logDev('LOGIN: request', { email });
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y password requeridos' });
    }

    if (!config.database?.uri) {
      console.warn('LOGIN: MONGODB_URI no definida');
      return res.status(503).json(serviceUnavailablePayload('Servicio no disponible'));
    }

    if (!database.estaConectado()) {
      logDev('LOGIN: connecting DB...');
      const ok = await database.conectar();
      if (!ok) {
        const last = database.getLastConnectionError?.();
        return res.status(503).json(serviceUnavailablePayload('Servicio no disponible', last));
      }
    }

    const user = await Usuario.findOne({ email });
    logDev('LOGIN: user lookup', { found: Boolean(user) });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    logDev('LOGIN: password match', isMatch);

    if (!isMatch) {
      logDev('LOGIN: password mismatch', { userId: user._id.toString() });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const tokens = await AuthService.generarTokens(user);
    logDev('LOGIN: tokens generated', { userId: user._id.toString() });

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.rol
      },
      token: tokens.tokenAcceso,
      refreshToken: tokens.tokenRefresco,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...errorPayload(error)
    });
  }
};

const registro = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || '');

  try {
    logDev('REGISTER: request', { email });
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y password requeridos'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    if (!config.database?.uri) {
      console.warn('REGISTER: MONGODB_URI no definida');
      return res.status(503).json(serviceUnavailablePayload('Servicio no disponible'));
    }

    if (!database.estaConectado()) {
      logDev('REGISTER: connecting DB...');
      const ok = await database.conectar();
      if (!ok) {
        const last = database.getLastConnectionError?.();
        return res.status(503).json(serviceUnavailablePayload('Servicio no disponible', last));
      }
    }

    const existing = await Usuario.findOne({ email });
    logDev('REGISTER: user lookup', { found: Boolean(existing) });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const bcryptRounds = Number(config.security?.bcryptRounds) || 10;
    const hashedPassword = await bcrypt.hash(password.trim(), bcryptRounds);

    const user = await Usuario.create({
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    logDev('REGISTER: user created', { userId: user._id.toString() });
    const tokens = await AuthService.generarTokens(user);
    logDev('REGISTER: tokens generated', { userId: user._id.toString() });

    return res.status(201).json({
      success: true,
      user: buildUserResponse(user),
      token: tokens.tokenAcceso,
      refreshToken: tokens.tokenRefresco,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    console.error('REGISTER ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      ...errorPayload(error)
    });
  }
};

const notImplemented = (req, res) => {
  res.status(501).json({ success: false, message: 'No implementado' });
};

module.exports = {
  login,
  registro,
  refreshToken: notImplemented,
  verificarEmail: notImplemented,
  solicitarRestablecimiento: notImplemented,
  restablecerPassword: notImplemented,
  logout: notImplemented,
  obtenerPerfil: notImplemented,
  actualizarPerfil: notImplemented,
  cambiarPassword: notImplemented,
  desactivarCuenta: notImplemented,
  verificarToken: notImplemented,
  obtenerEstadisticas: notImplemented
};
