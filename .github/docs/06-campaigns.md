# 06 - Campaigns (manual-first)

## Endpoints
- `POST /campaigns` (`ADVERTISER`) crea campaña (estado inicial `DRAFT`)
- `GET /campaigns/:id` (`ADVERTISER`) detalle de campaña
- `GET /campaigns/inbox?limit&offset&status?` (`ADVERTISER`) lista campañas propias (incluye datos del canal)
- `POST /campaigns/:id/request-publish` (`ADVERTISER`) solicita publicación a OPS (requiere pago `SUCCEEDED`)

### Pago (Stripe / mock dev)
- `POST /payments/intent` (`ADVERTISER`) crea payment intent (idempotente)
- `GET /payments/:campaignId` (`ADVERTISER`) estado del pago
- Webhook: `POST /payments/webhook` (Stripe) cambia campaña a `SUBMITTED` al confirmar pago

### OPS (operación)
- `GET /campaigns/ops/requests` (`OPS`) lista solicitudes (audit log)
- `PATCH /campaigns/:id/publish` (`OPS`) programa y publica (valida pago `SUCCEEDED`)

Transiciones inválidas devuelven `409`.

Smoke:
```bash
bash ./scripts/campaigns_check.sh
```

## Estados
`CampaignStatus`: `DRAFT`, `READY_FOR_PAYMENT`, `PAID`, `SUBMITTED`, `READY`, `PUBLISHED`, `DISPUTED`, `COMPLETED`, `REFUNDED`.
