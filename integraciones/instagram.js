const axios = require('axios');
require('dotenv').config();

/**
 * Clase para la integración con la API de Instagram
 */
class InstagramAPI {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.apiVersion = 'v17.0'; // Versión actual de la API
    this.apiUrl = `https://graph.facebook.com/${this.apiVersion}`;
  }

  /**
   * Obtiene información básica del usuario de Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @returns {Promise<Object>} Información del usuario
   */
  async getUserInfo(userId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${userId}`, {
        params: {
          fields: 'id,username,name,profile_picture_url,biography,website,follows_count,followers_count,media_count',
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene las publicaciones de un usuario de Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @param {number} limit - Límite de publicaciones a obtener
   * @returns {Promise<Object>} Publicaciones del usuario
   */
  async getUserMedia(userId, limit = 25) {
    try {
      const response = await axios.get(`${this.apiUrl}/${userId}/media`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_url,media_type,thumbnail_url}',
          limit,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener publicaciones del usuario:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene información detallada de una publicación específica
   * @param {string} mediaId - ID de la publicación
   * @returns {Promise<Object>} Información de la publicación
   */
  async getMediaInfo(mediaId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${mediaId}`, {
        params: {
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,children{media_url,media_type,thumbnail_url}',
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener información de la publicación:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene los comentarios de una publicación
   * @param {string} mediaId - ID de la publicación
   * @param {number} limit - Límite de comentarios a obtener
   * @returns {Promise<Object>} Comentarios de la publicación
   */
  async getMediaComments(mediaId, limit = 25) {
    try {
      const response = await axios.get(`${this.apiUrl}/${mediaId}/comments`, {
        params: {
          fields: 'id,text,timestamp,username,like_count,replies{id,text,timestamp,username,like_count}',
          limit,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener comentarios de la publicación:', error.message);
      throw error;
    }
  }

  /**
   * Publica un comentario en una publicación
   * @param {string} mediaId - ID de la publicación
   * @param {string} text - Texto del comentario
   * @returns {Promise<Object>} Resultado de la publicación del comentario
   */
  async postComment(mediaId, text) {
    try {
      const response = await axios.post(`${this.apiUrl}/${mediaId}/comments`, null, {
        params: {
          message: text,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al publicar comentario:', error.message);
      throw error;
    }
  }

  /**
   * Responde a un comentario
   * @param {string} commentId - ID del comentario
   * @param {string} text - Texto de la respuesta
   * @returns {Promise<Object>} Resultado de la respuesta al comentario
   */
  async replyToComment(commentId, text) {
    try {
      const response = await axios.post(`${this.apiUrl}/${commentId}/replies`, null, {
        params: {
          message: text,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al responder al comentario:', error.message);
      throw error;
    }
  }

  /**
   * Elimina un comentario
   * @param {string} commentId - ID del comentario
   * @returns {Promise<Object>} Resultado de la eliminación
   */
  async deleteComment(commentId) {
    try {
      const response = await axios.delete(`${this.apiUrl}/${commentId}`, {
        params: {
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar comentario:', error.message);
      throw error;
    }
  }

  /**
   * Publica una imagen en Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @param {string} imageUrl - URL de la imagen
   * @param {string} caption - Texto de la publicación
   * @returns {Promise<Object>} Resultado de la publicación
   */
  async publishImage(userId, imageUrl, caption = '') {
    try {
      // Primero creamos el contenedor para la publicación
      const containerResponse = await axios.post(`${this.apiUrl}/${userId}/media`, null, {
        params: {
          image_url: imageUrl,
          caption,
          access_token: this.accessToken
        }
      });

      const containerId = containerResponse.data.id;

      // Luego publicamos el contenedor
      const publishResponse = await axios.post(`${this.apiUrl}/${userId}/media_publish`, null, {
        params: {
          creation_id: containerId,
          access_token: this.accessToken
        }
      });

      return publishResponse.data;
    } catch (error) {
      console.error('Error al publicar imagen:', error.message);
      throw error;
    }
  }

  /**
   * Publica un carrusel en Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @param {Array} mediaUrls - Array de URLs de imágenes o videos
   * @param {string} caption - Texto de la publicación
   * @returns {Promise<Object>} Resultado de la publicación
   */
  async publishCarousel(userId, mediaUrls, caption = '') {
    try {
      // Primero creamos los contenedores para cada medio
      const childrenIds = [];
      for (const mediaUrl of mediaUrls) {
        const isVideo = mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.mov');
        const params = isVideo ? 
          { video_url: mediaUrl, media_type: 'VIDEO', access_token: this.accessToken } : 
          { image_url: mediaUrl, access_token: this.accessToken };
        
        const containerResponse = await axios.post(`${this.apiUrl}/${userId}/media`, null, { params });
        childrenIds.push(containerResponse.data.id);
      }

      // Luego creamos el contenedor del carrusel
      const carouselResponse = await axios.post(`${this.apiUrl}/${userId}/media`, null, {
        params: {
          media_type: 'CAROUSEL',
          children: childrenIds.join(','),
          caption,
          access_token: this.accessToken
        }
      });

      const carouselId = carouselResponse.data.id;

      // Finalmente publicamos el carrusel
      const publishResponse = await axios.post(`${this.apiUrl}/${userId}/media_publish`, null, {
        params: {
          creation_id: carouselId,
          access_token: this.accessToken
        }
      });

      return publishResponse.data;
    } catch (error) {
      console.error('Error al publicar carrusel:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de una publicación
   * @param {string} mediaId - ID de la publicación
   * @returns {Promise<Object>} Estadísticas de la publicación
   */
  async getMediaInsights(mediaId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${mediaId}/insights`, {
        params: {
          metric: 'engagement,impressions,reach,saved',
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de la publicación:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del perfil de usuario
   * @param {string} userId - ID del usuario de Instagram
   * @returns {Promise<Object>} Estadísticas del perfil
   */
  async getUserInsights(userId) {
    try {
      const response = await axios.get(`${this.apiUrl}/${userId}/insights`, {
        params: {
          metric: 'audience_gender,audience_city,audience_country,audience_age,online_followers',
          period: 'lifetime',
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas del perfil:', error.message);
      throw error;
    }
  }

  /**
   * Busca hashtags en Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @param {string} hashtag - Hashtag a buscar (sin el símbolo #)
   * @returns {Promise<Object>} Resultados de la búsqueda
   */
  async searchHashtag(userId, hashtag) {
    try {
      const response = await axios.get(`${this.apiUrl}/ig_hashtag_search`, {
        params: {
          user_id: userId,
          q: hashtag,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al buscar hashtag:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene publicaciones recientes con un hashtag específico
   * @param {string} hashtagId - ID del hashtag
   * @param {string} userId - ID del usuario de Instagram
   * @param {number} limit - Límite de publicaciones a obtener
   * @returns {Promise<Object>} Publicaciones con el hashtag
   */
  async getHashtagMedia(hashtagId, userId, limit = 25) {
    try {
      const response = await axios.get(`${this.apiUrl}/${hashtagId}/recent_media`, {
        params: {
          user_id: userId,
          fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username',
          limit,
          access_token: this.accessToken
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener publicaciones con hashtag:', error.message);
      throw error;
    }
  }

  /**
   * Verifica la propiedad de una cuenta de Instagram
   * @param {string} userId - ID del usuario de Instagram
   * @param {string} username - Nombre de usuario de Instagram
   * @returns {Promise<boolean>} True si es propietario, false en caso contrario
   */
  async verifyAccountOwnership(userId, username) {
    try {
      const userInfo = await this.getUserInfo(userId);
      return userInfo && userInfo.username === username;
    } catch (error) {
      console.error('Error al verificar propiedad de la cuenta:', error.message);
      return false;
    }
  }
}

module.exports = InstagramAPI;
