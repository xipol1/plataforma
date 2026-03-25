const transactions = [];

const normalizeAmount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const listTransacciones = async (req, res) => {
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
  const data = transactions.filter((tx) => tx.userId === userId);
  return res.json({ success: true, data });
};

const crearTransaccion = async (req, res) => {
  const userId = req.usuario?.id || req.usuario?._id || req.usuario?.sub;
  const monto = normalizeAmount(req.body?.monto || req.body?.amount);

  if (monto <= 0) {
    return res.status(400).json({ success: false, message: 'Monto inválido' });
  }

  const transaction = {
    id: `tx-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    monto,
    moneda: String(req.body?.moneda || 'EUR').toUpperCase(),
    estado: 'pending',
    referencia: String(req.body?.referencia || '').trim(),
    createdAt: new Date().toISOString()
  };

  transactions.push(transaction);
  return res.status(201).json({ success: true, data: transaction });
};

const stripeWebhook = async (req, res) => {
  return res.status(202).json({ success: true, message: 'Webhook recibido (modo MVP)', event: req.body?.type || 'unknown' });
};

module.exports = {
  listTransacciones,
  crearTransaccion,
  stripeWebhook
};
