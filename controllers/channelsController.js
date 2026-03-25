const Canal = require('../models/Canal');
const { ensureDb } = require('../lib/ensureDb');

const parseIntOr = (value, fallback) => {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
};

const listChannels = async (req, res) => {
  const ok = await ensureDb();
  if (!ok) {
    return res.status(503).json({ success: false, message: 'Servicio no disponible' });
  }

  const pagina = Math.max(1, parseIntOr(req.query?.pagina, 1));
  const limite = Math.min(60, Math.max(1, parseIntOr(req.query?.limite, 20)));

  const filtro = { estado: { $in: ['activo'] } };

  if (req.query?.plataforma) filtro.plataforma = String(req.query.plataforma).toLowerCase();
  if (req.query?.categoria) filtro.categoria = String(req.query.categoria).toLowerCase();

  const [items, total] = await Promise.all([
    Canal.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pagina - 1) * limite)
      .limit(limite)
      .lean(),
    Canal.countDocuments(filtro)
  ]);

  return res.json({
    success: true,
    data: {
      items,
      pagina,
      limite,
      total
    }
  });
};

const getMyChannels = async (req, res) => {
  const ok = await ensureDb();
  if (!ok) {
    return res.status(503).json({ success: false, message: 'Servicio no disponible' });
  }

  const userId = req.usuario?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'No autorizado' });

  const items = await Canal.find({ propietario: userId }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: { items } });
};

const createChannel = async (req, res) => {
  const ok = await ensureDb();
  if (!ok) {
    return res.status(503).json({ success: false, message: 'Servicio no disponible' });
  }

  const userId = req.usuario?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'No autorizado' });

  const plataforma = String(req.body?.plataforma || '').trim().toLowerCase();
  const identificadorCanal = String(req.body?.identificadorCanal || '').trim();
  const nombreCanal = String(req.body?.nombreCanal || '').trim();
  const categoria = String(req.body?.categoria || '').trim().toLowerCase();
  const descripcion = String(req.body?.descripcion || '').trim();

  if (!plataforma || !identificadorCanal) {
    return res.status(400).json({ success: false, message: 'plataforma e identificadorCanal requeridos' });
  }

  const canal = await Canal.create({
    propietario: userId,
    plataforma,
    identificadorCanal,
    nombreCanal,
    categoria,
    descripcion,
    estado: 'pendiente_verificacion'
  });

  return res.status(201).json({ success: true, data: canal });
};

module.exports = {
  listChannels,
  getMyChannels,
  createChannel
};
