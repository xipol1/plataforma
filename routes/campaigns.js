const express = require('express');
const { body, param } = require('express-validator');
const { autenticar } = require('../middleware/auth');
const { validarCampos } = require('../middleware/validarCampos');
const campaignController = require('../controllers/campaignController');

const router = express.Router();

const allowedStatus = ['DRAFT', 'PAID', 'PUBLISHED', 'COMPLETED', 'CANCELLED'];

router.get('/', autenticar, campaignController.getCampaigns);

router.get(
  '/:id',
  autenticar,
  [param('id').isMongoId().withMessage('ID inválido')],
  validarCampos,
  campaignController.getCampaignById
);

router.post(
  '/',
  autenticar,
  [
    body('channel').isMongoId().withMessage('channel inválido'),
    body('content').isString().notEmpty().trim(),
    body('targetUrl').isString().notEmpty().trim(),
    body('price').isFloat().toFloat()
  ],
  validarCampos,
  campaignController.createCampaign
);

router.patch(
  '/:id/status',
  autenticar,
  [
    param('id').isMongoId().withMessage('ID inválido'),
    body('status').isIn(allowedStatus).withMessage('status inválido')
  ],
  validarCampos,
  campaignController.updateCampaignStatus
);

module.exports = router;
