const axios = require('axios');
require('dotenv').config();

/**
 * Clase para la integración con la API de Telegram
 */
class TelegramAPI {
  constructor(token) {
    this.token = token;
    this.apiUrl = `https://api.telegram.org/bot${token}`;
  }

  /**
   * Obtiene información sobre el bot
   * @returns {Promise<Object>} Información del bot
   */
  async getMe() {
    try {
      const response = await axios.get(`${this.apiUrl}/getMe`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del bot:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene actualizaciones del bot
   * @param {Object} options - Opciones para obtener actualizaciones
   * @returns {Promise<Object>} Actualizaciones recibidas
   */
  async getUpdates(options = {}) {
    try {
      const response = await axios.post(`${this.apiUrl}/getUpdates`, options);
      return response.data;
    } catch (error) {
      console.error('Error al obtener actualizaciones:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje a un chat
   * @param {number|string} chatId - ID del chat
   * @param {string} text - Texto del mensaje
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text,
        ...options
      };
      const response = await axios.post(`${this.apiUrl}/sendMessage`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene información sobre un chat
   * @param {number|string} chatId - ID del chat
   * @returns {Promise<Object>} Información del chat
   */
  async getChat(chatId) {
    try {
      const response = await axios.get(`${this.apiUrl}/getChat`, {
        params: { chat_id: chatId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del chat:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el número de miembros de un chat
   * @param {number|string} chatId - ID del chat
   * @returns {Promise<Object>} Número de miembros
   */
  async getChatMemberCount(chatId) {
    try {
      const response = await axios.get(`${this.apiUrl}/getChatMemberCount`, {
        params: { chat_id: chatId }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener el número de miembros:', error.message);
      throw error;
    }
  }

  /**
   * Verifica si un usuario es administrador de un canal
   * @param {number|string} chatId - ID del chat
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} True si es administrador, false en caso contrario
   */
  async isChannelAdmin(chatId, userId) {
    try {
      const response = await axios.get(`${this.apiUrl}/getChatMember`, {
        params: {
          chat_id: chatId,
          user_id: userId
        }
      });
      
      if (response.data.ok) {
        const status = response.data.result.status;
        return status === 'administrator' || status === 'creator';
      }
      return false;
    } catch (error) {
      console.error('Error al verificar administrador:', error.message);
      return false;
    }
  }

  /**
   * Envía una factura para pago
   * @param {number|string} chatId - ID del chat
   * @param {Object} invoiceData - Datos de la factura
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendInvoice(chatId, invoiceData) {
    try {
      const payload = {
        chat_id: chatId,
        ...invoiceData
      };
      const response = await axios.post(`${this.apiUrl}/sendInvoice`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al enviar factura:', error.message);
      throw error;
    }
  }

  /**
   * Crea un enlace de factura
   * @param {Object} invoiceData - Datos de la factura
   * @returns {Promise<Object>} Enlace de factura
   */
  async createInvoiceLink(invoiceData) {
    try {
      const response = await axios.post(`${this.apiUrl}/createInvoiceLink`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error al crear enlace de factura:', error.message);
      throw error;
    }
  }

  /**
   * Configura un webhook para recibir actualizaciones
   * @param {string} url - URL del webhook
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>} Resultado de la configuración
   */
  async setWebhook(url, options = {}) {
    try {
      const payload = {
        url,
        ...options
      };
      const response = await axios.post(`${this.apiUrl}/setWebhook`, payload);
      return response.data;
    } catch (error) {
      console.error('Error al configurar webhook:', error.message);
      throw error;
    }
  }

  /**
   * Elimina el webhook configurado
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteWebhook() {
    try {
      const response = await axios.post(`${this.apiUrl}/deleteWebhook`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar webhook:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la propiedad de un canal
   * @param {string} channelUsername - Nombre de usuario del canal
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} True si es propietario, false en caso contrario
   */
  async verifyChannelOwnership(channelUsername, userId) {
    try {
      // Primero obtenemos información del canal
      const chatInfo = await this.getChat(`@${channelUsername}`);
      if (!chatInfo.ok) return false;
      
      // Verificamos si el usuario es administrador
      return await this.isChannelAdmin(chatInfo.result.id, userId);
    } catch (error) {
      console.error('Error al verificar propiedad del canal:', error.message);
      return false;
    }
  }

  /**
   * Obtiene estadísticas básicas de un canal
   * @param {string} channelId - ID del canal
   * @returns {Promise<Object>} Estadísticas del canal
   */
  async getChannelStats(channelId) {
    try {
      // Obtenemos información del canal
      const chatInfo = await this.getChat(channelId);
      if (!chatInfo.ok) throw new Error('No se pudo obtener información del canal');
      
      // Obtenemos el número de miembros
      const memberCount = await this.getChatMemberCount(channelId);
      if (!memberCount.ok) throw new Error('No se pudo obtener el número de miembros');
      
      return {
        channelInfo: chatInfo.result,
        memberCount: memberCount.result
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del canal:', error.message);
      throw error;
    }
  }
}

module.exports = TelegramAPI;
