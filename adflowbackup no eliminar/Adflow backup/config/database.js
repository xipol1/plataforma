const mongoose = require('mongoose');

/**
 * Configuración y conexión a MongoDB
 */
class DatabaseConfig {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 segundos
  }

  /**
   * Conectar a MongoDB con reintentos automáticos
   */
  async conectar() {
    try {
      // Configurar opciones de conexión
      const opciones = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
        serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
        socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
        family: 4, // Usar IPv4
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',
        // Configuraciones adicionales para producción
        ...(process.env.NODE_ENV === 'production' && process.env.DB_SSL !== 'false' && {
          ssl: true,
          sslValidate: true,
          authSource: 'admin'
        })
      };

      // Configurar Mongoose
      mongoose.set('strictQuery', false);
      mongoose.set('debug', process.env.NODE_ENV === 'development');

      // Intentar conexión
      const conn = await mongoose.connect(process.env.MONGODB_URI, opciones);
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      console.log(`✅ MongoDB conectado exitosamente`);
      console.log(`   📍 Host: ${conn.connection.host}`);
      console.log(`   🗄️ Base de datos: ${conn.connection.name}`);
      console.log(`   🔗 Estado: ${this.getConnectionState()}`);
      
      // Configurar eventos de conexión
      this.configurarEventos();
      
      return conn;
      
    } catch (error) {
      this.isConnected = false;
      this.connectionAttempts++;
      
      console.error(`❌ Error al conectar a MongoDB (intento ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
      
      // Reintentar si no se ha alcanzado el máximo
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Reintentando conexión en ${this.retryDelay / 1000} segundos...`);
        await this.esperar(this.retryDelay);
        return this.conectar();
      } else {
        console.error('💥 Máximo número de reintentos alcanzado. Cerrando aplicación.');
        process.exit(1);
      }
    }
  }

  /**
   * Configurar eventos de la conexión
   */
  configurarEventos() {
    const connection = mongoose.connection;

    // Evento de error
    connection.on('error', (error) => {
      console.error('❌ Error de conexión MongoDB:', error.message);
      this.isConnected = false;
    });

    // Evento de desconexión
    connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
      this.isConnected = false;
      
      // Intentar reconectar automáticamente
      if (process.env.NODE_ENV === 'production') {
        this.reconectar();
      }
    });

    // Evento de reconexión
    connection.on('reconnected', () => {
      console.log('✅ MongoDB reconectado exitosamente');
      this.isConnected = true;
      this.connectionAttempts = 0;
    });

    // Evento de conexión inicial
    connection.on('connected', () => {
      console.log('🔗 Conexión inicial a MongoDB establecida');
    });

    // Evento cuando se cierra la conexión
    connection.on('close', () => {
      console.log('🔒 Conexión MongoDB cerrada');
      this.isConnected = false;
    });
  }

  /**
   * Reconectar automáticamente
   */
  async reconectar() {
    if (this.isConnected || this.connectionAttempts >= this.maxRetries) {
      return;
    }

    try {
      console.log('🔄 Intentando reconectar a MongoDB...');
      await this.conectar();
    } catch (error) {
      console.error('❌ Error en reconexión automática:', error.message);
    }
  }

  /**
   * Cerrar conexión gracefully
   */
  async desconectar() {
    try {
      if (this.isConnected) {
        await mongoose.connection.close();
        console.log('🔒 Conexión MongoDB cerrada correctamente');
      }
    } catch (error) {
      console.error('❌ Error al cerrar conexión MongoDB:', error.message);
    }
  }

  /**
   * Obtener estado de la conexión
   */
  getConnectionState() {
    const states = {
      0: 'Desconectado',
      1: 'Conectado',
      2: 'Conectando',
      3: 'Desconectando'
    };
    
    return states[mongoose.connection.readyState] || 'Desconocido';
  }

  /**
   * Verificar si la base de datos está disponible
   */
  async verificarConexion() {
    try {
      await mongoose.connection.db.admin().ping();
      return true;
    } catch (error) {
      console.error('❌ Error al verificar conexión:', error.message);
      return false;
    }
  }

  /**
   * Obtener estadísticas de la conexión
   */
  async obtenerEstadisticas() {
    try {
      const stats = await mongoose.connection.db.stats();
      return {
        baseDatos: mongoose.connection.name,
        colecciones: stats.collections,
        documentos: stats.objects,
        tamaño: this.formatearBytes(stats.dataSize),
        indices: stats.indexes,
        tamañoIndices: this.formatearBytes(stats.indexSize)
      };
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.message);
      return null;
    }
  }

  /**
   * Formatear bytes a formato legible
   */
  formatearBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Función auxiliar para esperar
   */
  esperar(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Configurar índices de la base de datos
   */
  async configurarIndices() {
    try {
      console.log('🔧 Configurando índices de base de datos...');
      
      // Índices para Usuario
      await mongoose.connection.collection('usuarios').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.collection('usuarios').createIndex({ 'tokenVerificacion.token': 1 });
      await mongoose.connection.collection('usuarios').createIndex({ 'tokenRecuperacion.token': 1 });
      await mongoose.connection.collection('usuarios').createIndex({ fechaCreacion: -1 });
      
      // Índices para Canal
      await mongoose.connection.collection('canales').createIndex({ propietario: 1 });
      await mongoose.connection.collection('canales').createIndex({ plataforma: 1, identificadorCanal: 1 }, { unique: true });
      await mongoose.connection.collection('canales').createIndex({ categoria: 1 });
      await mongoose.connection.collection('canales').createIndex({ estado: 1 });
      await mongoose.connection.collection('canales').createIndex({ fechaCreacion: -1 });
      
      // Índices para Anuncio
      await mongoose.connection.collection('anuncios').createIndex({ anunciante: 1 });
      await mongoose.connection.collection('anuncios').createIndex({ canal: 1 });
      await mongoose.connection.collection('anuncios').createIndex({ estado: 1 });
      await mongoose.connection.collection('anuncios').createIndex({ tipoAnuncio: 1 });
      await mongoose.connection.collection('anuncios').createIndex({ fechaCreacion: -1 });
      await mongoose.connection.collection('anuncios').createIndex({ 'programacion.fechaInicio': 1, 'programacion.fechaFin': 1 });
      
      // Índices para Transaccion
      await mongoose.connection.collection('transacciones').createIndex({ transaccionId: 1 }, { unique: true });
      await mongoose.connection.collection('transacciones').createIndex({ anunciante: 1 });
      await mongoose.connection.collection('transacciones').createIndex({ creador: 1 });
      await mongoose.connection.collection('transacciones').createIndex({ anuncio: 1 });
      await mongoose.connection.collection('transacciones').createIndex({ estado: 1 });
      await mongoose.connection.collection('transacciones').createIndex({ tipo: 1 });
      await mongoose.connection.collection('transacciones').createIndex({ fechaCreacion: -1 });
      
      console.log('✅ Índices configurados correctamente');
      
    } catch (error) {
      console.error('❌ Error al configurar índices:', error.message);
    }
  }

  /**
   * Limpiar datos de desarrollo (solo en desarrollo)
   */
  async limpiarDatosDesarrollo() {
    if (process.env.NODE_ENV !== 'development') {
      console.log('⚠️ Limpieza de datos solo disponible en desarrollo');
      return;
    }

    try {
      console.log('🧹 Limpiando datos de desarrollo...');
      
      await mongoose.connection.collection('usuarios').deleteMany({});
      await mongoose.connection.collection('canales').deleteMany({});
      await mongoose.connection.collection('anuncios').deleteMany({});
      await mongoose.connection.collection('transacciones').deleteMany({});
      
      console.log('✅ Datos de desarrollo limpiados');
      
    } catch (error) {
      console.error('❌ Error al limpiar datos:', error.message);
    }
  }
}

// Crear instancia singleton
const databaseConfig = new DatabaseConfig();

module.exports = databaseConfig;