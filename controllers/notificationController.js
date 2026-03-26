const { readCollection, writeCollection } = require('../services/persistentStore');

const COLLECTION = 'notifications';

const readNotifications = () => readCollection(COLLECTION, []);
const saveNotifications = (items) => writeCollection(COLLECTION, items);
const userIdOf = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;

const listNotifications = async (req, res) => {
  const userId = userIdOf(req);
  const data = readNotifications().filter((item) => item.userId === userId);
  return res.json({ success: true, data });
};

const createNotification = async (req, res) => {
  const userId = userIdOf(req);
  const item = {
    id: `ntf-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    titulo: String(req.body?.titulo || '').trim(),
    mensaje: String(req.body?.mensaje || '').trim(),
    leida: false,
    createdAt: new Date().toISOString()
  };

  const all = readNotifications();
  all.push(item);
  saveNotifications(all);
  return res.status(201).json({ success: true, data: item });
};

const markAsRead = async (req, res) => {
  const userId = userIdOf(req);
  const all = readNotifications();
  const index = all.findIndex((item) => item.id === req.params.id && item.userId === userId);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'NotificaciÃ³n no encontrada' });
  }

  all[index] = { ...all[index], leida: true, readAt: new Date().toISOString() };
  saveNotifications(all);

  return res.json({ success: true, data: all[index] });
};

module.exports = {
  listNotifications,
  createNotification,
  markAsRead
};
