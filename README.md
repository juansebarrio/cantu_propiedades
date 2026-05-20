# Cantú Propiedades · Tablero operativo

Sistema interno de gestión para Cantú Propiedades, inmobiliaria boutique en Coghlan, Buenos Aires.
Construido por **JS80 · Estudio de soluciones digitales**.

## Qué hace

- Tablero único de operaciones (pipeline de propiedades, leads, visitas).
- Carga rápida de leads desde cualquier canal.
- Confirmación automática de visitas por WhatsApp.
- Reporte PDF mensual a dueños, enviado automático el día 1.

## Stack

- **App:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Mensajería:** WhatsApp Business API (Cloud API de Meta)
- **Mail:** Resend
- **PDFs:** WeasyPrint (Python, basado en el sistema de propuestas de JS80)
- **Hosting:** Vercel

## Estructura

```
app/         · Next.js App Router · pantallas y API routes
components/  · UI reutilizable
lib/         · Lógica de negocio (no-UI): clientes Supabase, wrappers de servicios
supabase/    · Migrations y seed
reportes/    · Generador Python de PDFs mensuales
docs/        · Toda la documentación viva del proyecto
design/      · Identidad, wireframes, mockups
```

## Arrancar en local

> Pendiente · se completa después de inicializar Next.js y Supabase CLI.

```bash
# pnpm install
# cp .env.example .env.local  → completar con credenciales reales (ver docs/credenciales.md)
# pnpm dev
```

## Documentación

- [`docs/brief.md`](docs/brief.md) · brief original del cliente
- [`docs/modelo-datos.md`](docs/modelo-datos.md) · esquema de datos
- [`docs/decisiones.md`](docs/decisiones.md) · log de decisiones técnicas
- [`docs/runbook.md`](docs/runbook.md) · operación: deploy, backups, restore
- [`docs/handover.md`](docs/handover.md) · documento de entrega al cliente

## Equipo

- **Juan Segundo Barrio** · diseño, desarrollo, contacto con cliente · contacto@js80.studio
- **Julián Sancholuz** · diseño, desarrollo

---

JS80 · *De la idea al negocio funcionando.*
