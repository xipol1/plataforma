# Estado real (Paso 1)

## Inventario

### Backend

**routes/**
- `routes/anuncios.js`
- `routes/auth.js`
- `routes/campaigns.js`
- `routes/canales.js`
- `routes/channels.js`
- `routes/estadisticas.js`
- `routes/files.js`
- `routes/lists.js`
- `routes/notifications.js`
- `routes/transacciones.js`

**controllers/**
- `controllers/authController.js`

**models/**
- `models/Usuario.js`

**services/**
- `services/SocialSyncService.js`
- `services/api.js`
- `services/authService.js`
- `services/campaignOptimizerService.js`
- `services/channelListService.js`
- `services/channelPerformanceService.js`
- `services/channelPricingService.js`
- `services/channelRankingService.js`
- `services/channelScoring.js`
- `services/channelService.js`
- `services/demoData.js`
- `services/emailService.js`
- `services/fileService.js`
- `services/launchCampaignService.js`
- `services/notificationService.js`
- `services/publicationService.js`
- `services/webhookService.js`

## Existe / Falta

### Controladores

| Controlador | Estado |
|---|---|
| `authController` | Existe (`controllers/authController.js`) |
| `anuncioController` | Existe (stub 501) |
| `canalController` | Existe (stub 501) |
| `campaignController` | Existe (stub 501) |
| `channelsController` | Existe (stub 501) |
| `estadisticaController` | Existe (stub 501) |
| `fileController` | Existe (stub 501) |
| `channelListController` | Existe (stub 501) |
| `notificationController` | Existe (stub 501) |
| `transaccionController` | Existe (stub 501) |

### Modelos

| Modelo | Estado |
|---|---|
| `Usuario` | Existe (`models/Usuario.js`) |
| `Canal` | Existe (`models/Canal.js`) |
| `Anuncio` | Existe (`models/Anuncio.js`) |
| `Notificacion` | Existe (`models/Notificacion.js`) |
| `Archivo` | Existe (`models/Archivo.js`) |
| `Estadistica` | Existe (`models/Estadistica.js`) |
| `ChannelList` | Existe (`models/ChannelList.js`) |
| `Partner` | Existe (`models/Partner.js`) |

## Rutas operativas vs no operativas

### Operativas

| Ruta | Estado |
|---|---|
| `GET /health` | 200 |
| `GET /api/health` | 200 |
| `/api/auth/*` | Montada desde `routes/auth.js` |
| `/auth/*` | Montada desde `routes/auth.js` |
| `/api/channels/*` | Operativa (MVP canales) |
| `/api/canales/*` | Alias de `/api/channels/*` |
| `/channels/*` | Alias de `/api/channels/*` |

### No operativas (deshabilitadas explícitamente)

Todas las rutas bajo los prefijos siguientes devuelven 501 JSON uniforme:

```json
{ "success": false, "code": "NOT_IMPLEMENTED", "module": "<modulo>", "message": "Módulo pendiente" }
```

| Prefijo | Módulo |
|---|---|
| `/api/canales` | `canales` |
| `/api/anuncios` | `anuncios` |
| `/api/transacciones` | `transacciones` |
| `/api/notifications` | `notifications` |
| `/api/files` | `files` |
| `/api/estadisticas` | `estadisticas` |
| `/api/campaigns` | `campaigns` |
| `/api/lists` | `lists` |
| `/campaigns` | `campaigns` |

## Roturas detectadas (previas al saneamiento)

### Imports a archivos inexistentes

**routes → controllers faltantes**
- `routes/anuncios.js` → `../controllers/anuncioController`
- `routes/canales.js` → `../controllers/canalController`
- `routes/campaigns.js` → `../controllers/campaignController`
- `routes/channels.js` → `../controllers/channelsController`
- `routes/estadisticas.js` → `../controllers/estadisticaController`
- `routes/files.js` → `../controllers/fileController`
- `routes/lists.js` → `../controllers/channelListController`
- `routes/notifications.js` → `../controllers/notificationController`
- `routes/transacciones.js` → `../controllers/transaccionController`

**services → models faltantes**
- `services/notificationService.js` → `../models/Notificacion`
- `services/fileService.js` → `../models/Archivo`
- `services/launchCampaignService.js` → `../models/Anuncio`, `../models/Canal`, `../models/Partner`
- `services/campaignOptimizerService.js` → `../models/Canal`, `../models/ChannelList`
- `services/channelListService.js` → `../models/ChannelList`
- `services/channelRankingService.js` → `../models/Canal`, `../models/Anuncio`
- `services/channelService.js` → `../models/Canal`
- `services/channelPerformanceService.js` → `../models/Anuncio`, `../models/Canal`
- `services/SocialSyncService.js` → `../models/Canal`, `../models/Anuncio`, `../models/Estadistica`

**services → integraciones faltantes**
**integraciones**
- `integraciones/telegram.js` existe
- `integraciones/whatsapp.js` existe
- `integraciones/discord.js` existe

### Exports usados pero no definidos (previo)

**middleware/auth.js**
- Se importaban `autorizarRoles`, `requiereEmailVerificado`, `verificarPropietario` pero no existían.

**middleware/rateLimiter.js**
- Se importaban `limitadorAPI` y `limitadorEndpoint` pero no existían.

**middleware/validarCampos.js**
- Se importaba `validarPaginacion` pero no existía.

## Variables de entorno requeridas (estado real)

### Backend

| Variable | Uso | Obligatoria |
|---|---|---|
| `MONGODB_URI` | Conexión a MongoDB (auth) | Sí, para login/registro |
| `JWT_SECRET` | Firma JWT (auth) | Sí, para endpoints protegidos |
| `PORT` | Puerto servidor | No (default 5000) |
| `NODE_ENV` | Logging/errores | No |

### Frontend

| Variable | Uso | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_API_URL` o `VITE_API_URL` | Base URL API | No (default `/api`) |

## Riesgos críticos

### P0
- La mayoría de módulos backend core no existen (controllers/models) y estaban rompiendo carga de rutas.
- Dependencias a `integraciones/*` ausentes rompen servicios si se llegan a requerir.
- Variables de entorno en documento objetivo (`DATABASE_URL`) no coinciden con implementación actual (Mongo + `MONGODB_URI`).

### P1
- Código legacy backend estaba acoplado a modelos no presentes; se aisló para evitar fallos al arrancar.
- Frontend legacy importa paths inexistentes (`src/legacy/*/services/api`).

### P2
- Existe mezcla de código frontend en `services/api.js` fuera de `src/` y con ESM; requiere saneamiento de estructura en fases posteriores.
