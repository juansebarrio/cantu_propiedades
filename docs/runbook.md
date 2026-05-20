# Runbook · operación

Cómo se opera el sistema en producción. Por completar a medida que el proyecto avanza.

## Deploy

> Por completar al setear Vercel.

- Branch `main` → producción automática
- Branch `staging` → preview en staging.cantu-propiedades.vercel.app
- PRs generan preview deploy automático

## Backups

> Por completar al configurar Supabase.

- Supabase hace backups automáticos diarios (plan Pro · 7 días de retención).
- Backup semanal manual a Google Drive de JS80 (script automatizado).

## Restore

> Por documentar después del primer backup test.

## Monitoreo

> Por configurar:
> - UptimeRobot pingeando la app
> - Sentry para errores de runtime
> - Alerta si el reporte mensual no se envía el día 1
