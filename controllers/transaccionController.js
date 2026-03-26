const crypto = require('crypto');
const { readCollection, writeCollection } = require('../services/persistentStore');

const TX_COLLECTION = 'transactions';
const EVENT_COLLECTION = 'stripe_events';
const CAMPAIGN_COLLECTION = 'campaigns';

const normalizeAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const readTx = () => readCollection(TX_COLLECTION, []);
const saveTx = (items) => writeCollection(TX_COLLECTION, items);
const readEvents = () => readCollection(EVENT_COLLECTION, []);
const saveEvents = (items) => writeCollection(EVENT_COLLECTION, items);
const readCampaigns = () => readCollection(CAMPAIGN_COLLECTION, []);
const saveCampaigns = (items) => writeCollection(CAMPAIGN_COLLECTION, items);

const userIdOf = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;

const listTransacciones = async (req, res) => {
  const userId = userIdOf(req);
  const transactions = readTx();
  const data = transactions.filter((tx) => tx.userId === userId);
  return res.json({ success: true, data });
};

const crearTransaccion = async (req, res) => {
  const userId = userIdOf(req);
  const monto = normalizeAmount(req.body?.monto || req.body?.amount);

  if (monto <= 0) {
    return res.status(400).json({ success: false, message: 'Monto inválido' });
  }

  const referencia = String(req.body?.referencia || '').trim();
  const transactions = readTx();

  if (referencia) {
    const existing = transactions.find((tx) => tx.userId === userId && tx.referencia === referencia);
    if (existing) {
      return res.status(200).json({ success: true, data: existing, duplicate: true });
    }
  }

  const transaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    monto,
    moneda: String(req.body?.moneda || 'EUR').toUpperCase(),
    estado: 'pending',
    referencia,
    campaignId: req.body?.campaignId || null,
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);
  saveTx(transactions);
  return res.status(201).json({ success: true, data: transaction });
};

const crearCheckoutStripe = async (req, res) => {
  const userId = userIdOf(req);
  const campaignId = String(req.body?.campaignId || '').trim();

  if (!campaignId) {
    return res.status(400).json({ success: false, message: 'campaignId es requerido' });
  }

  const campaigns = readCampaigns();
  const campaign = campaigns.find((item) => item.id === campaignId);

  if (!campaign) {
    return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
  }

  if (campaign.ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No puedes pagar una campaña que no es tuya' });
  }

  if (campaign.estado !== 'DRAFT') {
    return res.status(409).json({ success: false, message: 'Solo campañas en DRAFT pueden iniciar pago' });
  }

  const paymentIntentId = `pi_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const tx = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    campaignId,
    monto: Number(campaign.presupuesto) || 0,
    moneda: 'EUR',
    estado: 'pending',
    provider: 'stripe',
    paymentIntentId,
    checkoutUrl: `https://checkout.stripe.com/pay/${paymentIntentId}`,
    createdAt: new Date().toISOString()
  };

  const transactions = readTx();
  transactions.push(tx);
  saveTx(transactions);

  return res.status(201).json({ success: true, data: tx });
};

const stripeWebhook = async (req, res) => {
  const eventType = req.body?.type || 'unknown';
  const providedEventId = req.body?.id;
  const eventId = providedEventId || crypto.createHash('sha1').update(JSON.stringify(req.body || {})).digest('hex');

  const events = readEvents();
  const existing = events.find((event) => event.eventId === eventId);

  if (existing) {
    return res.status(200).json({ success: true, duplicate: true, eventId, message: 'Evento ya procesado' });
  }

  events.push({ eventId, eventType, receivedAt: new Date().toISOString() });
  saveEvents(events);

  if (eventType === 'payment_intent.succeeded') {
    const paymentIntentId = req.body?.data?.object?.id;
    if (paymentIntentId) {
      const transactions = readTx();
      const txIndex = transactions.findIndex((tx) => tx.paymentIntentId === paymentIntentId || tx.id === paymentIntentId);
      if (txIndex >= 0) {
        transactions[txIndex] = {
          ...transactions[txIndex],
          estado: 'paid',
          paidAt: new Date().toISOString()
        };
        saveTx(transactions);

        const campaignId = transactions[txIndex].campaignId;
        if (campaignId) {
          const campaigns = readCampaigns();
          const campaignIndex = campaigns.findIndex((campaign) => campaign.id === campaignId);
          if (campaignIndex >= 0 && campaigns[campaignIndex].estado === 'DRAFT') {
            campaigns[campaignIndex] = {
              ...campaigns[campaignIndex],
              estado: 'SUBMITTED',
              submittedAt: new Date().toISOString()
            };
            saveCampaigns(campaigns);
          }
        }
      }
    }
  }

  return res.status(202).json({ success: true, duplicate: false, eventId, event: eventType });
};

module.exports = {
  listTransacciones,
  crearTransaccion,
  crearCheckoutStripe,
  stripeWebhook
};
