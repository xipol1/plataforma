const express = require('express');
const { body, param } = require('express-validator');
const fileController = require('../controllers/fileController');
const { autenticar } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');

const router = express.Router();

router.use(autenticar);

router.get('/', fileController.listFiles);

router.post(
  '/',
  [
    body('nombre').isLength({ min: 1, max: 140 }).withMessage('Nombre inválido'),
    body('tipo').optional().isLength({ min: 3, max: 80 }).withMessage('Tipo inválido'),
    body('contenido').optional().isLength({ max: 20000 }).withMessage('Contenido demasiado grande')
  ],
  validarCampos,
  fileController.createFile
);

router.get('/:id', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, fileController.getFile);
router.delete('/:id', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, fileController.deleteFile);

module.exports = router;
