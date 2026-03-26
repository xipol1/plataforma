﻿const { readCollection, writeCollection } = require('../services/persistentStore');

const demoChannels = [
  { id: 'demo-ch-crypto-alpha-signals', nombre: 'Crypto Alpha Signals', plataforma: 'telegram', engagement: 2.9, ctr: 3.2, precio: 450 },
  { id: 'demo-ch-gaming-deals-hub', nombre: 'Gaming Deals Hub', plataforma: 'discord', engagement: 4.1, ctr: 3.9, precio: 650 },
  { id: 'demo-ch-ai-insider-pro', nombre: 'AI Insider Pro', plataforma: 'telegram', engagement: 3.2, ctr: 3.4, precio: 1200 },
  { id: 'demo-ch-startup-weekly', nombre: 'Startup Weekly', plataforma: 'newsletter', engagement: 3.6, ctr: 2.7, precio: 220 }
];

const COLLECTION = 'campaigns';
const TRANSITIONS = {
  draft: ['paid', 'cancelled'],
  paid: ['published', 'cancelled'],
  published: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
};

const normalizeBudget = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const readCampaigns = () => readCollection(COLLECTION, []);
const saveCampaigns = (items) => writeCollection(COLLECTION, items);
const userIdOf = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;

const ensureAdvertiser = (req, res) => {
  const role = req.usuario?.rol || req.usuario?.role;
  if (role !== 'advertiser' && role !== 'admin') {
    res.status(403).json({ success: false, message: 'Solo anunciantes o admins pueden gestionar campañas' });
    return false;
  }
  return true;
};

const buildCampaign = (payload, userId) => {
  const now = new Date();
  const presupuesto = normalizeBudget(payload.presupuesto || payload.price || payload.budget);
  return {
    id: `cmp-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
    ownerId: userId,
    titulo: String(payload.titulo || payload.title || 'Campaña sin título').trim(),
    descripcion: String(payload.descripcion || payload.content || '').trim(),
    presupuesto,
    targetUrl: String(payload.targetUrl || '').trim(),
    channel: String(payload.channel || '').trim(),
    estado: 'draft',
    createdAt: now.toISOString(),
    canales: Array.isArray(payload.canales) ? payload.canales : []
  };
};

const getCampaigns = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = userIdOf(req);
  const campaigns = readCampaigns();
  const data = campaigns.filter((item) => item.ownerId === userId);
  return res.json({ success: true, data });
};

const getCampaignById = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = userIdOf(req);
  const campaigns = readCampaigns();
  const item = campaigns.find((campaign) => campaign.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  if (item.ownerId !== userId) return res.status(403).json({ success: false, message: 'No autorizado' });
  return res.json({ success: true, data: item });
};

const createCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = userIdOf(req);
  const campaign = buildCampaign(req.body || {}, userId);
  if (campaign.presupuesto <= 0) {
    return res.status(400).json({ success: false, message: 'Presupuesto inválido' });
  }
  const campaigns = readCampaigns();
  campaigns.push(campaign);
  saveCampaigns(campaigns);
  return res.status(201).json({ success: true, data: campaign });
};

const updateCampaignStatus = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = userIdOf(req);
  const nextStatus = String(req.body?.status || '').trim().toLowerCase();
  const campaigns = readCampaigns();
  const index = campaigns.findIndex((campaign) => campaign.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  if (campaigns[index].ownerId !== userId) return res.status(403).json({ success: false, message: 'No autorizado' });
  const currentStatus = String(campaigns[index].estado || 'draft').toLowerCase();
  if (!TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    return res.status(400).json({ success: false, message: 'Transición de estado inválida' });
  }
  campaigns[index].estado = nextStatus;
  campaigns[index].updatedAt = new Date().toISOString();
  saveCampaigns(campaigns);
  return res.json({ success: true, data: campaigns[index] });
};

const payCampaign = async (req, res) => {
  req.body = { ...(req.body || {}), status: 'paid' };
  return updateCampaignStatus(req, res);
};

const confirmCampaign = async (req, res) => {
  req.body = { ...(req.body || {}), status: 'published' };
  return updateCampaignStatus(req, res);
};

const completeCampaign = async (req, res) => {
  req.body = { ...(req.body || {}), status: 'completed' };
  return updateCampaignStatus(req, res);
};

const optimize = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const budget = normalizeBudget(req.body?.presupuesto || req.body?.budget || req.body?.price);
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
  return res.json({ success: true, data: { presupuesto: budget, recomendados: orderedChannels } });
};

const launchAutoCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = userIdOf(req);
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
    estado: 'published',
    createdAt: new Date().toISOString(),
    canales: optimizedChannels.map((channel) => channel.id)
  };
  const campaigns = readCampaigns();
  campaigns.push(newCampaign);
  saveCampaigns(campaigns);
  return res.status(201).json({ success: true, data: { campaign: newCampaign, canalesSeleccionados: optimizedChannels } });
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaignStatus,
  payCampaign,
  confirmCampaign,
  completeCampaign,
  optimize,
  launchAutoCampaign
};
