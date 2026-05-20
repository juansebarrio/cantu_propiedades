# Log de decisiones técnicas

Una entrada por decisión. La idea: que en 6 meses uno pueda leer este archivo y entender por qué hicimos lo que hicimos.

Formato:
```
## YYYY-MM-DD · Título de la decisión
**Contexto:** qué problema estábamos resolviendo
**Decisión:** qué elegimos
**Alternativas consideradas:** qué descartamos y por qué
**Consecuencias:** qué implica esto a futuro
```

---

## 2026-05-20 · Stack base del proyecto

**Contexto:** Tablero operativo para inmobiliaria boutique, 3 usuarios, integraciones con WhatsApp y mail, reportes PDF mensuales.

**Decisión:**
- **Frontend:** Next.js 14 con App Router + TypeScript + Tailwind.
- **Backend:** Supabase (Postgres + Auth + RLS). Sin server propio.
- **Mensajería:** WhatsApp Business API (Meta Cloud API · sin Twilio en el medio).
- **Mail:** Resend.
- **PDFs:** WeasyPrint en Python (reutilizamos el sistema interno de propuestas JS80).
- **Hosting:** Vercel.

**Alternativas consideradas:**
- *Twilio para WhatsApp:* descartado por costo y porque Meta Cloud API es directo.
- *Server propio (Node + Express + Postgres self-hosted):* descartado por costo operativo y mantenimiento. Supabase resuelve auth, DB y RLS de una.
- *Puppeteer para PDFs:* descartado porque WeasyPrint ya está validado en JS80.

**Consecuencias:**
- Toda la lógica corre en Vercel + Supabase. No hay servidor que mantener.
- El generador de PDFs corre como cron job · necesita un endpoint Vercel que dispare un job Python (o que llame a una edge function de Supabase con WeasyPrint).
- El cliente queda atado a estos servicios. Si alguno cambia precios o se cae, lo absorbemos en el retainer.

---

## 2026-05-26 · RLS por fila + filtrado por columna en la app

**Contexto:** El modelo de datos define que la administrativa (Carolina) no ve `notas_internas` ni `acuerdo_especial` de los dueños, y el socio operativo (Martín) no ve `acuerdo_especial`. Postgres no tiene column-level security simple.

**Decisión:** RLS se aplica solo a nivel fila. Todos los usuarios activos ven los registros que les corresponden. El filtrado por columna se hace en el cliente Supabase: las queries se centralizan en `lib/supabase/queries/*.ts` y cada función incluye solo las columnas que el rol actual puede leer.

**Alternativa considerada:** Vistas de Postgres materializadas por rol. Descartada por complejidad para una app interna de 3 usuarios.

**Consecuencias:** El acceso a datos sensibles depende de que el código respete las funciones centralizadas. Una query directa con `select('*')` desde una pantalla nueva podría filtrar datos. Mitigación: ESLint rule (próxima vuelta) que prohíba el wildcard sobre las tablas con datos sensibles.
