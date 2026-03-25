# Estado real del repositorio

## 1) Resumen ejecutivo

Repositorio **activo y en transición**: el MVP backend+frontend funciona para `health`, `auth`, `channels`, `campaigns` y `transacciones`, mientras varios módulos de dominio siguen en modo placeholder `501 NOT_IMPLEMENTED`.

## 2) Backend (estado por módulos)

### Operativo (MVP)
- `GET /health`
- `GET /api/health`
- `/api/auth/*` y `/auth/*`
- `/api/channels/*` y `/channels/*`
- `/api/campaigns/*` y `/campaigns/*`
- `/api/transacciones/*`

### Parcial / pendiente (placeholder 501 uniforme)
- `/api/canales/*`
- `/api/anuncios/*`
- `/api/notifications/*`
- `/api/files/*`
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
2. Persistencia real de negocio todavía incompleta (parte del MVP usa datos demo).

### P1
1. Endurecer observabilidad y trazabilidad para producción.
2. Completar cobertura de tests más allá de smoke (unit/integration por módulo).

### P2
1. Cerrar brecha entre módulos MVP y dominio completo de marketplace.
