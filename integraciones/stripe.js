const stripe = require('stripe');
require('dotenv').config();

/**
 * Clase para la integración con la API de Stripe
 */
class StripeAPI {
  constructor(apiKey) {
    this.stripe = stripe(apiKey);
  }

  /**
   * Crea un cliente en Stripe
   * @param {Object} customerData - Datos del cliente
   * @returns {Promise<Object>} Cliente creado
   */
  async createCustomer(customerData) {
    try {
      const customer = await this.stripe.customers.create({
        name: customerData.name,
        email: customerData.email,
        description: customerData.description || 'Cliente de la plataforma de monetización',
        metadata: {
          userId: customerData.userId,
          userType: customerData.userType // 'creator' o 'advertiser'
        }
      });
      return customer;
    } catch (error) {
      console.error('Error al crear cliente en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Actualiza un cliente en Stripe
   * @param {string} customerId - ID del cliente en Stripe
   * @param {Object} customerData - Datos actualizados del cliente
   * @returns {Promise<Object>} Cliente actualizado
   */
  async updateCustomer(customerId, customerData) {
    try {
      const customer = await this.stripe.customers.update(customerId, customerData);
      return customer;
    } catch (error) {
      console.error('Error al actualizar cliente en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene un cliente de Stripe
   * @param {string} customerId - ID del cliente en Stripe
   * @returns {Promise<Object>} Cliente
   */
  async getCustomer(customerId) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error al obtener cliente de Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un método de pago (tarjeta) para un cliente
   * @param {string} customerId - ID del cliente en Stripe
   * @param {Object} paymentMethodData - Datos del método de pago
   * @returns {Promise<Object>} Método de pago creado
   */
  async createPaymentMethod(customerId, paymentMethodData) {
    try {
      // Crear el método de pago
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: paymentMethodData.cardNumber,
          exp_month: paymentMethodData.expMonth,
          exp_year: paymentMethodData.expYear,
          cvc: paymentMethodData.cvc
        },
        billing_details: {
          name: paymentMethodData.name,
          email: paymentMethodData.email,
          address: paymentMethodData.address
        }
      });

      // Asociar el método de pago al cliente
      await this.stripe.paymentMethods.attach(paymentMethod.id, {
        customer: customerId
      });

      // Opcionalmente, establecer como método de pago predeterminado
      if (paymentMethodData.setAsDefault) {
        await this.stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id
          }
        });
      }

      return paymentMethod;
    } catch (error) {
      console.error('Error al crear método de pago en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los métodos de pago de un cliente
   * @param {string} customerId - ID del cliente en Stripe
   * @param {string} type - Tipo de método de pago (card, sepa_debit, etc.)
   * @returns {Promise<Array>} Métodos de pago
   */
  async getPaymentMethods(customerId, type = 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type
      });
      return paymentMethods.data;
    } catch (error) {
      console.error('Error al obtener métodos de pago de Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un producto en Stripe (representa un canal o tipo de anuncio)
   * @param {Object} productData - Datos del producto
   * @returns {Promise<Object>} Producto creado
   */
  async createProduct(productData) {
    try {
      const product = await this.stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          channelId: productData.channelId,
          channelType: productData.channelType, // telegram, whatsapp, instagram, discord
          creatorId: productData.creatorId
        },
        active: true
      });
      return product;
    } catch (error) {
      console.error('Error al crear producto en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un precio para un producto en Stripe
   * @param {string} productId - ID del producto en Stripe
   * @param {Object} priceData - Datos del precio
   * @returns {Promise<Object>} Precio creado
   */
  async createPrice(productId, priceData) {
    try {
      const price = await this.stripe.prices.create({
        product: productId,
        unit_amount: priceData.amount, // en centavos
        currency: priceData.currency || 'usd',
        metadata: {
          adType: priceData.adType, // post, story, mención, etc.
          duration: priceData.duration // duración del anuncio en días
        }
      });
      return price;
    } catch (error) {
      console.error('Error al crear precio en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea una sesión de pago (checkout)
   * @param {Object} sessionData - Datos de la sesión
   * @returns {Promise<Object>} Sesión de pago
   */
  async createCheckoutSession(sessionData) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: sessionData.items.map(item => ({
          price: item.priceId,
          quantity: item.quantity || 1
        })),
        customer: sessionData.customerId,
        mode: 'payment',
        success_url: `${sessionData.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: sessionData.cancelUrl,
        metadata: {
          advertiserId: sessionData.advertiserId,
          creatorId: sessionData.creatorId,
          adId: sessionData.adId
        }
      });
      return session;
    } catch (error) {
      console.error('Error al crear sesión de checkout en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un pago directo (PaymentIntent)
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Intento de pago
   */
  async createPaymentIntent(paymentData) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: paymentData.amount, // en centavos
        currency: paymentData.currency || 'usd',
        customer: paymentData.customerId,
        payment_method: paymentData.paymentMethodId,
        off_session: paymentData.offSession || false,
        confirm: paymentData.confirm || false,
        description: paymentData.description || 'Pago por anuncio en canal',
        metadata: {
          advertiserId: paymentData.advertiserId,
          creatorId: paymentData.creatorId,
          adId: paymentData.adId,
          channelId: paymentData.channelId,
          channelType: paymentData.channelType
        }
      });
      return paymentIntent;
    } catch (error) {
      console.error('Error al crear intento de pago en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Confirma un intento de pago
   * @param {string} paymentIntentId - ID del intento de pago
   * @returns {Promise<Object>} Intento de pago confirmado
   */
  async confirmPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error al confirmar intento de pago en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene un intento de pago
   * @param {string} paymentIntentId - ID del intento de pago
   * @returns {Promise<Object>} Intento de pago
   */
  async getPaymentIntent(paymentIntentId) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      console.error('Error al obtener intento de pago de Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea una transferencia a una cuenta conectada (para pagar a creadores)
   * @param {Object} transferData - Datos de la transferencia
   * @returns {Promise<Object>} Transferencia creada
   */
  async createTransfer(transferData) {
    try {
      const transfer = await this.stripe.transfers.create({
        amount: transferData.amount, // en centavos
        currency: transferData.currency || 'usd',
        destination: transferData.destinationAccountId, // ID de la cuenta conectada del creador
        source_transaction: transferData.sourceTransactionId, // ID de la transacción de origen (cargo)
        description: transferData.description || 'Pago a creador por anuncio',
        metadata: {
          advertiserId: transferData.advertiserId,
          creatorId: transferData.creatorId,
          adId: transferData.adId,
          channelId: transferData.channelId,
          platformFee: transferData.platformFee // comisión de la plataforma
        }
      });
      return transfer;
    } catch (error) {
      console.error('Error al crear transferencia en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un reembolso
   * @param {Object} refundData - Datos del reembolso
   * @returns {Promise<Object>} Reembolso creado
   */
  async createRefund(refundData) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundData.paymentIntentId,
        amount: refundData.amount, // opcional, si es parcial
        reason: refundData.reason || 'requested_by_customer',
        metadata: {
          advertiserId: refundData.advertiserId,
          creatorId: refundData.creatorId,
          adId: refundData.adId,
          reason: refundData.detailedReason
        }
      });
      return refund;
    } catch (error) {
      console.error('Error al crear reembolso en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea una cuenta conectada para un creador
   * @param {Object} accountData - Datos de la cuenta
   * @returns {Promise<Object>} Cuenta conectada
   */
  async createConnectedAccount(accountData) {
    try {
      const account = await this.stripe.accounts.create({
        type: 'express', // o 'standard' o 'custom'
        country: accountData.country,
        email: accountData.email,
        business_type: accountData.businessType || 'individual',
        capabilities: {
          transfers: { requested: true }
        },
        metadata: {
          creatorId: accountData.creatorId
        }
      });
      return account;
    } catch (error) {
      console.error('Error al crear cuenta conectada en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Crea un enlace de incorporación para una cuenta conectada
   * @param {string} accountId - ID de la cuenta conectada
   * @param {string} refreshUrl - URL de retorno si el usuario abandona
   * @param {string} returnUrl - URL de retorno después de completar
   * @returns {Promise<Object>} Enlace de incorporación
   */
  async createAccountLink(accountId, refreshUrl, returnUrl) {
    try {
      const accountLink = await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding'
      });
      return accountLink;
    } catch (error) {
      console.error('Error al crear enlace de cuenta en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene el balance de una cuenta conectada
   * @param {string} accountId - ID de la cuenta conectada
   * @returns {Promise<Object>} Balance
   */
  async getConnectedAccountBalance(accountId) {
    try {
      const balance = await this.stripe.balance.retrieve({
        stripeAccount: accountId
      });
      return balance;
    } catch (error) {
      console.error('Error al obtener balance de cuenta conectada en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene las transacciones de balance de una cuenta conectada
   * @param {string} accountId - ID de la cuenta conectada
   * @param {Object} options - Opciones de listado
   * @returns {Promise<Array>} Transacciones de balance
   */
  async getConnectedAccountTransactions(accountId, options = {}) {
    try {
      const transactions = await this.stripe.balanceTransactions.list({
        limit: options.limit || 10,
        stripeAccount: accountId
      });
      return transactions.data;
    } catch (error) {
      console.error('Error al obtener transacciones de cuenta conectada en Stripe:', error.message);
      throw error;
    }
  }

  /**
   * Maneja un evento de webhook de Stripe
   * @param {string} payload - Payload del webhook
   * @param {string} sigHeader - Firma del webhook
   * @param {string} webhookSecret - Secreto del webhook
   * @returns {Object} Evento de Stripe
   */
  handleWebhookEvent(payload, sigHeader, webhookSecret) {
    try {
      const event = this.stripe.webhooks.constructEvent(
        payload,
        sigHeader,
        webhookSecret
      );
      return event;
    } catch (error) {
      console.error('Error al verificar webhook de Stripe:', error.message);
      throw error;
    }
  }
}

module.exports = StripeAPI;
