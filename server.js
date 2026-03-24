require('dotenv').config();

const app = require('./app');
const fs = require('fs');
const path = require('path');

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================

async function startServer() {
  try {
    const PORT = Number(process.env.PORT) || 5000;
    const ENV = process.env.NODE_ENV || 'development';
    const fatalPath = path.join(__dirname, '_server_fatal.log');

    const logFatal = (error) => {
      const msg = `${new Date().toISOString()} ${error?.stack || String(error)}\n`;
      try {
        fs.appendFileSync(fatalPath, msg);
      } catch (e) {}
      console.error(msg);
    };

    process.on('uncaughtException', logFatal);
    process.on('unhandledRejection', logFatal);

    // 2. Iniciar la escucha del servidor
    const server = app.listen(PORT, () => {
      console.log(`
🚀 Servidor iniciado exitosamente
📡 Puerto: ${PORT}
🌍 Entorno: ${ENV}
⏱️  Tiempo: ${new Date().toLocaleString()}
      `);
    });
    server.on('error', logFatal);
    setInterval(() => {}, 1 << 30);

    const databaseConfig = (() => {
      try {
        return require('./config/database');
      } catch (e) {
        return null;
      }
    })();

    if (databaseConfig?.conectar) {
      console.log('⏳ Conectando a la base de datos...');
      databaseConfig.conectar()
        .then(() => databaseConfig.configurarIndices?.())
        .catch((error) => {
          console.error('❌ Error al inicializar base de datos:', error?.message || error);
        });
    }

    // 4. Manejo de cierre gracioso (Graceful Shutdown)
    process.on('SIGTERM', () => {
      console.log('SIGTERM recibido. Cerrando servidor HTTP...');
      server.close(() => {
        console.log('Servidor HTTP cerrado.');
        if (databaseConfig?.desconectar) {
          databaseConfig.desconectar().then(() => process.exit(0));
          return;
        }
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error fatal durante el inicio del servidor:', error);
    process.exit(1);
  }
}

// Ejecutar el inicio del servidor
startServer();
