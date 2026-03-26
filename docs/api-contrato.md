# Contrato API (MVP actual)

## Auth
### POST `/api/auth/login`
Request:
```json
{ "email": "user@example.com", "password": "Password123" }
```
Response 200:
```json
{ "success": true, "token": "jwt", "user": { "id": "...", "rol": "advertiser" } }
```

## Campaigns
### GET `/api/campaigns`
- Auth: Bearer (`advertiser` o `admin`).
- Response: `{ success, data: Campaign[] }`

### GET `/api/campaigns/:id`
- Auth: Bearer (`advertiser/admin`).

### POST `/api/campaigns`
Request:
```json
{ "titulo": "Campaña Q2", "descripcion": "texto", "presupuesto": 500 }
```
Response 201:
```json
{ "success": true, "data": { "id": "cmp-*", "estado": "DRAFT" } }
```

### POST `/api/campaigns/:id/publish`
- Auth: `advertiser/admin` (owner o admin).
- Requiere campaña en `SUBMITTED`.

### GET `/api/campaigns/:id/click`
- Público.
- Incrementa tracking enriquecido de campañas `PUBLISHED` (referrer, device, país, UTM, visitor hash único, histórico reciente).

### GET `/api/campaigns/:id/tracking`
- Auth: `advertiser/admin` (owner o admin).
- Devuelve resumen de tracking (`totalClicks`, `uniqueVisitors`, `byDay`, `byReferrer`, `byDevice`, `byCountry`, `byUtm*`, `recentEvents`).

## Transacciones
### GET `/api/transacciones`
- Auth: Bearer.
- Response: `{ success, data: Transaction[] }`

### POST `/api/transacciones/checkout`
Request:
```json
{ "campaignId": "cmp-..." }
```
Response 201: transacción `pending` con `paymentIntentId` y `checkoutUrl` de Stripe (modo MVP).

### POST `/api/transacciones`
Request:
```json
{ "monto": 120, "moneda": "EUR", "referencia": "order-1001" }
```
- Si `referencia` ya existe para el mismo usuario, devuelve 200 con `duplicate: true`.

### POST `/api/transacciones/webhook`
- Público (MVP).
- Idempotencia por `body.id` (o hash del payload si falta).
- Con `payment_intent.succeeded`: marca transacción como `paid` y campaña como `SUBMITTED`.

## Anuncios (MVP)
### GET `/api/anuncios`
### POST `/api/anuncios`
### GET `/api/anuncios/:id`
### PUT `/api/anuncios/:id`
### DELETE `/api/anuncios/:id`
- Auth: `advertiser/admin`.
- Owner-only salvo admin.

## Notifications (MVP)
### GET `/api/notifications`
### POST `/api/notifications`
### PUT `/api/notifications/:id/leer`
- Auth: Bearer.

## Files (MVP)
### GET `/api/files`
### POST `/api/files`
### GET `/api/files/:id`
### DELETE `/api/files/:id`
- Auth: Bearer.
- Owner-only salvo admin.
