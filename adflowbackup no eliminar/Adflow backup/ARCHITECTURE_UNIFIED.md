# ARCHITECTURE_UNIFIED (Adflow Backup)

Este documento unifica el entendimiento real del código existente (backend + frontend + servicios) y marca duplicados, huecos y lo necesario para un marketplace funcional end-to-end.

## 1) Resumen ejecutivo

- Stack principal: Node.js + Express + MongoDB (Mongoose) + Vite/React (frontend).
- Conceptos reales en código: **Canal**, **Anuncio** (actúa como “campaña”), **Transacción** (wallet/reserva/completado), **Estadísticas/Tracking**, **Notificaciones**, **Archivos**, **Integraciones**.
- Problema principal: existe un subárbol duplicado casi completo (**plataforma_repo/**) en paralelo al árbol principal; además hay desalineación “docs vs rutas reales” (menciones a `/api/v1/...` que no corresponden al montaje actual).

## 2) Estructura completa del proyecto (carpetas + propósito)

Raíz: [Adflow backup](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/)

### Backend (API + dominio)

- [server.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/server.js): bootstrap del servidor y conexión a BD.
- [app.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/app.js): Express app, middlewares de seguridad, mounting de rutas.
- [config/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/config): config general + conexión/índices BD.
- [middleware/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/middleware): auth, rate limiting, validación.
- [routes/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes): routers Express agrupados por recurso.
- [controllers/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers): handlers; lógica de orquestación.
- [models/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models): schemas de Mongoose.
- [services/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services): reglas de negocio e integraciones (publicación, scoring, email, etc.).
- [integraciones/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/integraciones): conectores (Telegram/Discord/WhatsApp + pagos Stripe/PayPal en el backup).
- [modules/integrations/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/modules/integrations): “Partner API” externa montada en `/api/v1/integrations`.
- [templates/emails/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/templates/emails): plantillas email.
- [mockups/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/mockups): HTMLs sueltos de pantallas (no app navegable).

### Frontend (UI)

App React/Vite en la misma raíz del proyecto:
- Entradas: [index.html](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/index.html), [main.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/main.jsx), [App.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/App.jsx).
- UI reutilizable: [components/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/components), [layouts/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/layouts), [hooks/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/hooks), [styles/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/styles).
- Vistas top-level (legacy): [LandingPage.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/LandingPage.jsx), [AdminDashboard.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/AdminDashboard.jsx), [CreatorDashboard.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/CreatorDashboard.jsx), [AdvertiserDashboard.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/AdvertiserDashboard.jsx), [AuthPage.jsx](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/AuthPage.jsx).

## 3) Duplicados y lógica repetida (sin eliminar archivos)

### 3.1 Subárbol duplicado completo: plataforma_repo/

Existe un proyecto casi completo dentro de [plataforma_repo/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/plataforma_repo) que replica:
- backend (app.js/server.js/routes/services/middleware/config)
- frontend (src/**, styles, templates)

Impacto:
- Dos “fuentes de verdad” para los mismos módulos (auth, anuncios, canales, transacciones, etc.).
- Mezcla de implementaciones: en el subárbol hay handlers stub (p.ej. `501 No implementado` en su authController), mientras el árbol principal sí tiene implementación.

Recomendación de unificación (incremental, sin borrar):
- Definir explícitamente **un árbol canónico** para backend y frontend (el árbol principal del backup es el más completo).
- Mantener `plataforma_repo/` como referencia/legacy, pero evitar que sea usado por builds o despliegue.
- Cuando haya duplicados (ej. services/api.js, publicationService.js), consolidar a una sola ruta importada desde el árbol canónico y dejar wrappers/alias en el legacy (sin romper imports existentes).

### 3.2 Duplicación en UI

Componentes y layouts aparecen en:
- [components/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/components)
- `plataforma_repo/src/legacy/components/` y `plataforma_repo/src/ui/...`

## 4) Flujo real de datos (usuario → campaña → pago → publicación → tracking)

En el código actual, la “campaña” funcional es **Anuncio** (no existe un `Campaign` model en este backup principal).

### 4.1 Usuario (roles)

- Usuarios se crean/autentican por `/api/auth` (JWT).
- Roles esperados por el producto: “admin de canal/creador” y “anunciante”.

### 4.2 Canal (oferta)

- El admin de canal crea/gestiona canales vía `/api/canales`.
- El canal contiene plataforma, temática, precio y metadata para publicación/integraciones.

### 4.3 Campaña = Anuncio (demanda)

- El anunciante crea un anuncio asociado a un canal (`/api/anuncios`).
- El flujo de aceptación se implementa como “enviar a aprobación” y “responder aprobación”.

### 4.4 Pago (escrow simplificado en wallet)

Hay dos caminos que aparecen en el código:
- Reserva/activación del anuncio: se valida saldo, se reserva, se crea `Transacción`, y se pone el anuncio activo.
- Endpoint “pagar”: existe pero el “procesamiento real” depende del método; hay rutas con limitaciones de “método no soportado para procesamiento real”.

Interpretación:
- Se intenta modelar un escrow simple: el anunciante reserva/fondea; al completar se libera al creador.

### 4.5 Publicación

- La activación intenta publicar automáticamente vía `publicationService` y conectores por plataforma.

### 4.6 Tracking (simulado/real)

- Click tracking: endpoint público “t/:id” incrementa métricas y redirige.
- Conversion tracking: endpoint público “c/:id”.
- Parte de tracking está embebida en `Anuncio` (UTM/pixel/clicks, etc.) y en `Estadistica`.

## 5) Qué partes funcionan (en el árbol principal del backup)

- API montada en [app.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/app.js#L148-L160):
  - `/api/auth`
  - `/api/canales`
  - `/api/anuncios`
  - `/api/transacciones`
  - `/api/estadisticas`
  - `/api/notifications`
  - `/api/files`
  - `/api/lists`
  - `/api/v1/integrations` (Partner API)
- Dominio Mongoose con modelos base: Usuario, Canal, Anuncio, Transaccion, Estadistica, Notificacion, Archivo, Tarifa, ApiLog, ChannelList, Partner.
- Flujo de “anuncio → aprobación → activación/reserva → completar (liberar pago)” aparece implementado en controller de anuncios.
- Tracking de clicks y conversiones existe a nivel endpoint.

## 6) Qué partes están incompletas o desalineadas

- “Campaigns” no es un CRUD: [routes/campaigns.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/campaigns.js) sólo expone `/optimize` y `/launch-auto`.
- Desalineación docs vs backend real: documentación menciona `/api/v1/...` para auth/users/channels/ads/transactions/webhooks, pero el montaje real usa `/api/...` y no monta “users” ni “webhooks” como módulo completo.
- Duplicado `plataforma_repo/` contiene stubs de implementación (especialmente en auth), lo que puede confundir sobre el “estado real”.
- Pagos: existen dependencias de Stripe/PayPal y rutas de transacciones, pero no hay un módulo cerrado de escrow (hold/release/refund/disputa) consistente y claramente auditable.

## 7) Mapa claro (controllers / models / services / routes / frontend views)

### 7.1 Routes → Controllers (backend)

- Auth
  - [routes/auth.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/auth.js) → [controllers/authController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/authController.js)
- Canales
  - [routes/canales.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/canales.js) → [controllers/canalController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/canalController.js)
- Anuncios (campañas)
  - [routes/anuncios.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/anuncios.js) → [controllers/anuncioController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/anuncioController.js)
- Transacciones (wallet/pagos)
  - [routes/transacciones.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/transacciones.js) → [controllers/transaccionController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/transaccionController.js)
- Estadísticas
  - [routes/estadisticas.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/estadisticas.js) → [controllers/estadisticaController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/estadisticaController.js)
- Notificaciones
  - [routes/notifications.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/notifications.js) → [controllers/notificationController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/notificationController.js)
- Files
  - [routes/files.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/files.js) → [controllers/fileController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/fileController.js)
- Lists
  - [routes/lists.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/lists.js) → [controllers/channelListController.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/controllers/channelListController.js)
- Campaign tools (optimizador/auto-launch)
  - [routes/campaigns.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/routes/campaigns.js) → (servicios) optimizer/launch
- Partner API
  - [modules/integrations/routes.integrations.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/modules/integrations/routes.integrations.js) → [modules/integrations/controller.integrations.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/modules/integrations/controller.integrations.js) → [modules/integrations/service.integrations.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/modules/integrations/service.integrations.js)

### 7.2 Models (Mongo)

- [Usuario](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Usuario.js)
- [Canal](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Canal.js)
- [Anuncio](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Anuncio.js)
- [Transaccion](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Transaccion.js)
- [Estadistica](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Estadistica.js)
- [Notificacion](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Notificacion.js)
- [Archivo](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Archivo.js)
- [Tarifa](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Tarifa.js)
- [ApiLog](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/ApiLog.js)
- [ChannelList](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/ChannelList.js)
- [Partner](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/models/Partner.js)

### 7.3 Services (negocio / integraciones)

- Publicación: [services/publicationService.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services/publicationService.js)
- Channels: [services/channelService.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services/channelService.js)
- Notificaciones: [services/notificationService.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services/notificationService.js)
- Archivos: [services/fileService.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services/fileService.js)
- Email: [services/emailService.js](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services/emailService.js)
- Ranking/Scoring/Pricing: múltiples servicios en [services/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/services)
- Integraciones por plataforma/pagos: [integraciones/](file:///c:/Users/win/Desktop/plataforma/adflowbackup%20no%20eliminar/Adflow%20backup/integraciones)

### 7.4 Frontend views

El frontend actual está repartido entre pantallas “legacy” en raíz y componentes en `components/`/`layouts/`.

## 8) Qué falta para tener un marketplace funcional end-to-end

Lo siguiente NO se implementa aquí; es la estructura ideal esperada para completar el producto (incremental y compatible con lo existente).

### 8.1 Módulo Campaign (normalizar “Anuncio” vs “Campaña”)

Estado actual:
- “Campaña” existe como concepto; en DB es `Anuncio`.

Estructura ideal (sin romper lo existente):
- Mantener `Anuncio` como entidad persistente.
- Introducir una capa “Campaign” a nivel API (DTO) que mapea 1:1 a `Anuncio`.

Interfaces esperadas (conceptuales):
- `CampaignDTO`: `{ id, advertiserId, channelId, creative { text, link, assets[] }, pricing { amount, currency }, status, paymentStatus, publicationStatus, trackingSummary }`

Endpoints esperados:
- `GET /api/campaigns` (listar campañas del anunciante o del creador con filtros)
- `POST /api/campaigns` (crear campaña = crear anuncio)
- `GET /api/campaigns/:id`
- `POST /api/campaigns/:id/submit` (equivalente a enviar-aprobación)
- `POST /api/campaigns/:id/approve | /reject`
- `POST /api/campaigns/:id/publish` (marcar publicada / integrar)
- `POST /api/campaigns/:id/complete` (cierra y dispara payout)

### 8.2 Pagos escrow (hold → release/refund)

Estado actual:
- transacciones + wallet; “completar” acredita saldo al creador.

Estructura ideal:
- `PaymentIntent` (o `EscrowHold`): representa el dinero retenido del anunciante.
- `Payout`: representa la liberación al creador.
- `Refund/Dispute`: estado de devolución o disputa.

Estados esperados:
- hold: `created → funded → released|refunded|disputed`

Endpoints esperados:
- `POST /api/payments/escrow/hold` (inicia retención)
- `POST /api/payments/escrow/:id/fund` (simula/ejecuta pago)
- `POST /api/payments/escrow/:id/release` (libera al creador)
- `POST /api/payments/escrow/:id/refund` (devuelve al anunciante)
- `POST /api/webhooks/stripe` (si se usa Stripe real)

### 8.3 Publicación verificada y pruebas de entrega

Estructura ideal:
- “Proof of Publication” (URL, screenshot, messageId, timestamp, actorId).
- Auditoría y trazabilidad por campaña.

Endpoints esperados:
- `POST /api/campaigns/:id/publication/proof`
- `GET /api/campaigns/:id/publication/proof`

### 8.4 Tracking y reporting para marketplace

Estado actual:
- tracking de click/conversion y estadística básica.

Estructura ideal:
- Normalizar eventos: `click`, `view`, `conversion` con timestamps.
- Dashboard por rol con métricas agregadas por campaña/canal.

Endpoints esperados:
- `GET /api/tracking/campaigns/:id/summary`
- `GET /api/tracking/campaigns/:id/events` (paginated)

### 8.5 Marketplace UX (front)

Faltan pantallas coherentes tipo SaaS para:
- Home + búsqueda + cards
- Marketplace browse + filtro
- Ficha de canal
- Builder de campaña + checkout mock/real
- Dashboard anunciante (estados + métricas)
- Dashboard creador (solicitudes + aceptación + publicar + cobros)

## 9) Checklist de unificación (sin ejecutar cambios)

- Elegir árbol canónico (backend + frontend).
- Marcar `plataforma_repo/` como legacy y no referenciarlo desde builds.
- Resolver discrepancia de prefijos API (`/api` vs `/api/v1`) definiendo versión y redirecciones/aliases.
- Consolidar concepto “campaña” (API) vs “anuncio” (DB) con DTO y endpoints esperados.

