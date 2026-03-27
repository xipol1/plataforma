const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

/**
 * Clase para la integración con la API de PayPal
 */
class PayPalAPI {
  constructor(clientId, clientSecret, isSandbox = true) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.isSandbox = isSandbox;
    this.baseUrl = isSandbox 
      ? 'https://api-m.sandbox.paypal.com' 
      : 'https://api-m.paypal.com';
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Obtiene un token de acceso para autenticar las solicitudes a la API
   * @returns {Promise<string>} Token de acceso
   */
  async getAccessToken() {
    try {
      // Verificar si ya tenemos un token válido
      if (this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now()) {
        return this.accessToken;
      }

      // Obtener un nuevo token
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        },
        data: 'grant_type=client_credentials'
      });

      this.accessToken = response.data.access_token;
      // Establecer la expiración del token (restamos 60 segundos para asegurar la validez)
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error al obtener token de acceso de PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Crea una orden de pago en PayPal
   * @param {Object} orderData - Datos de la orden
   * @returns {Promise<Object>} Orden creada
   */
  async createOrder(orderData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          intent: orderData.intent || 'CAPTURE',
          purchase_units: orderData.purchaseUnits.map(unit => ({
            reference_id: unit.referenceId,
            description: unit.description,
            custom_id: unit.customId,
            amount: {
              currency_code: unit.currencyCode || 'USD',
              value: unit.amount.toString(),
              breakdown: unit.breakdown
            },
            items: unit.items,
            shipping: unit.shipping
          })),
          application_context: {
            brand_name: orderData.brandName,
            landing_page: orderData.landingPage || 'BILLING',
            shipping_preference: orderData.shippingPreference || 'NO_SHIPPING',
            user_action: orderData.userAction || 'PAY_NOW',
            return_url: orderData.returnUrl,
            cancel_url: orderData.cancelUrl
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear orden en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Captura una orden de pago aprobada
   * @param {string} orderId - ID de la orden
   * @returns {Promise<Object>} Resultado de la captura
   */
  async captureOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v2/checkout/orders/${orderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al capturar orden en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene detalles de una orden
   * @param {string} orderId - ID de la orden
   * @returns {Promise<Object>} Detalles de la orden
   */
  async getOrder(orderId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/v2/checkout/orders/${orderId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de orden en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Crea un pago de pago a un vendedor (creador de contenido)
   * @param {Object} payoutData - Datos del pago
   * @returns {Promise<Object>} Resultado del pago
   */
  async createPayout(payoutData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/payments/payouts`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          sender_batch_header: {
            sender_batch_id: payoutData.batchId,
            email_subject: payoutData.emailSubject || 'Tienes un pago de la plataforma de monetización',
            email_message: payoutData.emailMessage || 'Has recibido un pago por tus anuncios'
          },
          items: payoutData.items.map(item => ({
            recipient_type: item.recipientType || 'EMAIL',
            amount: {
              value: item.amount.toString(),
              currency: item.currency || 'USD'
            },
            note: item.note,
            sender_item_id: item.senderItemId,
            receiver: item.receiver
          }))
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear pago en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene detalles de un pago
   * @param {string} payoutBatchId - ID del lote de pago
   * @returns {Promise<Object>} Detalles del pago
   */
  async getPayoutBatch(payoutBatchId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/v1/payments/payouts/${payoutBatchId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de pago en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Crea un reembolso para una transacción capturada
   * @param {string} captureId - ID de la captura
   * @param {Object} refundData - Datos del reembolso
   * @returns {Promise<Object>} Resultado del reembolso
   */
  async refundCapture(captureId, refundData = {}) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v2/payments/captures/${captureId}/refund`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          amount: refundData.amount ? {
            value: refundData.amount.value.toString(),
            currency_code: refundData.amount.currencyCode || 'USD'
          } : undefined,
          note_to_payer: refundData.noteToPayer,
          invoice_id: refundData.invoiceId
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear reembolso en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Crea una suscripción para pagos recurrentes
   * @param {Object} subscriptionData - Datos de la suscripción
   * @returns {Promise<Object>} Suscripción creada
   */
  async createSubscription(subscriptionData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/billing/subscriptions`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          plan_id: subscriptionData.planId,
          start_time: subscriptionData.startTime,
          quantity: subscriptionData.quantity || '1',
          shipping_amount: subscriptionData.shippingAmount,
          subscriber: {
            name: {
              given_name: subscriptionData.subscriber.firstName,
              surname: subscriptionData.subscriber.lastName
            },
            email_address: subscriptionData.subscriber.email
          },
          application_context: {
            brand_name: subscriptionData.brandName,
            locale: subscriptionData.locale || 'es-ES',
            shipping_preference: subscriptionData.shippingPreference || 'NO_SHIPPING',
            user_action: subscriptionData.userAction || 'SUBSCRIBE_NOW',
            payment_method: {
              payer_selected: subscriptionData.payerSelected || 'PAYPAL',
              payee_preferred: subscriptionData.payeePreferred || 'IMMEDIATE_PAYMENT_REQUIRED'
            },
            return_url: subscriptionData.returnUrl,
            cancel_url: subscriptionData.cancelUrl
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear suscripción en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene detalles de una suscripción
   * @param {string} subscriptionId - ID de la suscripción
   * @returns {Promise<Object>} Detalles de la suscripción
   */
  async getSubscription(subscriptionId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de suscripción en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Cancela una suscripción
   * @param {string} subscriptionId - ID de la suscripción
   * @param {string} reason - Razón de la cancelación
   * @returns {Promise<Object>} Resultado de la cancelación
   */
  async cancelSubscription(subscriptionId, reason) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          reason: reason
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al cancelar suscripción en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Verifica un webhook de PayPal
   * @param {Object} headers - Cabeceras de la solicitud
   * @param {string} body - Cuerpo de la solicitud
   * @param {string} webhookId - ID del webhook
   * @returns {Promise<boolean>} True si el webhook es válido
   */
  async verifyWebhook(headers, body, webhookId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: typeof body === 'string' ? JSON.parse(body) : body
        }
      });
      
      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error al verificar webhook de PayPal:', error.message);
      return false;
    }
  }

  /**
   * Crea un plan de suscripción
   * @param {Object} planData - Datos del plan
   * @returns {Promise<Object>} Plan creado
   */
  async createPlan(planData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/billing/plans`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          product_id: planData.productId,
          name: planData.name,
          description: planData.description,
          status: planData.status || 'ACTIVE',
          billing_cycles: planData.billingCycles,
          payment_preferences: planData.paymentPreferences,
          taxes: planData.taxes
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear plan en PayPal:', error.message);
      throw error;
    }
  }

  /**
   * Crea un producto para suscripciones
   * @param {Object} productData - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  async createProduct(productData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/catalogs/products`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          name: productData.name,
          description: productData.description,
          type: productData.type || 'SERVICE',
          category: productData.category || 'SOFTWARE',
          image_url: productData.imageUrl,
          home_url: productData.homeUrl
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al crear producto en PayPal:', error.message);
      throw error;
    }
  }
}

module.exports = PayPalAPI;
