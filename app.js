const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { notImplementedRouter } = require('./lib/notImplemented');

const app = express();

const ENV = process.env.NODE_ENV || 'development';
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: '*', credentials: false }));
app.use(compression());
app.use(morgan(ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: ENV
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const safeMount = (mountPath, modulePath) => {
  let mountError = null;
  try {
    const router = require(modulePath);
    if (router) {
      app.use(mountPath, router);
      return;
    }
  } catch (e) {
    mountError = e;
    console.error(`SAFE MOUNT ERROR (${mountPath} -> ${modulePath}):`, e);
  }

  app.use(mountPath, (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Servicio no disponible',
      ...(ENV === 'development' && mountError ? { error: mountError.message || String(mountError) } : {})
    });
  });
};

safeMount('/api/auth', './routes/auth');
safeMount('/auth', './routes/auth');

safeMount('/api/canales', './routes/canales');
app.use('/api/anuncios', notImplementedRouter('anuncios'));
app.use('/api/transacciones', notImplementedRouter('transacciones'));
app.use('/api/notifications', notImplementedRouter('notifications'));
app.use('/api/files', notImplementedRouter('files'));
app.use('/api/estadisticas', notImplementedRouter('estadisticas'));
safeMount('/api/campaigns', './routes/campaigns');
app.use('/api/lists', notImplementedRouter('lists'));

safeMount('/api/channels', './routes/channels');

safeMount('/channels', './routes/channels');

const distPath = path.join(__dirname, 'dist');
const distIndex = path.join(distPath, 'index.html');
const hasDist = fs.existsSync(distIndex);

if (hasDist) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) return next();
    if (req.path.startsWith('/uploads') || req.path.startsWith('/public')) return next();
    res.sendFile(distIndex);
  });
}

app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.path} no encontrada`,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res) => {
  if (hasDist) {
    res.status(404).sendFile(distIndex);
    return;
  }
  res.status(404).json({
    success: false,
    message: `Ruta ${req.path} no encontrada`,
    timestamp: new Date().toISOString()
  });
});

app.use((error, req, res, next) => {
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;
