const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const AuthService = require('../services/authService');
const config = require('../config/config');
const database = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const isDev = env !== 'production';

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

  try {
    console.log('LOGIN: request', { email });

    if (!process.env.MONGODB_URI) {
      console.warn('LOGIN: MONGODB_URI no definida');
      return res.status(503).json({
        success: false,
        message: 'Servicio no disponible',
        ...(isDev ? { error: 'MONGODB_URI no definida' } : {})
      });
    }

    if (!database.estaConectado()) {
      console.log('LOGIN: connecting DB...');
      const ok = await database.conectar();
      if (!ok) {
        const last = database.getLastConnectionError?.();
        return res.status(503).json({
          success: false,
          message: 'Servicio no disponible',
          ...(isDev && last ? { error: last.message || String(last) } : {})
        });
      }
    }

    const usuario = await Usuario.findOne({ email });
    console.log('LOGIN: user lookup', { found: Boolean(usuario) });

    if (!usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const passwordOk = await AuthService.compararPassword(String(req.body?.password || ''), usuario.password);
    if (!passwordOk) {
      console.log('LOGIN: password mismatch', { userId: usuario._id.toString() });
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    console.log('LOGIN: password ok', { userId: usuario._id.toString() });
    const tokens = await AuthService.generarTokens(usuario);
    console.log('LOGIN: tokens generated', { userId: usuario._id.toString() });

    return res.json({
      success: true,
      user: buildUserResponse(usuario),
      token: tokens.tokenAcceso,
      refreshToken: tokens.tokenRefresco,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Servicio no disponible',
      ...(isDev ? { error: error?.message || String(error) } : {})
    });
  }
};

const registro = async (req, res) => {
  const email = normalizeEmail(req.body?.email);

  try {
    console.log('REGISTER: request', { email });

    if (!process.env.MONGODB_URI) {
      console.warn('REGISTER: MONGODB_URI no definida');
      return res.status(503).json({
        success: false,
        message: 'Servicio no disponible',
        ...(isDev ? { error: 'MONGODB_URI no definida' } : {})
      });
    }

    if (!database.estaConectado()) {
      console.log('REGISTER: connecting DB...');
      const ok = await database.conectar();
      if (!ok) {
        const last = database.getLastConnectionError?.();
        return res.status(503).json({
          success: false,
          message: 'Servicio no disponible',
          ...(isDev && last ? { error: last.message || String(last) } : {})
        });
      }
    }

    const existing = await Usuario.findOne({ email });
    console.log('REGISTER: user lookup', { found: Boolean(existing) });
    if (existing) {
      return res.status(400).json({ success: false, message: 'El email ya está registrado' });
    }

    const password = String(req.body?.password || '');
    const nombre = String(req.body?.nombre || '');
    const apellido = String(req.body?.apellido || '');
    const role = String(req.body?.role || '');

    const hashed = await AuthService.hashPassword(password);
    const usuario = await Usuario.create({
      email,
      password: hashed,
      nombre,
      apellido,
      rol: role || 'advertiser',
      emailVerificado: false,
      activo: true
    });

    console.log('REGISTER: user created', { userId: usuario._id.toString() });
    const tokens = await AuthService.generarTokens(usuario);
    console.log('REGISTER: tokens generated', { userId: usuario._id.toString() });

    return res.status(201).json({
      success: true,
      user: buildUserResponse(usuario),
      token: tokens.tokenAcceso,
      refreshToken: tokens.tokenRefresco,
      expiresIn: tokens.expiresIn
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Servicio no disponible',
      ...(isDev ? { error: error?.message || String(error) } : {})
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
