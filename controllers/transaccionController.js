const crypto = require('crypto');
const { readCollection, writeCollection } = require('../services/persistentStore');

const TX_COLLECTION = 'transactions';
const EVENT_COLLECTION = 'stripe_events';

const normalizeAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const readTx = () => readCollection(TX_COLLECTION, []);
const saveTx = (items) => writeCollection(TX_COLLECTION, items);
const readEvents = () => readCollection(EVENT_COLLECTION, []);
const saveEvents = (items) => writeCollection(EVENT_COLLECTION, items);

const listTransacciones = async (req, res) => {
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
  const transactions = readTx();
  const data = transactions.filter((tx) => tx.userId === userId);
  return res.json({ success: true, data });
};

const crearTransaccion = async (req, res) => {
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
  const monto = normalizeAmount(req.body?.monto || req.body?.amount);

  if (monto <= 0) {
    return res.status(400).json({ success: false, message: 'Monto invÃ¡lido' });
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
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);
  saveTx(transactions);
  return res.status(201).json({ success: true, data: transaction });
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

  events.push({
    eventId,
    eventType,
    receivedAt: new Date().toISOString()
  });
  saveEvents(events);

  return res.status(202).json({ success: true, duplicate: false, eventId, event: eventType });
};

module.exports = {
  listTransacciones,
  crearTransaccion,
  stripeWebhook
};
