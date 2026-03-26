﻿const { readCollection, writeCollection } = require('../services/persistentStore');

const COLLECTION = 'ads';

const readAds = () => readCollection(COLLECTION, []);
const saveAds = (items) => writeCollection(COLLECTION, items);

const roleOf = (req) => req.usuario?.rol || req.usuario?.role;
const userIdOf = (req) => req.usuario?.id || req.usuario?._id || req.usuario?.sub;

const listAnuncios = async (req, res) => {
  const role = roleOf(req);
  const userId = userIdOf(req);
  const ads = readAds();
  const data = role === 'admin' ? ads : ads.filter((ad) => ad.ownerId === userId);
  return res.json({ success: true, data });
};

const createAnuncio = async (req, res) => {
  const ownerId = userIdOf(req);
  const { titulo, descripcion, presupuesto } = req.body || {};

  const ad = {
    id: `ad-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    ownerId,
    titulo: String(titulo || '').trim(),
    descripcion: String(descripcion || '').trim(),
    presupuesto: Number(presupuesto),
    estado: 'draft',
    createdAt: new Date().toISOString()
  };

  const ads = readAds();
  ads.push(ad);
  saveAds(ads);

  return res.status(201).json({ success: true, data: ad });
};

const getAnuncioById = async (req, res) => {
  const role = roleOf(req);
  const userId = userIdOf(req);
  const ads = readAds();
  const ad = ads.find((item) => item.id === req.params.id);

  if (!ad) {
    return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
  }

  if (role !== 'admin' && ad.ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para ver este anuncio' });
  }

  return res.json({ success: true, data: ad });
};

const updateAnuncio = async (req, res) => {
  const role = roleOf(req);
  const userId = userIdOf(req);
  const ads = readAds();
  const index = ads.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
  }

  if (role !== 'admin' && ads[index].ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para editar este anuncio' });
  }

  const payload = req.body || {};
  ads[index] = {
    ...ads[index],
    ...('titulo' in payload ? { titulo: String(payload.titulo).trim() } : {}),
    ...('descripcion' in payload ? { descripcion: String(payload.descripcion).trim() } : {}),
    ...('presupuesto' in payload ? { presupuesto: Number(payload.presupuesto) } : {}),
    updatedAt: new Date().toISOString()
  };

  saveAds(ads);
  return res.json({ success: true, data: ads[index] });
};

const deleteAnuncio = async (req, res) => {
  const role = roleOf(req);
  const userId = userIdOf(req);
  const ads = readAds();
  const index = ads.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Anuncio no encontrado' });
  }

  if (role !== 'admin' && ads[index].ownerId !== userId) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar este anuncio' });
  }

  const [deleted] = ads.splice(index, 1);
  saveAds(ads);

  return res.json({ success: true, data: deleted });
};

module.exports = {
  listAnuncios,
  createAnuncio,
  getAnuncioById,
  updateAnuncio,
  deleteAnuncio
};
