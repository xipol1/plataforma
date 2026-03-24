require('dotenv').config();

const app = require('./app');
const fs = require('fs');
const path = require('path');

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================

async function startServer() {
  try {
    const PORT = process.env.PORT || 5000;
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
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

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

  } catch (error) {
    console.error('❌ Error fatal durante el inicio del servidor:', error);
  }
}

// Ejecutar el inicio del servidor
startServer();
