const { readCollection, writeCollection } = require('../services/persistentStore');

const demoChannels = [
  { id: 'demo-ch-crypto-alpha-signals', nombre: 'Crypto Alpha Signals', plataforma: 'telegram', engagement: 2.9, ctr: 3.2, precio: 450 },
  { id: 'demo-ch-gaming-deals-hub', nombre: 'Gaming Deals Hub', plataforma: 'discord', engagement: 4.1, ctr: 3.9, precio: 650 },
  { id: 'demo-ch-ai-insider-pro', nombre: 'AI Insider Pro', plataforma: 'telegram', engagement: 3.2, ctr: 3.4, precio: 1200 },
  { id: 'demo-ch-startup-weekly', nombre: 'Startup Weekly', plataforma: 'newsletter', engagement: 3.6, ctr: 2.7, precio: 220 }
];

const COLLECTION = 'campaigns';

const normalizeBudget = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const readCampaigns = () => readCollection(COLLECTION, []);
const saveCampaigns = (items) => writeCollection(COLLECTION, items);

const buildCampaign = (payload, userId) => {
  const now = new Date();
  return {
    id: `cmp-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
    ownerId: userId,
    titulo: String(payload.titulo || 'Campaña sin título').trim(),
    descripcion: String(payload.descripcion || '').trim(),
    presupuesto: normalizeBudget(payload.presupuesto),
    estado: 'draft',
    createdAt: now.toISOString(),
    canales: Array.isArray(payload.canales) ? payload.canales : []
  };
};

const ensureAdvertiser = (req, res) => {
  const role = req.usuario?.rol || req.usuario?.role;
  if (role !== 'advertiser' && role !== 'admin') {
    res.status(403).json({ success: false, message: 'Solo anunciantes o admins pueden gestionar campañas' });
    return false;
  }
  return true;
};

const getCampaigns = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
  const campaigns = readCampaigns();
  const data = campaigns.filter((item) => item.ownerId === userId);
  res.json({ success: true, data });
};

const createCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;

  const budget = normalizeBudget(req.body?.presupuesto);
  if (budget <= 0) {
    return res.status(400).json({ success: false, message: 'Presupuesto inválido' });
  }

  const campaigns = readCampaigns();
  const campaign = buildCampaign(req.body || {}, userId);
  campaigns.push(campaign);
  saveCampaigns(campaigns);

  return res.status(201).json({ success: true, data: campaign });
};

const optimize = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;

  const budget = normalizeBudget(req.body?.presupuesto || req.body?.budget);
  if (budget <= 0) {
    return res.status(400).json({ success: false, message: 'Presupuesto inválido para optimización' });
  }

  const orderedChannels = demoChannels
    .slice()
    .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 5)
    .map((channel) => ({
      id: channel.id,
      nombre: channel.nombre,
      plataforma: channel.plataforma,
      precio: channel.precio,
      score: Number((channel.engagement || 0) * (channel.ctr || 0)).toFixed(2)
    }));

  return res.json({
    success: true,
    data: {
      presupuesto: budget,
      recomendados: orderedChannels
    }
  });
};

const launchAutoCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;

  const budget = normalizeBudget(req.body?.presupuesto || req.body?.budget);
  if (budget <= 0) {
    return res.status(400).json({ success: false, message: 'Presupuesto inválido para lanzamiento' });
  }

  const optimizedChannels = demoChannels
    .slice()
    .sort((a, b) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 3);

  const newCampaign = {
    id: `cmp-auto-${Date.now()}`,
    ownerId: userId,
    titulo: String(req.body?.titulo || 'Campaña automática').trim(),
    descripcion: String(req.body?.descripcion || '').trim(),
    presupuesto: budget,
    estado: 'active',
    createdAt: new Date().toISOString(),
    canales: optimizedChannels.map((channel) => channel.id)
  };

  const campaigns = readCampaigns();
  campaigns.push(newCampaign);
  saveCampaigns(campaigns);

  return res.status(201).json({
    success: true,
    data: {
      campaign: newCampaign,
      canalesSeleccionados: optimizedChannels
    }
  });
};

module.exports = {
  getCampaigns,
  createCampaign,
  optimize,
  launchAutoCampaign,
  // stubs from main
  getCampaignById: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }),
  updateCampaignStatus: (req, res) => res.status(501).json({ success: false, message: 'Not implemented' })
};
