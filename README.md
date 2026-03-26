# Adflow · Plataforma de monetización de canales

Estado actual del proyecto: **MVP en evolución**.

Repositorio con backend (Node/Express) + frontend (React/Vite) para marketplace de espacios en canales y comunidades.

---

## Estado real (hoy)

### ✅ Funcional
- Health checks:
  - `GET /health`
  - `GET /api/health`
- Autenticación base (`/api/auth/*` y `/auth/*`).
- Frontend con landing, login/register y dashboard base.
- Módulo `channels` demo:
  - `GET /api/channels`
  - `GET /api/channels/:id`
- Módulos de flujo marketplace montados en backend:
  - `/api/canales/*`
  - `/api/campaigns/*`
  - `/api/transacciones/*`
  - `/api/estadisticas/*`
  - `/api/lists/*`

### ⚠️ Parcial / pendiente
- `anuncios` y `notifications` siguen en respuesta uniforme `NOT_IMPLEMENTED`.
- Parte del flujo de negocio depende de MongoDB (`MONGODB_URI`); sin DB responde `503` en rutas que requieren persistencia real.
- Documentación histórica aún puede quedar por detrás de cambios recientes de ramas en integración.

Para detalle completo:
- `docs/estado-real.md`
- `docs/plan-fases.md`

---

## Stack

### Backend
- Node.js + Express
- JWT + bcrypt
- Helmet, CORS, compression, morgan, rate limit
- MongoDB + Mongoose

### Frontend
- React 18 + React Router 6
- Vite + TailwindCSS

---

## Requisitos
- Node.js >= 16
- npm >= 8
- MongoDB (recomendado para flujo completo backend)

---

## Instalación rápida

```bash
npm install
cp .env.example .env
```

### Variables mínimas recomendadas

```env
MONGODB_URI=mongodb://localhost:27017/plataforma_monetizacion
JWT_SECRET=tu_secreto
JWT_REFRESH_SECRET=tu_refresh_secreto
PORT=5000
FRONTEND_URL=http://localhost:3000
```

---

## Ejecución

### Backend (dev)

```bash
npm run dev
```

### Frontend (dev)

```bash
npm run frontend:dev
```

### Full (backend + frontend)

```bash
npm run dev:full
```

### Build frontend

```bash
npm run build
```

---

## Endpoints principales

### Salud
- `GET /health`
- `GET /api/health`

### Auth
- `POST /api/auth/registro`
- `POST /api/auth/login`

### Channels demo
- `GET /api/channels`
- `GET /api/channels/:id`

### Marketplace backend (en evolución)
- `canales`: `/api/canales/*`
- `campaigns`: `/api/campaigns/*`
- `transacciones`: `/api/transacciones/*`
- `estadisticas`: `/api/estadisticas/*`
- `lists`: `/api/lists/*`

### Módulos en placeholder
- `anuncios`: `/api/anuncios/*`
- `notifications`: `/api/notifications/*`

Respuesta uniforme:

```json
{
  "success": false,
  "code": "NOT_IMPLEMENTED",
  "module": "<modulo>",
  "message": "Módulo pendiente"
}
```

---

## Calidad y validación

Comandos útiles:

```bash
npm run build
node -e "require('./app'); console.log('app_loaded')"
npm test
npm run lint
```

Notas:
- Existe smoke test activo en `tests/smoke.test.js`.
- Existe suite de estructura/API en `tests/marketplace.test.js`.
- Si incluyes carpetas de backup dentro del repo, ESLint puede escanearlas y fallar por archivos externos al core.

---

## Roadmap corto
1. Completar módulos `anuncios` y `notifications`.
2. Consolidar contratos de API y alinear documentación técnica.
3. Endurecer validaciones, observabilidad y CI para producción.

---

## Licencia
MIT.
