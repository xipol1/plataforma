const axios = require('axios');
require('dotenv').config();

/**
 * Clase para la integración con la API de WhatsApp Business
 */
class WhatsAppAPI {
  constructor(accessToken, phoneNumberId) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.apiVersion = 'v17.0'; // Versión actual de la API
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
  }

  /**
   * Envía un mensaje de texto simple
   * @param {string} to - Número de teléfono del destinatario con código de país
   * @param {string} text - Texto del mensaje
   * @param {boolean} previewUrl - Si se debe mostrar vista previa de URLs
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendTextMessage(to, text, previewUrl = false) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: previewUrl,
          body: text
        }
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje de texto:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje de plantilla
   * @param {string} to - Número de teléfono del destinatario con código de país
   * @param {string} templateName - Nombre de la plantilla
   * @param {string} language - Código de idioma (ej. 'es')
   * @param {Array} components - Componentes de la plantilla (header, body, buttons)
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendTemplateMessage(to, templateName, language, components = []) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: language
          },
          components
        }
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje de plantilla:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje con imagen
   * @param {string} to - Número de teléfono del destinatario con código de país
   * @param {string} imageUrl - URL de la imagen
   * @param {string} caption - Texto opcional para la imagen
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendImageMessage(to, imageUrl, caption = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'image',
        image: {
          link: imageUrl,
          caption
        }
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje con imagen:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje con documento
   * @param {string} to - Número de teléfono del destinatario con código de país
   * @param {string} documentUrl - URL del documento
   * @param {string} caption - Texto opcional para el documento
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<Object>} Resultado del envío
   */
  async sendDocumentMessage(to, documentUrl, caption = '', filename = '') {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'document',
        document: {
          link: documentUrl,
          caption,
          filename
        }
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje con documento:', error.message);
      throw error;
    }
  }

  /**
   * Marca un mensaje como leído
   * @param {string} messageId - ID del mensaje
   * @returns {Promise<Object>} Resultado de la operación
   */
  async markMessageAsRead(messageId) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };

      const response = await axios.post(`${this.apiUrl}/messages`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al marcar mensaje como leído:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene información sobre el número de teléfono
   * @returns {Promise<Object>} Información del número
   */
  async getPhoneNumberInfo() {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al obtener información del número:', error.message);
      throw error;
    }
  }

  /**
   * Crea una nueva plantilla de mensaje
   * @param {string} wabaId - ID de la cuenta de WhatsApp Business
   * @param {Object} templateData - Datos de la plantilla
   * @returns {Promise<Object>} Resultado de la creación
   */
  async createMessageTemplate(wabaId, templateData) {
    try {
      const response = await axios.post(`https://graph.facebook.com/${this.apiVersion}/${wabaId}/message_templates`, templateData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al crear plantilla de mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene todas las plantillas de mensaje
   * @param {string} wabaId - ID de la cuenta de WhatsApp Business
   * @returns {Promise<Object>} Lista de plantillas
   */
  async getMessageTemplates(wabaId) {
    try {
      const response = await axios.get(`https://graph.facebook.com/${this.apiVersion}/${wabaId}/message_templates`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al obtener plantillas de mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Configura un webhook para recibir notificaciones
   * @param {string} appId - ID de la aplicación
   * @param {string} callbackUrl - URL del webhook
   * @param {Array} fields - Campos a suscribir
   * @param {string} verifyToken - Token de verificación
   * @returns {Promise<Object>} Resultado de la configuración
   */
  async setupWebhook(appId, callbackUrl, fields, verifyToken) {
    try {
      const payload = {
        object: 'whatsapp_business_account',
        callback_url: callbackUrl,
        fields,
        verify_token: verifyToken
      };

      const response = await axios.post(`https://graph.facebook.com/${this.apiVersion}/${appId}/subscriptions`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error al configurar webhook:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la propiedad de un número de WhatsApp Business
   * @param {string} phoneNumber - Número de teléfono con código de país
   * @returns {Promise<boolean>} True si el número pertenece a la cuenta, false en caso contrario
   */
  async verifyPhoneNumberOwnership(phoneNumber) {
    try {
      const info = await this.getPhoneNumberInfo();
      return info && info.phone_number === phoneNumber;
    } catch (error) {
      console.error('Error al verificar propiedad del número:', error.message);
      return false;
    }
  }

  /**
   * Procesa un webhook entrante
   * @param {Object} webhookData - Datos del webhook
   * @returns {Object} Información procesada del webhook
   */
  processWebhook(webhookData) {
    try {
      // Verificar si es un mensaje entrante
      if (webhookData.object === 'whatsapp_business_account') {
        const entries = webhookData.entry || [];
        const messages = [];

        for (const entry of entries) {
          const changes = entry.changes || [];
          
          for (const change of changes) {
            if (change.field === 'messages') {
              const value = change.value || {};
              const messagesList = value.messages || [];
              
              for (const message of messagesList) {
                messages.push({
                  messageId: message.id,
                  from: message.from,
                  timestamp: message.timestamp,
                  type: message.type,
                  text: message.text?.body,
                  media: message.image || message.video || message.document,
                  context: message.context
                });
              }
            }
          }
        }

        return {
          type: 'messages',
          messages
        };
      }

      // Verificar si es una actualización de estado
      if (webhookData.object === 'whatsapp_business_account' && webhookData.entry) {
        const statuses = [];
        
        for (const entry of webhookData.entry) {
          if (entry.changes) {
            for (const change of entry.changes) {
              if (change.field === 'messages' && change.value && change.value.statuses) {
                statuses.push(...change.value.statuses);
              }
            }
          }
        }
        
        return {
          type: 'statuses',
          statuses
        };
      }

      return {
        type: 'unknown',
        data: webhookData
      };
    } catch (error) {
      console.error('Error al procesar webhook:', error.message);
      throw error;
    }
  }
}

module.exports = WhatsAppAPI;
