# 04 - Auth y roles

Variables relevantes:
- `JWT_SECRET`
- `JWT_EXPIRES_IN` (default `7d`)
- `PASSWORD_PEPPER` (opcional)

## Endpoints
- `POST /auth/register`
- `POST /auth/login`
- `GET /me`

Smoke:
```bash
bash ./scripts/auth-smoke.sh
```
