# 10 - UI y dashboards

Este documento resume las rutas UI principales y cómo se organiza la experiencia por rol.

## Rutas UI (Web)

### Público
- `/` Landing
- `/channels` Marketplace público de canales (solo `ACTIVE`)

### Privado (layout `/app/*`)
El layout privado valida el token en `localStorage`, consulta `GET /me` y redirige por rol a:
- `ADVERTISER` → `/app/advertiser`
- `CHANNEL_ADMIN` (Creator/Admin) → `/app/creator`
- `OPS` → `/app/ops`

Incluye un menú emergente con secciones por rol y badges dinámicos.

### Advertiser
- `/app/advertiser` Dashboard “Resumen” (ejecutivo)
- `/app/advertiser/new` Crear campaña
- `/app/advertiser/inbox` Mis campañas
- `/campaigns/inbox` Inbox de campañas (vista alternativa)
- `/campaigns/[id]` Detalle de campaña (pago, publicación, tracking)

### Creator/Admin
- `/app/creator` Dashboard “Centro de monetización”
- `/app/creator/inbox` Solicitudes pendientes (aceptar/rechazar/ver detalle)
- `/app/creator/campaigns/[id]` Detalle de solicitud/campaña (acciones + calendario)
- `/app/creator/channels` Mis canales (estado verificación + CTR medio)
- `/app/creator/precios` Gestión de precios/categoría/verificación
- `/app/creator/publicaciones` Calendario (próximas publicaciones)
- `/app/creator/kpis` KPIs agregados con selector de periodo
- `/app/creator/ingresos` Cobros y facturación (método de cobro + liquidaciones)
- `/app/creator/actividad` Actividad reciente (timeline)

### OPS
- `/app/ops` Panel operativo (solicitudes, aprobación/publicación, stats)

## Menú emergente (pop-up)

El menú muestra herramientas por rol y badges con pendientes:
- Advertiser: badge total de campañas no resueltas y desglose “pago vs revisión”.
- Creator/Admin: solicitudes pendientes, próximas publicaciones y pagos pendientes.

## Variables de entorno (Web)
- `NEXT_PUBLIC_API_URL` URL base de la API.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (opcional) para confirmar pagos con Stripe Elements en el detalle de campaña.

