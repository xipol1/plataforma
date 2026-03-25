const express = require('express');
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
    body('titulo').isLength({ min: 3, max: 100 }).withMessage('Título inválido'),
    body('descripcion').isLength({ min: 10, max: 1000 }).withMessage('Descripción inválida'),
    body('presupuesto').isFloat({ gt: 0 }).withMessage('Presupuesto inválido')
  ],
  validarCampos,
  anuncioController.createAnuncio
);

router.get('/:id', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, anuncioController.getAnuncioById);
router.put('/:id', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, anuncioController.updateAnuncio);
router.delete('/:id', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, anuncioController.deleteAnuncio);

module.exports = router;
