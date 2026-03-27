/**
 * Servicio de API para la plataforma de monetización
 * Centraliza todas las llamadas al backend
 */

const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Obtener el token de autenticación
   */
  getAuthToken() {
    return localStorage.getItem('token');
  }

  /**
   * Configurar headers por defecto
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Realizar petición HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.auth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error en la petición');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS DE AUTENTICACIÓN
  // ==========================================

  /**
   * Iniciar sesión
   */
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    });
  }

  /**
   * Registrar usuario
   */
  async register(userData) {
    return this.request('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(userData),
      auth: false,
    });
  }

  /**
   * Verificar token
   */
  async verifyToken() {
    return this.request('/auth/verificar-token');
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Solicitar restablecimiento de contraseña
   */
  async requestPasswordReset(email) {
    return this.request('/auth/solicitar-restablecimiento', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: false,
    });
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(token, newPassword) {
    return this.request(`/auth/restablecer-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password: newPassword }),
      auth: false,
    });
  }

  // ==========================================
  // MÉTODOS DE CANALES
  // ==========================================

  /**
   * Obtener mis canales
   */
  async getMyChannels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/canales${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Obtener canal por ID
   */
  async getChannel(id) {
    return this.request(`/canales/${id}`);
  }

  /**
   * Crear nuevo canal
   */
  async createChannel(channelData) {
    return this.request('/canales', {
      method: 'POST',
      body: JSON.stringify(channelData),
    });
  }

  /**
   * Actualizar canal
   */
  async updateChannel(id, channelData) {
    return this.request(`/canales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(channelData),
    });
  }

  /**
   * Eliminar canal
   */
  async deleteChannel(id) {
    return this.request(`/canales/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Verificar canal
   */
  async verifyChannel(id, verificationData) {
    return this.request(`/canales/${id}/verificar`, {
      method: 'POST',
      body: JSON.stringify(verificationData),
    });
  }

  /**
   * Buscar canales públicos
   */
  async searchChannels(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/canales/buscar${queryString ? `?${queryString}` : ''}`);
  }

  // ==========================================
  // MÉTODOS DE ANUNCIOS
  // ==========================================

  /**
   * Obtener mis anuncios
   */
  async getMyAds(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/anuncios${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Obtener anuncios para creador
   */
  async getAdsForCreator(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/anuncios/creador${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Obtener anuncio por ID
   */
  async getAd(id) {
    return this.request(`/anuncios/${id}`);
  }

  /**
   * Crear nuevo anuncio
   */
  async createAd(adData) {
    return this.request('/anuncios', {
      method: 'POST',
      body: JSON.stringify(adData),
    });
  }

  /**
   * Actualizar anuncio
   */
  async updateAd(id, adData) {
    return this.request(`/anuncios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(adData),
    });
  }

  /**
   * Eliminar anuncio
   */
  async deleteAd(id) {
    return this.request(`/anuncios/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Enviar anuncio para aprobación
   */
  async submitAdForApproval(id) {
    return this.request(`/anuncios/${id}/enviar-aprobacion`, {
      method: 'POST',
    });
  }

  /**
   * Responder a solicitud de aprobación
   */
  async respondToAdApproval(id, response) {
    return this.request(`/anuncios/${id}/responder-aprobacion`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
  }

  /**
   * Activar anuncio
   */
  async activateAd(id) {
    return this.request(`/anuncios/${id}/activar`, {
      method: 'POST',
    });
  }

  /**
   * Completar anuncio
   */
  async completeAd(id, completionData) {
    return this.request(`/anuncios/${id}/completar`, {
      method: 'POST',
      body: JSON.stringify(completionData),
    });
  }

  /**
   * Obtener estadísticas de anuncios
   */
  async getAdStatistics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/anuncios/estadisticas${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Optimizar campaña (Auto-buy)
   */
  async optimizeCampaign(data) {
    return this.request('/campaigns/optimize', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Lanzar campaña automática (Launch-auto)
   */
  async launchAutoCampaign(data) {
    return this.request('/campaigns/launch-auto', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==========================================
  // MÉTODOS DE LISTAS DE CANALES
  // ==========================================

  /**
   * Obtener mis listas de canales
   */
  async getMyLists() {
    return this.request('/lists');
  }

  /**
   * Crear nueva lista de canales
   */
  async createList(data) {
    return this.request('/lists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Agregar canal a lista
   */
  async addChannelToList(listId, channelId) {
    return this.request(`/lists/${listId}/add-channel`, {
      method: 'POST',
      body: JSON.stringify({ channelId }),
    });
  }

  /**
   * Eliminar canal de lista
   */
  async removeChannelFromList(listId, channelId) {
    return this.request(`/lists/${listId}/remove-channel/${channelId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // MÉTODOS DE TRANSACCIONES
  // ==========================================

  /**
   * Obtener mis transacciones
   */
  async getMyTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/transacciones${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Obtener transacción por ID
   */
  async getTransaction(id) {
    return this.request(`/transacciones/${id}`);
  }

  /**
   * Crear nueva transacción
   */
  async createTransaction(transactionData) {
    return this.request('/transacciones', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  /**
   * Procesar pago
   */
  async processPayment(paymentData) {
    return this.request('/transacciones/pagar', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Solicitar retiro
   */
  async requestWithdrawal(withdrawalData) {
    return this.request('/transacciones/retiro', {
      method: 'POST',
      body: JSON.stringify(withdrawalData),
    });
  }

  // ==========================================
  // MÉTODOS DE ESTADÍSTICAS
  // ==========================================

  /**
   * Obtener estadísticas generales
   */
  async getGeneralStats() {
    return this.request('/estadisticas/generales');
  }

  /**
   * Obtener estadísticas del dashboard
   */
  async getDashboardStats() {
    return this.request('/estadisticas/dashboard');
  }

  /**
   * Obtener estadísticas de un canal
   */
  async getChannelStats(id) {
    return this.request(`/estadisticas/canales/${id}`);
  }

  /**
   * Obtener estadísticas de un anuncio
   */
  async getAdStats(id) {
    return this.request(`/estadisticas/anuncios/${id}`);
  }

  // ==========================================
  // MÉTODOS DE NOTIFICACIONES
  // ==========================================

  /**
   * Obtener mis notificaciones
   */
  async getMyNotifications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(id) {
    return this.request(`/notifications/${id}/leer`, {
      method: 'PUT',
    });
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllNotificationsAsRead() {
    return this.request('/notifications/leer-todas', {
      method: 'PUT',
    });
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(id) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // MÉTODOS DE ARCHIVOS
  // ==========================================

  /**
   * Subir archivo
   */
  async uploadFile(file, type = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.request('/files/upload', {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${this.getAuthToken()}`,
        // No incluir Content-Type para FormData
      },
    });
  }

  /**
   * Obtener archivo
   */
  async getFile(id) {
    return this.request(`/files/${id}`);
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(id) {
    return this.request(`/files/${id}`, {
      method: 'DELETE',
    });
  }
}

// Crear instancia única del servicio
const apiService = new ApiService();

export default apiService;