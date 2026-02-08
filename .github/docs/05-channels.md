# 05 - Channels (manual-first)

## Endpoints
- `POST /channels` (`CHANNEL_ADMIN`)
- `GET /channels` (público, solo `ACTIVE`)
- `GET /channels/:id` (si no `ACTIVE`, visible solo owner/OPS)
- `PATCH /channels/:id` (`OPS`)

## Preflight seguridad
```bash
bash ./scripts/preflight.sh
```
