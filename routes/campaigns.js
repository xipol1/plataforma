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
  [param('id').isString().notEmpty().withMessage('ID inválido')],
  validarCampos,
  campaignController.getCampaignById
);

router.post(
  '/',
  autenticar,
  [
    body('titulo').optional().isString().trim(),
    body('descripcion').optional().isString().trim(),
    body('targetUrl').optional().isString().trim(),
    body('channel').optional().isString().trim(),
    body('presupuesto').optional().isFloat({ gt: 0 }).toFloat(),
    body('price').optional().isFloat({ gt: 0 }).toFloat(),
    body('budget').optional().isFloat({ gt: 0 }).toFloat()
  ],
  validarCampos,
  campaignController.createCampaign
);

router.patch(
  '/:id/status',
  autenticar,
  [
    param('id').isString().notEmpty().withMessage('ID inválido'),
    body('status').isIn(allowedStatus).withMessage('status inválido')
  ],
  validarCampos,
  campaignController.updateCampaignStatus
);

// Action-based state transitions
router.post(
  '/:id/pay',
  autenticar,
  [param('id').isString().notEmpty().withMessage('ID inválido')],
  validarCampos,
  campaignController.payCampaign
);

router.post(
  '/:id/confirm',
  autenticar,
  [param('id').isString().notEmpty().withMessage('ID inválido')],
  validarCampos,
  campaignController.confirmCampaign
);

router.post(
  '/:id/complete',
  autenticar,
  [param('id').isString().notEmpty().withMessage('ID inválido')],
  validarCampos,
  campaignController.completeCampaign
);

module.exports = router;
