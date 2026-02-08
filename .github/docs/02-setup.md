# 02 - Setup y ejecución

## Requisitos
- Node.js 20+
- npm 10+
- Docker + Compose (solo modo Docker)

## Modo rápido (DB remota)
1. Crear DB PostgreSQL (Neon/Supabase/Railway).
2. Copiar `.env.example` a `.env`.
3. Completar `DATABASE_URL`.
4. Dejar `USE_DOCKER_DB=0`.
5. Ejecutar:
   ```bash
   npm run doctor
   npm run dev
   ```

## Modo Docker (opcional)
1. Verificar Docker (`docker --version`).
2. En `.env`: `USE_DOCKER_DB=1`.
3. Ejecutar:
   ```bash
   npm run dev
   ```

## Doctor
```bash
npm run doctor
```
Valida Node >= 20, `DATABASE_URL` y `SELECT 1`.
