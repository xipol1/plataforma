# 07 - Tracking y stats

## Redirect tracking
- `GET /r/:campaignId` (302 siempre)
- Audita intento con `TrackingClick.isValid` e `invalidReason`
- Razones: `DUPLICATE|OUT_OF_WINDOW|CAMPAIGN_INACTIVE|RATE_LIMIT`

## Click válido
- Campaña en `PUBLISHED`
- `now` en ventana `[startAt, endAt]`
- No duplicado por `campaignId+ip+userAgent` en 60s (configurable)

## Stats
- `GET /campaigns/:id/stats`
- Métricas válidas: `valid_clicks_total`, `valid_clicks_last_24h`, `first_valid_click_at`, `last_valid_click_at`
- `execution_status`: `EXECUTED_OK|EXECUTED_NO_CLICKS|INVALID_TRAFFIC`

Smoke:
```bash
bash ./scripts/tracking_check.sh
```
