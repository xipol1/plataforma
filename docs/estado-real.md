# Estado real del repositorio

## 1) Resumen ejecutivo

Repositorio **activo y en transiciÃ³n**: el MVP backend+frontend funciona para `health`, `auth`, `channels`, `campaigns`, `transacciones`, `anuncios`, `notifications` y `files`, mientras varios mÃ³dulos de dominio siguen en modo placeholder `501 NOT_IMPLEMENTED`.

## 2) Backend (estado por mÃ³dulos)

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
  "message": "MÃ³dulo pendiente"
}
```

## 3) Frontend

El enrutado principal usa estructura actual en `src/ui/*` (landing, auth y dashboard). No depende de `src/legacy` para rutas activas del MVP.

## 4) Calidad y validaciÃ³n

Estado actual de scripts:
- `npm run lint` âœ…
- `npm test` âœ…
- `npm run build` âœ…

Existe suite smoke (`tests/smoke.test.js`) cubriendo:
- health checks,
- auth validation,
- campaigns demo,
- transacciones demo.

## 5) Variables de entorno mÃ­nimas

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
1. Faltan modelos/controladores de dominio para mÃ³dulos que hoy responden 501.
2. Persistencia implementada en JSON local para MVP; falta migraciÃ³n total a DB por mÃ³dulo.

### P1
1. Endurecer observabilidad y trazabilidad para producciÃ³n.
2. Completar cobertura de tests mÃ¡s allÃ¡ de smoke (unit/integration por mÃ³dulo).

### P2
1. Cerrar brecha entre mÃ³dulos MVP y dominio completo de marketplace.
