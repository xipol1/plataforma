const { readCollection, writeCollection } = require('../services/persistentStore');

const COLLECTION = 'files';

const readFiles = () => readCollection(COLLECTION, []);
const saveFiles = (items) => writeCollection(COLLECTION, items);
const userIdOf = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;
const roleOf = (req) => req.usuario?.rol || req.usuario?.role;

const listFiles = async (req, res) => {
  const userId = userIdOf(req);
  const role = roleOf(req);
  const items = readFiles();
  const data = role === 'admin' ? items : items.filter((item) => item.userId === userId);
  return res.json({ success: true, data });
};

const createFile = async (req, res) => {
  const userId = userIdOf(req);

  const item = {
    id: `file-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    userId,
    nombre: String(req.body?.nombre || '').trim(),
    tipo: String(req.body?.tipo || 'text/plain').trim(),
    contenido: String(req.body?.contenido || '').trim(),
    createdAt: new Date().toISOString()
  };

  const items = readFiles();
  items.push(item);
  saveFiles(items);

  return res.status(201).json({ success: true, data: item });
};

const getFile = async (req, res) => {
  const userId = userIdOf(req);
  const role = roleOf(req);
  const items = readFiles();
  const item = items.find((file) => file.id === req.params.id);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
  }

  if (role !== 'admin' && item.userId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para ver este archivo' });
  }

  return res.json({ success: true, data: item });
};

const deleteFile = async (req, res) => {
  const userId = userIdOf(req);
  const role = roleOf(req);
  const items = readFiles();
  const index = items.findIndex((file) => file.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
  }

  if (role !== 'admin' && items[index].userId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este archivo' });
  }

  const [removed] = items.splice(index, 1);
  saveFiles(items);
  return res.json({ success: true, data: removed });
};

module.exports = {
  listFiles,
  createFile,
  getFile,
  deleteFile
};
