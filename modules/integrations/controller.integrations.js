const IntegrationsService = require('./service.integrations');
const { validationResult } = require('express-validator');

/**
 * Controlador para la API de integraciones (AdFlow v1)
 */
class IntegrationsController {
  /**
   * Helper to handle validation errors
   */
  handleValidationErrors(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    return false;
  }

  /**
   * Obtener todas las campañas del partner
   * GET /api/v1/integrations/campaigns
   */
  async getCampaigns(req, res) {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const partnerId = req.partner._id;
      const { page, limit, status } = req.query;

      const result = await IntegrationsService.getCampaigns(partnerId, { page, limit, status });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Error en IntegrationsController.getCampaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno al obtener campañas'
      });
    }
  }

  /**
   * Obtener detalle de una campaña
   * GET /api/v1/integrations/campaigns/:id
   */
  async getCampaignDetail(req, res) {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const campaignId = req.params.id;
      const partnerId = req.partner._id;
      const campaign = await IntegrationsService.getCampaignDetail(campaignId, partnerId);

      res.status(200).json({
        success: true,
        data: campaign
      });
    } catch (error) {
      console.error('Error en IntegrationsController.getCampaignDetail:', error);
      res.status(error.message.includes('encontrada') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error interno al obtener detalle de campaña'
      });
    }
  }

  /**
   * Confirmar publicación de campaña
   * POST /api/v1/integrations/campaigns/:id/publish
   */
  async confirmPublish(req, res) {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const campaignId = req.params.id;
      const partnerId = req.partner._id;
      const { published_at, external_reference } = req.body;

      const campaign = await IntegrationsService.confirmPublication(campaignId, partnerId, {
        published_at,
        external_reference
      });

      res.status(200).json({
        success: true,
        message: 'Campaña marcada como publicada',
        data: {
          id: campaign._id,
          status: campaign.estado,
          published_at: campaign.publicacion.fechaPublicacion
        }
      });
    } catch (error) {
      console.error('Error en IntegrationsController.confirmPublish:', error);
      res.status(error.message.includes('encontrada') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error interno al confirmar publicación'
      });
    }
  }

  /**
   * Enviar eventos de campaña
   * POST /api/v1/integrations/events
   */
  async sendEvent(req, res) {
    try {
      if (this.handleValidationErrors(req, res)) return;

      const partnerId = req.partner._id;
      const { campaign_id, type, payload } = req.body;

      await IntegrationsService.recordEvent(partnerId, {
        campaign_id,
        type,
        payload: payload || {}
      });

      res.status(200).json({
        success: true,
        message: 'Evento registrado correctamente'
      });
    } catch (error) {
      console.error('Error en IntegrationsController.sendEvent:', error);
      res.status(error.message.includes('encontrada') ? 404 : 500).json({
        success: false,
        message: error.message || 'Error interno al registrar evento'
      });
    }
  }
}

module.exports = new IntegrationsController();
