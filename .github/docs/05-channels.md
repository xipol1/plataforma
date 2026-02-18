# 05 - Channels (manual-first)

## Endpoints
- `POST /channels` (`CHANNEL_ADMIN`)
- `GET /channels` (público, solo `ACTIVE`)
- `GET /channels/:id` (si no `ACTIVE`, visible solo owner/OPS)
- `PATCH /channels/:id` (`OPS`)

## Creator/Admin (self-service)
- `GET /channels/mine` (`CHANNEL_ADMIN`) lista canales del owner.
- `PATCH /channels/:id/self` (`CHANNEL_ADMIN`) edita `category`, `pricePerPost`, `engagementHint`.
- `POST /channels/:id/activate` (`CHANNEL_ADMIN`) verificación de propiedad (Telegram).
- `GET /creator/channel-metrics?window_days=7|30|90` métricas agregadas por canal (CTR/clicks/impresiones).

## Preflight seguridad
```bash
bash ./scripts/preflight.sh
```
