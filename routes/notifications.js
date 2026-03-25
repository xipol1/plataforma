const express = require('express');
const { body, param } = require('express-validator');
const notificationController = require('../controllers/notificationController');
const { autenticar } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');

const router = express.Router();

router.use(autenticar);

router.get('/', notificationController.listNotifications);

router.post(
  '/',
  [
    body('titulo').isLength({ min: 1, max: 140 }).withMessage('Título inválido'),
    body('mensaje').isLength({ min: 1, max: 1000 }).withMessage('Mensaje inválido')
  ],
  validarCampos,
  notificationController.createNotification
);

router.put('/:id/leer', [param('id').isString().notEmpty().withMessage('ID inválido')], validarCampos, notificationController.markAsRead);

module.exports = router;
