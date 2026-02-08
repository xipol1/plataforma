# 09 - Análisis de unión con `xipol1/me`

Repositorio comparado: `https://github.com/xipol1/me.git`.

## Resultado ejecutivo

Sí, **se puede hacer una unión parcial**, pero **no conviene un merge directo de código** en el estado actual.

Motivos principales:
- Arquitecturas distintas (nuestro backend: TypeScript + Prisma + PostgreSQL; repo externo: JavaScript + Mongoose + MongoDB).
- El repo externo parece prototipo/incompleto (referencias a carpetas `config/` y `routes/` no presentes en el root).
- Hay solapamiento funcional (auth/canales/campañas/pagos), pero con modelos de datos diferentes.

## Comparación técnica rápida

| Área | Plataforma actual | `xipol1/me` | Recomendación |
|---|---|---|---|
| Backend | Express + TypeScript (`apps/api`) | Express + JS (`server.js`) | Mantener nuestro backend, no reemplazar. |
| Persistencia | Prisma + PostgreSQL | Mongoose + MongoDB | No mezclar DB engines en MVP; conservar Postgres. |
| Frontend | Next.js app router (`apps/web`) | Componentes React sueltos (`*Dashboard.jsx`, `AuthPage.jsx`, `LandingPage.jsx`) | Reusar ideas UI, migrar a componentes Next tipados. |
| Tracking | `/r/:campaignId` + anti-fraude básico | No equivalente maduro visible | Mantener implementación actual. |
| Integraciones canales | Telegram-first en dominio | Archivos de integración `telegram.js`, `whatsapp.js`, `discord.js`, `instagram.js` | Extraer conceptos a capa de proveedores. |
| Comisiones/pagos | Estado base en campañas | `sistema_comisiones.js` con reglas configurables | Portar lógica como servicio aislado en TS. |

## Qué sí conviene unir (faseable)

1. **Motor de comisiones configurable**
   - Tomar la idea de `sistema_comisiones.js`.
   - Implementar en `apps/api/src` como módulo tipado y testeable.

2. **Abstracción de proveedores de canal**
   - Definir interfaz única (`ChannelProvider`) y adapters por canal.
   - Empezar con Telegram (ya foco del MVP) y dejar WhatsApp/Discord/Instagram como `feature flags`.

3. **Documentación funcional**
   - Incorporar conceptos operativos útiles del repo externo (manuales de anunciantes/creadores) en docs internas, no como fuente de verdad de código.

## Qué NO conviene unir ahora

- Copiar `server.js` o `docker-compose.yml` del repo externo tal cual.
- Introducir MongoDB junto a PostgreSQL en esta etapa.
- Migrar componentes React sueltos directamente sin adaptación a Next.js + estructura del monorepo.

## Plan de unión recomendado (3 PRs)

### PR-A: Base de extensión
- Crear contrato de proveedores (`ChannelProvider`).
- Registrar proveedor Telegram actual detrás de contrato.
- Agregar tests unitarios del contrato.

### PR-B: Comisiones
- Implementar `CommissionService` en TypeScript con reglas configurables por canal/tipo anuncio.
- Exponer cálculo en endpoint interno o en flujo de creación de campaña.
- Agregar pruebas de bordes (mínimo, máximo, tipos desconocidos).

### PR-C: UI y operación
- Migrar ideas visuales de dashboards a páginas Next existentes.
- Añadir documentación de operación por rol (anunciante / admin de canal / OPS).

## Checklist de due diligence antes de portar código

- [ ] Verificar licenciamiento del repo externo.
- [ ] Revisión de seguridad de secretos/API keys hardcodeadas.
- [ ] Normalizar naming y dominio al vocabulario de este repo.
- [ ] Asegurar cobertura de tests mínima por módulo portado.

## Conclusión

La unión **viable** es por **extracción de ideas y módulos**, no por merge directo de repositorios.
