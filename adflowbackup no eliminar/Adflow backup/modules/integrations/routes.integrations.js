const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const IntegrationsController = require('./controller.integrations');
const { authPartner, logIntegrationRequest, partnerRateLimiter } = require('./middleware.authPartner');

/**
 * Rutas de Integración Externa (AdFlow v1)
 * Base URL: /api/v1/integrations
 */

// Aplicar middleware de autenticación, logging y rate limiting a todas las rutas de integración
router.use(authPartner);
router.use(logIntegrationRequest);
router.use(partnerRateLimiter);

// Validaciones comunes
const validateId = [
  param('id').isMongoId().withMessage('ID de campaña inválido')
];

// 3.1 Obtener campañas
router.get('/campaigns', (req, res) => IntegrationsController.getCampaigns(req, res));

// 3.2 Obtener detalle de campaña
router.get('/campaigns/:id', 
  validateId,
  (req, res) => IntegrationsController.getCampaignDetail(req, res)
);

// 3.3 Confirmar publicación
router.post('/campaigns/:id/publish', 
  [
    ...validateId,
    body('published_at').isISO8601().withMessage('Fecha published_at inválida (ISO8601 requerida)'),
    body('external_reference').optional().isString().trim().escape()
  ],
  (req, res) => IntegrationsController.confirmPublish(req, res)
);

// 3.4 Enviar eventos
router.post('/events', 
  [
    body('campaign_id').isMongoId().withMessage('ID de campaña inválido'),
    body('type').isIn(['published', 'click_update', 'other']).withMessage('Tipo de evento inválido'),
    body('payload').optional().isObject().withMessage('El payload debe ser un objeto')
  ],
  (req, res) => IntegrationsController.sendEvent(req, res)
);

module.exports = router;
