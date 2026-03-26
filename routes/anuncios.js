﻿const express = require('express');
const { body, param } = require('express-validator');
const anuncioController = require('../controllers/anuncioController');
const { autenticar, autorizarRoles } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');

const router = express.Router();

router.use(autenticar);
router.use(autorizarRoles('advertiser', 'admin'));

router.get('/', anuncioController.listAnuncios);

router.post(
  '/',
  [
    body('titulo').isLength({ min: 3, max: 100 }).withMessage('TÃ­tulo invÃ¡lido'),
    body('descripcion').isLength({ min: 10, max: 1000 }).withMessage('DescripciÃ³n invÃ¡lida'),
    body('presupuesto').isFloat({ gt: 0 }).withMessage('Presupuesto invÃ¡lido')
  ],
  validarCampos,
  anuncioController.createAnuncio
);

router.get('/:id', [param('id').isString().notEmpty().withMessage('ID invÃ¡lido')], validarCampos, anuncioController.getAnuncioById);
router.put('/:id', [param('id').isString().notEmpty().withMessage('ID invÃ¡lido')], validarCampos, anuncioController.updateAnuncio);
router.delete('/:id', [param('id').isString().notEmpty().withMessage('ID invÃ¡lido')], validarCampos, anuncioController.deleteAnuncio);

module.exports = router;
