const { Client, GatewayIntentBits, Partials, MessageEmbed } = require('discord.js');
require('dotenv').config();

/**
 * Clase para la integración con la API de Discord
 */
class DiscordAPI {
  constructor(token) {
    this.token = token;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember
      ]
    });
    
    this.isReady = false;
    
    // Configurar eventos básicos
    this.client.on('ready', () => {
      console.log(`Bot conectado como ${this.client.user.tag}`);
      this.isReady = true;
    });
    
    this.client.on('error', (error) => {
      console.error('Error en el cliente de Discord:', error);
    });
  }

  /**
   * Inicia la conexión con Discord
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      await this.client.login(this.token);
    } catch (error) {
      console.error('Error al conectar con Discord:', error.message);
      throw error;
    }
  }

  /**
   * Desconecta el cliente de Discord
   */
  disconnect() {
    this.client.destroy();
    this.isReady = false;
  }

  /**
   * Obtiene información sobre un servidor
   * @param {string} guildId - ID del servidor
   * @returns {Promise<Object>} Información del servidor
   */
  async getGuildInfo(guildId) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const guild = await this.client.guilds.fetch(guildId);
      
      if (!guild) {
        throw new Error('Servidor no encontrado');
      }
      
      // Obtener estadísticas básicas
      const memberCount = guild.memberCount;
      const channels = await guild.channels.fetch();
      const textChannels = channels.filter(channel => channel.type === 0).size;
      const voiceChannels = channels.filter(channel => channel.type === 2).size;
      
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL({ dynamic: true }),
        memberCount,
        textChannels,
        voiceChannels,
        ownerId: guild.ownerId,
        createdAt: guild.createdAt
      };
    } catch (error) {
      console.error('Error al obtener información del servidor:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene información sobre un canal
   * @param {string} channelId - ID del canal
   * @returns {Promise<Object>} Información del canal
   */
  async getChannelInfo(channelId) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error('Canal no encontrado');
      }
      
      return {
        id: channel.id,
        name: channel.name,
        type: channel.type,
        guildId: channel.guildId,
        position: channel.position,
        createdAt: channel.createdAt,
        memberCount: channel.members?.size
      };
    } catch (error) {
      console.error('Error al obtener información del canal:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje a un canal
   * @param {string} channelId - ID del canal
   * @param {string|Object} content - Contenido del mensaje o objeto de opciones
   * @returns {Promise<Object>} Mensaje enviado
   */
  async sendMessage(channelId, content) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error('Canal no encontrado');
      }
      
      const message = await channel.send(content);
      return message;
    } catch (error) {
      console.error('Error al enviar mensaje:', error.message);
      throw error;
    }
  }

  /**
   * Envía un mensaje con un embed
   * @param {string} channelId - ID del canal
   * @param {Object} embedData - Datos del embed
   * @returns {Promise<Object>} Mensaje enviado
   */
  async sendEmbed(channelId, embedData) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error('Canal no encontrado');
      }
      
      const message = await channel.send({ embeds: [embedData] });
      return message;
    } catch (error) {
      console.error('Error al enviar embed:', error.message);
      throw error;
    }
  }

  /**
   * Obtiene mensajes de un canal
   * @param {string} channelId - ID del canal
   * @param {number} limit - Límite de mensajes a obtener
   * @returns {Promise<Array>} Mensajes obtenidos
   */
  async getMessages(channelId, limit = 50) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error('Canal no encontrado');
      }
      
      const messages = await channel.messages.fetch({ limit });
      return Array.from(messages.values());
    } catch (error) {
      console.error('Error al obtener mensajes:', error.message);
      throw error;
    }
  }

  /**
   * Verifica si un usuario es administrador de un servidor
   * @param {string} guildId - ID del servidor
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si es administrador, false en caso contrario
   */
  async isGuildAdmin(guildId, userId) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const guild = await this.client.guilds.fetch(guildId);
      
      if (!guild) {
        throw new Error('Servidor no encontrado');
      }
      
      const member = await guild.members.fetch(userId);
      
      if (!member) {
        return false;
      }
      
      return member.permissions.has('ADMINISTRATOR') || guild.ownerId === userId;
    } catch (error) {
      console.error('Error al verificar administrador:', error.message);
      return false;
    }
  }

  /**
   * Verifica si un usuario es propietario de un canal
   * @param {string} channelId - ID del canal
   * @param {string} userId - ID del usuario
   * @returns {Promise<boolean>} True si es propietario, false en caso contrario
   */
  async isChannelOwner(channelId, userId) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel || !channel.guild) {
        throw new Error('Canal no encontrado o no es un canal de servidor');
      }
      
      // Verificar si es propietario del servidor
      if (channel.guild.ownerId === userId) {
        return true;
      }
      
      // Verificar permisos de administrador en el canal
      const permissions = channel.permissionsFor(userId);
      return permissions && permissions.has('MANAGE_CHANNELS');
    } catch (error) {
      console.error('Error al verificar propietario del canal:', error.message);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de un canal
   * @param {string} channelId - ID del canal
   * @returns {Promise<Object>} Estadísticas del canal
   */
  async getChannelStats(channelId) {
    try {
      if (!this.isReady) {
        throw new Error('El cliente de Discord no está conectado');
      }
      
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error('Canal no encontrado');
      }
      
      // Obtener mensajes recientes para análisis
      const messages = await channel.messages.fetch({ limit: 100 });
      
      // Calcular estadísticas básicas
      const totalMessages = messages.size;
      const uniqueUsers = new Set(messages.map(msg => msg.author.id)).size;
      
      // Calcular actividad por día (últimos 7 días)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const messagesByDay = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateString = date.toISOString().split('T')[0];
        messagesByDay[dateString] = 0;
      }
      
      messages.forEach(msg => {
        const date = new Date(msg.createdTimestamp);
        if (date >= sevenDaysAgo) {
          const dateString = date.toISOString().split('T')[0];
          if (messagesByDay[dateString] !== undefined) {
            messagesByDay[dateString]++;
          }
        }
      });
      
      return {
        id: channel.id,
        name: channel.name,
        totalMessages,
        uniqueUsers,
        messagesByDay,
        lastActive: messages.first()?.createdAt
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del canal:', error.message);
      throw error;
    }
  }

  /**
   * Configura un evento personalizado
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función de callback
   */
  on(event, callback) {
    this.client.on(event, callback);
  }

  /**
   * Elimina un evento personalizado
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Función de callback
   */
  off(event, callback) {
    this.client.off(event, callback);
  }
}

module.exports = DiscordAPI;
