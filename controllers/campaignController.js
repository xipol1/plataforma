const crypto = require('crypto');
const { readCollection, writeCollection } = require('../services/persistentStore');

const demoChannels = [
  { id: 'demo-ch-crypto-alpha-signals', nombre: 'Crypto Alpha Signals', plataforma: 'telegram', engagement: 2.9, ctr: 3.2, precio: 450 },
  { id: 'demo-ch-gaming-deals-hub', nombre: 'Gaming Deals Hub', plataforma: 'discord', engagement: 4.1, ctr: 3.9, precio: 650 },
  { id: 'demo-ch-ai-insider-pro', nombre: 'AI Insider Pro', plataforma: 'telegram', engagement: 3.2, ctr: 3.4, precio: 1200 },
  { id: 'demo-ch-startup-weekly', nombre: 'Startup Weekly', plataforma: 'newsletter', engagement: 3.6, ctr: 2.7, precio: 220 }
];

const COLLECTION = 'campaigns';
const MAX_RECENT_EVENTS = 200;

const normalizeBudget = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const readCampaigns = () => readCollection(COLLECTION, []);
const saveCampaigns = (items) => writeCollection(COLLECTION, items);

const normalizeTracking = (tracking = {}) => ({
  totalClicks: Number(tracking.totalClicks ?? tracking.clicks ?? 0) || 0,
  uniqueVisitors: Number(tracking.uniqueVisitors ?? 0) || 0,
  uniqueVisitorHashes: Array.isArray(tracking.uniqueVisitorHashes) ? tracking.uniqueVisitorHashes : [],
  lastClickAt: tracking.lastClickAt || null,
  byDay: tracking.byDay && typeof tracking.byDay === 'object' ? tracking.byDay : {},
  byReferrer: tracking.byReferrer && typeof tracking.byReferrer === 'object' ? tracking.byReferrer : {},
  byDevice: tracking.byDevice && typeof tracking.byDevice === 'object' ? tracking.byDevice : {},
  byCountry: tracking.byCountry && typeof tracking.byCountry === 'object' ? tracking.byCountry : {},
  byUtmSource: tracking.byUtmSource && typeof tracking.byUtmSource === 'object' ? tracking.byUtmSource : {},
  byUtmMedium: tracking.byUtmMedium && typeof tracking.byUtmMedium === 'object' ? tracking.byUtmMedium : {},
  byUtmCampaign: tracking.byUtmCampaign && typeof tracking.byUtmCampaign === 'object' ? tracking.byUtmCampaign : {},
  recentEvents: Array.isArray(tracking.recentEvents) ? tracking.recentEvents : []
});

const buildCampaign = (payload, userId) => {
  const now = new Date();
  return {
    id: `cmp-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
    ownerId: userId,
    titulo: String(payload.titulo || 'Campaña sin título').trim(),
    descripcion: String(payload.descripcion || '').trim(),
    presupuesto: normalizeBudget(payload.presupuesto),
    estado: 'DRAFT',
    createdAt: now.toISOString(),
    canales: Array.isArray(payload.canales) ? payload.canales : [],
    tracking: normalizeTracking()
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

const getUserId = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;
const getRole = (req) => req.usuario?.rol || req.usuario?.role;

const getCampaigns = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = getUserId(req);
  const campaigns = readCampaigns();
  const data = campaigns.filter((item) => item.ownerId === userId || getRole(req) === 'admin');
  res.json({ success: true, data });
};

const getCampaignById = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = getUserId(req);
  const role = getRole(req);
  const campaign = readCampaigns().find((item) => item.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  }

  if (role !== 'admin' && campaign.ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes acceso a esta campaña' });
  }

  return res.json({ success: true, data: campaign });
};

const getCampaignTracking = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = getUserId(req);
  const role = getRole(req);
  const campaigns = readCampaigns();
  const campaign = campaigns.find((item) => item.id === req.params.id);

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  }

  if (role !== 'admin' && campaign.ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes acceso a esta campaña' });
  }

  return res.json({
    success: true,
    data: {
      campaignId: campaign.id,
      estado: campaign.estado,
      tracking: normalizeTracking(campaign.tracking)
    }
  });
};

const createCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;
  const userId = getUserId(req);

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

const publishCampaign = async (req, res) => {
  if (!ensureAdvertiser(req, res)) return;

  const campaigns = readCampaigns();
  const index = campaigns.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  }

  const userId = getUserId(req);
  const role = getRole(req);
  if (role !== 'admin' && campaigns[index].ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para publicar esta campaña' });
  }

  if (campaigns[index].estado !== 'SUBMITTED') {
    return res.status(409).json({ success: false, message: 'La campaña debe estar en estado SUBMITTED para publicar' });
  }

  campaigns[index] = {
    ...campaigns[index],
    estado: 'PUBLISHED',
    publishedAt: new Date().toISOString(),
    tracking: normalizeTracking(campaigns[index].tracking)
  };
  saveCampaigns(campaigns);

  return res.json({ success: true, data: campaigns[index] });
};

const parseDevice = (ua = '') => {
  const v = ua.toLowerCase();
  if (!v) return 'unknown';
  if (v.includes('bot') || v.includes('spider') || v.includes('crawler')) return 'bot';
  if (v.includes('mobile') || v.includes('android') || v.includes('iphone')) return 'mobile';
  return 'desktop';
};

const normalizeReferrer = (value = '') => {
  if (!value) return 'direct';
  try {
    const parsed = new URL(value);
    return parsed.hostname || 'direct';
  } catch {
    return 'direct';
  }
};

const incrementCounter = (obj, key) => {
  const safeKey = key || 'unknown';
  const current = Number(obj[safeKey] || 0);
  obj[safeKey] = current + 1;
};

const trackClick = async (req, res) => {
  const campaigns = readCampaigns();
  const index = campaigns.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  }

  if (campaigns[index].estado !== 'PUBLISHED') {
    return res.status(409).json({ success: false, message: 'Campaña no publicada' });
  }

  const tracking = normalizeTracking(campaigns[index].tracking);
  const now = new Date();

  const ua = String(req.headers['user-agent'] || '');
  const ip = String(
    req.headers['x-forwarded-for'] ||
    req.headers['cf-connecting-ip'] ||
    req.socket?.remoteAddress ||
    ''
  );
  const referrer = String(req.headers.referer || req.headers.referrer || '');
  const country = String(req.headers['cf-ipcountry'] || req.headers['x-vercel-ip-country'] || 'unknown').toUpperCase();

  const utmSource = String(req.query?.utm_source || 'none');
  const utmMedium = String(req.query?.utm_medium || 'none');
  const utmCampaign = String(req.query?.utm_campaign || 'none');

  const visitorHash = crypto.createHash('sha1').update(`${ip}|${ua}`).digest('hex');
  const isUnique = !tracking.uniqueVisitorHashes.includes(visitorHash);

  tracking.totalClicks += 1;
  tracking.lastClickAt = now.toISOString();
  incrementCounter(tracking.byDay, now.toISOString().slice(0, 10));
  incrementCounter(tracking.byReferrer, normalizeReferrer(referrer));
  incrementCounter(tracking.byDevice, parseDevice(ua));
  incrementCounter(tracking.byCountry, country || 'unknown');
  incrementCounter(tracking.byUtmSource, utmSource);
  incrementCounter(tracking.byUtmMedium, utmMedium);
  incrementCounter(tracking.byUtmCampaign, utmCampaign);

  if (isUnique) {
    tracking.uniqueVisitorHashes.push(visitorHash);
    tracking.uniqueVisitors += 1;
  }

  const event = {
    id: `clk-${now.getTime()}-${Math.floor(Math.random() * 10000)}`,
    at: now.toISOString(),
    ip,
    ua,
    referrer: normalizeReferrer(referrer),
    country: country || 'UNKNOWN',
    device: parseDevice(ua),
    utm: {
      source: utmSource,
      medium: utmMedium,
      campaign: utmCampaign
    },
    unique: isUnique
  };

  tracking.recentEvents = [...tracking.recentEvents, event].slice(-MAX_RECENT_EVENTS);

  campaigns[index] = {
    ...campaigns[index],
    tracking
  };

  saveCampaigns(campaigns);

  const destination = req.query?.destino ? String(req.query.destino) : '';
  if (destination.startsWith('http://') || destination.startsWith('https://')) {
    return res.redirect(destination);
  }

  return res.json({
    success: true,
    data: {
      campaignId: campaigns[index].id,
      totalClicks: tracking.totalClicks,
      uniqueVisitors: tracking.uniqueVisitors,
      lastClickAt: tracking.lastClickAt,
      estado: campaigns[index].estado
    }
  });
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
  const userId = getUserId(req);

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
    estado: 'PUBLISHED',
    createdAt: new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    canales: optimizedChannels.map((channel) => channel.id),
    tracking: normalizeTracking()
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
  getCampaignById,
  getCampaignTracking,
  createCampaign,
  publishCampaign,
  trackClick,
  optimize,
  launchAutoCampaign
};
