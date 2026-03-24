const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
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

/**
 * @swagger
 * /campaigns:
 *   get:
 *     summary: Obtener campañas asignadas al partner
 *     description: Devuelve una lista paginada de campañas asignadas al partner autenticado.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Cantidad de resultados por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtrar por estado de la campaña (ej. pending, activo, completado)
 *     responses:
 *       200:
 *         description: Lista de campañas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "64f8a9b2c123"
 *                       status:
 *                         type: string
 *                         example: "pending"
 *                       content:
 *                         type: string
 *                         example: "Contenido de la campaña"
 *                       target_url:
 *                         type: string
 *                         example: "https://example.com"
 *                       channel:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "64f8a9b2c124"
 *                           name:
 *                             type: string
 *                             example: "Canal Tech"
 *                           platform:
 *                             type: string
 *                             example: "telegram"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 120
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total_pages:
 *                       type: integer
 *                       example: 6
 *       401:
 *         description: No autorizado (Falta API Key o es inválida)
 */
// 3.1 Obtener campañas
router.get('/campaigns', 
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('status').optional().isString().trim()
  ],
  (req, res) => IntegrationsController.getCampaigns(req, res)
);

/**
 * @swagger
 * /campaigns/{id}:
 *   get:
 *     summary: Obtener detalle de una campaña específica
 *     description: Devuelve los detalles de una campaña si pertenece al partner.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la campaña
 *     responses:
 *       200:
 *         description: Detalle de la campaña
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f8a9b2c123"
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     content:
 *                       type: string
 *                       example: "Contenido de la campaña"
 *       404:
 *         description: Campaña no encontrada o no pertenece al partner
 */
// 3.2 Obtener detalle de campaña
router.get('/campaigns/:id', 
  validateId,
  (req, res) => IntegrationsController.getCampaignDetail(req, res)
);

/**
 * @swagger
 * /campaigns/{id}/publish:
 *   post:
 *     summary: Confirmar la publicación de una campaña
 *     description: Marca una campaña como publicada y guarda el timestamp.
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la campaña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - published_at
 *             properties:
 *               published_at:
 *                 type: string
 *                 format: date-time
 *                 description: Fecha y hora de publicación (ISO 8601)
 *                 example: "2026-03-23T18:00:00Z"
 *               external_reference:
 *                 type: string
 *                 description: ID de referencia externo (opcional)
 *                 example: "EXT-98765"
 *     responses:
 *       200:
 *         description: Campaña marcada como publicada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Campaña marcada como publicada"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f8a9b2c123"
 *                     status:
 *                       type: string
 *                       example: "publicado"
 *       400:
 *         description: Datos de entrada inválidos
 *       404:
 *         description: Campaña no encontrada
 */
// 3.3 Confirmar publicación
router.post('/campaigns/:id/publish', 
  [
    ...validateId,
    body('published_at').isISO8601().withMessage('Fecha published_at inválida (ISO8601 requerida)'),
    body('external_reference').optional().isString().trim().escape()
  ],
  (req, res) => IntegrationsController.confirmPublish(req, res)
);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Enviar eventos asociados a una campaña
 *     description: Permite registrar eventos como clics o actualizaciones de estado de una campaña.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - campaign_id
 *               - type
 *             properties:
 *               campaign_id:
 *                 type: string
 *                 description: ID de la campaña
 *                 example: "64f8a9b2c123"
 *               type:
 *                 type: string
 *                 enum: [published, click_update, other]
 *                 description: Tipo de evento
 *                 example: "click_update"
 *               payload:
 *                 type: object
 *                 description: Datos adicionales del evento
 *                 example: { "total_clicks": 120 }
 *     responses:
 *       200:
 *         description: Evento registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Evento registrado correctamente"
 *       400:
 *         description: Datos de entrada inválidos
 */
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
