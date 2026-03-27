const Anuncio = require('../../models/Anuncio');
const ApiLog = require('../../models/ApiLog');

/**
 * Servicio para gestionar integraciones de partners
 */
class IntegrationsService {
  /**
   * Obtener todas las campañas (anuncios) asignadas a un partner
   * @param {string} partnerId - ID del partner autenticado
   */
  async getCampaigns(partnerId) {
    try {
      const campaigns = await Anuncio.find({ partner_id: partnerId })
        .populate('canal', 'nombre plataforma'); // Adaptamos 'channel' a la estructura actual

      return campaigns.map(camp => ({
        id: camp._id,
        status: camp.estado, // pending, paid, published, completed
        content: camp.contenido.texto,
        target_url: camp.contenido.enlaces && camp.contenido.enlaces.length > 0 ? camp.contenido.enlaces[0].url : undefined,
        channel: camp.canal ? {
          id: camp.canal._id,
          name: camp.canal.nombre,
          platform: camp.canal.plataforma
        } : null,
        scheduled_at: camp.programacion ? camp.programacion.fechaPublicacion : undefined
      }));
    } catch (error) {
      console.error('Error al obtener campañas:', error);
      throw error;
    }
  }

  /**
   * Obtener detalle de una campaña específica
   * @param {string} campaignId - ID de la campaña
   * @param {string} partnerId - ID del partner (para validación)
   */
  async getCampaignDetail(campaignId, partnerId) {
    try {
      const campaign = await Anuncio.findOne({ _id: campaignId, partner_id: partnerId })
        .populate('canal', 'nombre plataforma');

      if (!campaign) {
        throw new Error('Campaña no encontrada o no pertenece al partner');
      }

      return {
        id: campaign._id,
        status: campaign.estado,
        content: campaign.contenido.texto,
        target_url: campaign.contenido.enlaces && campaign.contenido.enlaces.length > 0 ? campaign.contenido.enlaces[0].url : undefined,
        channel: campaign.canal ? {
          id: campaign.canal._id,
          name: campaign.canal.nombre,
          platform: campaign.canal.plataforma
        } : null,
        scheduled_at: campaign.programacion ? campaign.programacion.fechaPublicacion : undefined
      };
    } catch (error) {
      console.error('Error al obtener detalle de campaña:', error);
      throw error;
    }
  }

  /**
   * Confirmar la publicación de una campaña
   * @param {string} campaignId - ID de la campaña
   * @param {string} partnerId - ID del partner
   * @param {Object} data - Datos de publicación (published_at, external_reference)
   */
  async confirmPublication(campaignId, partnerId, data) {
    try {
      const campaign = await Anuncio.findOne({ _id: campaignId, partner_id: partnerId });

      if (!campaign) {
        throw new Error('Campaña no encontrada o no pertenece al partner');
      }

      // Validar transición de estado (SOLO permitir si es 'aprobado' o 'programado' o 'pagado'?)
      // El usuario dice: paid → published → completed. En nuestro modelo actual es: 'aprobado' -> 'publicado'
      // Adaptamos al flujo solicitado: 'paid' (estado pago completado) -> 'published'
      
      campaign.estado = 'publicado';
      campaign.publicacion = {
        ...campaign.publicacion,
        fechaPublicacion: data.published_at || new Date(),
        idPublicacion: data.external_reference || campaign.publicacion.idPublicacion
      };

      // Registrar evento
      campaign.historial.push({
        fecha: new Date(),
        accion: 'Confirmación de publicación externa (Partner API)',
        detalles: data
      });

      await campaign.save();
      return campaign;
    } catch (error) {
      console.error('Error al confirmar publicación:', error);
      throw error;
    }
  }

  /**
   * Registrar un evento genérico para una campaña
   * @param {string} partnerId - ID del partner
   * @param {Object} eventData - Datos del evento (campaign_id, type, payload)
   */
  async recordEvent(partnerId, eventData) {
    try {
      const { campaign_id, type, payload } = eventData;
      
      const campaign = await Anuncio.findOne({ _id: campaign_id, partner_id: partnerId });

      if (!campaign) {
        throw new Error('Campaña no encontrada o no pertenece al partner');
      }

      // Actualizar métricas si el evento es de clics
      if (type === 'click_update' && payload && payload.total_clicks) {
        campaign.metricas.clics = payload.total_clicks;
        campaign.metricas.ultimaActualizacion = new Date();
      }

      // Registrar en el historial de la campaña
      campaign.historial.push({
        fecha: new Date(),
        accion: `Evento Partner: ${type}`,
        detalles: payload
      });

      await campaign.save();
      return { success: true };
    } catch (error) {
      console.error('Error al registrar evento:', error);
      throw error;
    }
  }
}

module.exports = new IntegrationsService();
