const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const transaccionController = require('../controllers/transaccionController');
const { autenticar, autorizarRoles } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');
const { limitadorAPI, limitadorGeneral } = require('../middleware/rateLimiter');

router.post('/webhook', transaccionController.stripeWebhook);

router.use(limitadorAPI);
router.use(autenticar);

router.get('/', transaccionController.listTransacciones);

router.post(
  '/',
  limitadorGeneral,
  autorizarRoles('advertiser', 'admin'),
  [
    body('monto').isFloat({ gt: 0 }).withMessage('Monto inválido'),
    body('moneda').optional().isLength({ min: 3, max: 3 }).withMessage('Moneda inválida')
  ],
  validarCampos,
  transaccionController.crearTransaccion
);

module.exports = router;
