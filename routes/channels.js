const express = require('express');
const { body, query } = require('express-validator');
const { autenticar } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');
const channelsController = require('../controllers/channelsController');

const router = express.Router();

router.get(
  '/',
  [
    query('pagina').optional().isInt({ min: 1 }).toInt(),
    query('limite').optional().isInt({ min: 1, max: 60 }).toInt(),
    query('plataforma').optional().isString().trim(),
    query('categoria').optional().isString().trim()
  ],
  validarCampos,
  channelsController.listChannels
);

router.get('/mine', autenticar, channelsController.getMyChannels);

router.post(
  '/',
  autenticar,
  [
    body('plataforma').isString().notEmpty().trim(),
    body('identificadorCanal').isString().notEmpty().trim(),
    body('nombreCanal').optional().isString().trim(),
    body('categoria').optional().isString().trim(),
    body('descripcion').optional().isString().trim()
  ],
  validarCampos,
  channelsController.createChannel
);

module.exports = router;
