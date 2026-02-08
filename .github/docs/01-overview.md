# 01 - Overview

Plataforma MVP manual-first para marketplace de anuncios en canales cerrados (Telegram first).

## Stack
- Frontend: Next.js (`/apps/web`)
- API: Express + TypeScript (`/apps/api`)
- DB: PostgreSQL (remote-first, Docker opcional)

## URLs por defecto
- Web: http://localhost:3000
- API: http://localhost:4000
- Health: http://localhost:4000/health

## Integraciones (base)
- `GET /meta/providers`: capacidades por proveedor de canal.
- `POST /campaigns/quote`: cotizador de comisión inspirado en la lógica externa.
