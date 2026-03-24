const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AdFlow API',
      version: '1.0.0',
      description: 'API Pública de AdFlow. Permite gestionar autenticación, canales y campañas.',
    },
    servers: [
      {
        url: '/',
        description: 'Servidor API Principal'
      },
      {
        url: '/api/v1/integrations',
        description: 'Servidor API (Integraciones)'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./routes/*.js', './modules/integrations/routes.integrations.js'], // Ruta a los archivos con anotaciones
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
