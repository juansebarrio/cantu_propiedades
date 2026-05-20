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
