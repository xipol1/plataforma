# Plan por fases

## Fase 2: modelos + controladores core (backend)

- Normalizar `User/Usuario` (schema, responses, tokens, conexión DB)
- Implementar modelos mínimos: `Channel`, `Campaign`, `Transaction`, `TrackingEvent`
- Implementar controladores mínimos: `channelController`, `campaignController`, `transactionController`, `trackingController`
- Implementar rutas reales y retirar 501 módulo por módulo
- Unificar respuesta API a `{ success: true, data: ... }` para endpoints implementados

## Fase 3: frontend marketplace real

- Eliminar mocks en consumo API y apuntar a backend real
- Vistas mínimas: Login/Register, Dashboard, Listado/Crear Canal, Crear Campaña
- Arreglar rutas en `src/routes/AppRoutes.jsx`
- Revisar estructura/alias Vite y mover código fuera de `src/` a una ubicación consistente

## Fase 4: tests + CI

- Tests mínimos backend: auth (registro/login), health, contratos de error
- Tests mínimos frontend: navegación y autenticación (smoke)
- Configurar CI (lint + test + build)

## Fase 5: hardening + deploy

- Endurecer CORS/orígenes por entorno
- Rate limiting real por IP/usuario
- Sanitización/validación de inputs end-to-end
- Observabilidad mínima (logs estructurados, requestId)
- Deploy (Render/Vercel) con variables de entorno coherentes
