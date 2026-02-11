# Configuración de Stripe

## Variables de entorno
- STRIPE_SECRET_KEY: clave secreta (sk_test_... en test).
- STRIPE_WEBHOOK_SECRET: secreto del endpoint del webhook (whsec_...).
- DATABASE_URL: conexión a Postgres en producción/staging.
- ALLOWED_ORIGINS: lista separada por comas de orígenes permitidos para CORS.
- PORT_API: puerto de la API (por defecto 4000).
- Desactiva USE_PGMEM en producción.

## Pasos
1. Copia .env.example a .env y rellena valores.
2. Arranca Postgres y crea la base de datos.
3. Inicia la API:
   - Desarrollo: USE_PGMEM=1 npm run dev -w apps/api
   - Producción: npm run build -w apps/api && npm run start -w apps/api
4. En Stripe, crea un endpoint webhook apuntando a /payments/webhook.
5. Prueba el flujo:
   - POST /auth/login
   - POST /payments/intent
   - Recibir webhook payment_intent.succeeded
   - GET /payments/:campaignId
6. Para refund y release, usa:
   - POST /payments/refund
   - POST /payments/release
