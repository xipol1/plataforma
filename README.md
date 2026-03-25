# Adflow · Plataforma de monetización de canales

Estado actual del proyecto: **MVP en construcción**.

Este repositorio contiene backend (Node/Express) + frontend (React/Vite) para un marketplace de canales (Telegram, Discord, WhatsApp, etc.).

---

## Estado real (hoy)

### ✅ Funcional
- Health checks:
  - `GET /health`
  - `GET /api/health`
- Autenticación base (`/api/auth/*` y `/auth/*`)
- Módulo `channels` mínimo operativo:
  - `GET /api/channels`
  - `GET /api/channels/:id`
- Módulo `campaigns` mínimo operativo (requiere auth advertiser):
  - `GET /api/campaigns`
  - `POST /api/campaigns`
  - `POST /api/campaigns/optimize`
  - `POST /api/campaigns/launch-auto`
- Landing page con tema oscuro/claro y navegación principal.

### ⚠️ Parcial / pendiente
- La mayoría de módulos de dominio siguen en modo placeholder (`501 NOT_IMPLEMENTED`):
  - `canales`, `anuncios`, `transacciones`, `notifications`, `files`, `estadisticas`, `lists`.
- Suite smoke de tests activa (`tests/smoke.test.js`).
- ESLint base activo (`npm run lint` operativo).

Para detalle completo, revisar:
- `docs/estado-real.md`
- `docs/plan-fases.md`

---

## Stack

### Backend
- Node.js + Express
- JWT + bcrypt
- Middleware de seguridad: helmet, cors, compression, rate limit

### Frontend
- React 18 + React Router 6
- Vite + TailwindCSS

---

## Requisitos
- Node.js >= 16
- npm >= 8

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

## Endpoints principales (estado actual)

### Salud
- `GET /health`
- `GET /api/health`

### Auth
- `POST /api/auth/registro`
- `POST /api/auth/login`
- Otros endpoints de auth existen pero varios aún están en implementación parcial.
- Política de password actual para registro/reset: mínimo 8 caracteres, con mayúscula, minúscula y número.

### Channels (módulo demo/temporal)
- `GET /api/channels`
- `GET /api/channels/:id`

### Módulos pendientes (respuesta uniforme)
Los módulos no implementados responden:

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
- Se agregó una base de ESLint (`.eslintrc.cjs`) para validar código del MVP.
- Se agregaron smoke tests en `tests/smoke.test.js` para `health` y `channels`.
- Checklist de release: `docs/release-checklist.md`.

---

## Roadmap corto
1. Implementar modelos y controladores de dominio (`Canal`, `Campana`, `Transaccion`, etc.).
2. Reemplazar placeholders `501` módulo por módulo.
3. Conectar frontend con endpoints reales (sin mocks).
4. Configurar ESLint y tests smoke de backend.
5. Endurecer despliegue/observabilidad para producción.

---

## Licencia
MIT.
