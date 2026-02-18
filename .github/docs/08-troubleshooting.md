# 08 - Troubleshooting

- `DATABASE_URL is missing`: completar `.env`.
- `Postgres connection failed`: revisar credenciales/red/allowlist/SSL.
- `USE_DOCKER_DB=1 but docker is not installed`: instalar Docker o usar DB remota.
- Next.js en Windows (OneDrive): `EBUSY: resource busy or locked` en `apps/web/.next`
  - Causa típica: OneDrive/antivirus bloquea archivos del build incremental.
  - Fix rápido: parar `apps/web dev`, borrar `apps/web/.next` y relanzar.
  - Fix definitivo: mover el repo fuera de OneDrive o excluir `.next` de sincronización/antivirus.
