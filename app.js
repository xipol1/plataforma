const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { notImplementedModule } = require('./middleware/notImplemented');

const app = express();

const ENV = process.env.NODE_ENV || 'development';
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
const FRONTEND_URL = process.env.FRONTEND_URL || '';

app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.set('trust proxy', 1);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (ENV !== 'production') return cb(null, true);
    if (FRONTEND_URL && origin === FRONTEND_URL) return cb(null, true);
    return cb(new Error('Origin no permitido por CORS'));
  },
  credentials: false
}));
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

const enabledRoutes = [
  ['/api/auth', './routes/auth'],
  ['/auth', './routes/auth'],
  ['/api/channels', './routes/channels'],
  ['/channels', './routes/channels']
];

enabledRoutes.forEach(([mountPath, modulePath]) => safeMount(mountPath, modulePath));

const disabledModules = [
  { module: 'canales', paths: ['/api/canales'] },
  { module: 'anuncios', paths: ['/api/anuncios'] },
  { module: 'transacciones', paths: ['/api/transacciones'] },
  { module: 'notifications', paths: ['/api/notifications'] },
  { module: 'files', paths: ['/api/files'] },
  { module: 'estadisticas', paths: ['/api/estadisticas'] },
  { module: 'campaigns', paths: ['/api/campaigns', '/campaigns'] },
  { module: 'lists', paths: ['/api/lists'] }
];

disabledModules.forEach(({ module, paths }) => {
  const handler = notImplementedModule(module);
  paths.forEach((mountPath) => app.use(mountPath, handler));
});

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
