# 07 - Tracking y stats

## Redirect tracking
- `GET /r/:campaignId` (302 siempre)
- Audita intento con `TrackingClick.isValid` e `invalidReason`
- Razones: `DUPLICATE|OUT_OF_WINDOW|CAMPAIGN_INACTIVE|RATE_LIMIT|NONE`

## Click válido
- Campaña en `PUBLISHED`
- `now` en ventana `[startAt, endAt]`
- No duplicado por `campaignId+ip+userAgent` en 60s (configurable)

## Pixel (vistas y conversiones)
- `GET /t/view/:campaignId.gif` registra una vista (TrackingEvent `VIEW`)
- `GET /t/conv/:clickId.gif?type=CONVERSION&value=123&currency=USD` registra una conversión asociada a un click

## Stats
- `GET /tracking/stats/:campaignId`
- Devuelve agregados en ventana (por defecto 30d): `total`, `valid`, `invalid`, `views`, `conversions`, y `reasons[]`.

Smoke:
```bash
bash ./scripts/tracking_check.sh
```
