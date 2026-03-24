require('dotenv').config();

const app = require('./app');
const config = require('./config/config');
const databaseConfig = require('./config/database');

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================

async function startServer() {
  try {
    // 1. Obtener el puerto de la configuración
    const PORT = config.server.port;
    const ENV = config.server.environment;

    // 2. Iniciar la escucha del servidor
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Servidor iniciado exitosamente
📡 Puerto: ${PORT}
🌍 Entorno: ${ENV}
⏱️  Tiempo: ${new Date().toLocaleString()}
      `);
    });

    // 3. Inicializar base de datos (no bloquear inicio del servidor)
    console.log('⏳ Conectando a la base de datos...');
    databaseConfig.conectar()
      .then(() => databaseConfig.configurarIndices())
      .catch((error) => {
        console.error('❌ Error al inicializar base de datos:', error?.message || error);
      });

    // 4. Manejo de cierre gracioso (Graceful Shutdown)
    process.on('SIGTERM', () => {
      console.log('SIGTERM recibido. Cerrando servidor HTTP...');
      server.close(() => {
        console.log('Servidor HTTP cerrado.');
        databaseConfig.desconectar().then(() => {
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Error fatal durante el inicio del servidor:', error);
    process.exit(1);
  }
}

// Ejecutar el inicio del servidor
startServer();
