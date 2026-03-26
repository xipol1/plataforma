# Estado real del repositorio

## 1) Resumen ejecutivo

Repositorio **activo y en transición**: el MVP backend+frontend funciona para `health`, `auth`, `channels`, `campaigns`, `transacciones`, `anuncios`, `notifications` y `files`, mientras varios módulos de dominio siguen en modo placeholder `501 NOT_IMPLEMENTED`.

## 2) Backend (estado por módulos)

### Operativo (MVP)
- `GET /health`
- `GET /api/health`
- `/api/auth/*` y `/auth/*`
- `/api/channels/*` y `/channels/*`
- `/api/campaigns/*` y `/campaigns/*`
- `/api/transacciones/*`
- `/api/anuncios/*`
- `/api/notifications/*`
- `/api/files/*`

### Parcial / pendiente (placeholder 501 uniforme)
- `/api/canales/*`
- `/api/estadisticas/*`
- `/api/lists/*`

Respuesta uniforme actual:
```json
{
  "success": false,
  "code": "NOT_IMPLEMENTED",
  "module": "<modulo>",
  "message": "Módulo pendiente"
}
```

## 3) Frontend

El enrutado principal usa estructura actual en `src/ui/*` (landing, auth y dashboard). No depende de `src/legacy` para rutas activas del MVP.

## 4) Calidad y validación

Estado actual de scripts:
- `npm run lint` ✅
- `npm test` ✅
- `npm run build` ✅

Existe suite smoke (`tests/smoke.test.js`) cubriendo:
- health checks,
- auth validation,
- campaigns demo,
- transacciones demo.

## 5) Variables de entorno mínimas

- `MONGODB_URI`
- `JWT_SECRET`

Recomendadas:
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 6) Riesgos abiertos

### P0
1. Faltan modelos/controladores de dominio para módulos que hoy responden 501.
2. Persistencia implementada en JSON local para MVP; falta migración total a DB por módulo.

### P1
1. Endurecer observabilidad y trazabilidad para producción.
2. Completar cobertura de tests más allá de smoke (unit/integration por módulo).

### P2
1. Cerrar brecha entre módulos MVP y dominio completo de marketplace.

## 7) Flujo comercial MVP (validado)

- `DRAFT` (creación de campaña)
- `pago Stripe` (`POST /api/transacciones/checkout` + webhook `payment_intent.succeeded`)
- `SUBMITTED` (actualización automática tras pago exitoso)
- `PUBLISHED` (`POST /api/campaigns/:id/publish`)
- Tracking de clics enriquecido (`GET /api/campaigns/:id/click`) + métricas (`GET /api/campaigns/:id/tracking`) con referrer, device, país, UTM, únicos y series por día
