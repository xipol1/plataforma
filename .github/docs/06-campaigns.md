# 06 - Campaigns (manual-first)

## Endpoints
- `POST /campaigns`
- `GET /campaigns`
- `GET /inbox/campaigns`
- `GET /campaigns/:id`
- `GET /ops/campaigns`
- `POST /campaigns/:id/submit`
- `POST /ops/campaigns/:id/mark-paid`
- `POST /campaigns/:id/confirm-published`
- `POST /ops/campaigns/:id/complete`
- `POST /campaigns/quote` (estimación de comisión por canal/tipo anuncio)

Transiciones inválidas devuelven `409`.

Smoke:
```bash
bash ./scripts/campaigns_check.sh
```
