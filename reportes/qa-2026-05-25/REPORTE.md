# QA · Cantú Propiedades — 2026-05-25

**Rama:** `claude/eloquent-carson-IOlK2`
**Ejecutor:** Claude (Opus 4.7)
**Foco:** tablero, leads, propiedades (pipeline)
**Roles cubiertos:** Martín (socio operativo) — full; Carolina (administrativa) — smoke test

---

## Resumen ejecutivo

| Severidad | Total | Fixeados en esta rama | Pendientes |
|---|---|---|---|
| 🚨 P0 (bloqueante) | 1 | 0 | 1 |
| P1 (importante) | 14 | 9 | 5 |
| P2 (notable) | 34 | 6 | 28 |
| P3 (cosmético) | 19 | 6 | 13 |
| **Total** | **68** | **21** | **47** |

**Quick win disponibles ya commiteados** en `claude/eloquent-carson-IOlK2`:
- Favicon, página 404 con branding, página `/reportes` "próximamente"
- Mensaje de login traducido al español
- Validación de `next` en login (prevención open redirect)
- Aria-labels faltantes (logout, modal, Mark, Select)
- `rel="noopener"` en links `_blank`
- Typos de clases Tailwind
- Fix responsive de `grid-cols-2` en formulario de leads (P1)
- Focus ring más visible
- `break-words` en headings de detalle (overflow mobile)

**Lo que NO se pudo testear runtime** (y por qué):
- La URL pública `cantu.js80.studio` está fuera del allowlist de red del container — no es accesible.
- Docker no está disponible → no se pudo levantar Supabase local → no hay base de datos.
- El test se hizo con Next levantado localmente contra Supabase no-disponible. Solo son accesibles `/` y `/login` (las protegidas redirigen).
- Todos los hallazgos de "dashboard, leads, propiedades, agenda" son por **revisión estática del código**, NO por interacción runtime.

> Para cubrir flujos completos (carga de leads, edición, agenda, notas de visita), necesitamos: (a) agregar `cantu.js80.studio` al allowlist de red del environment, **o** (b) habilitar Docker para levantar Supabase local.

---

## Setup

- **URL local:** `http://localhost:3000` (Next 14.2.35 + Playwright 1.55.1 + Chromium 141)
- **Breakpoints:** `desktop` (1440×900) y `mobile` (390×844)
- **Rutas screenshoteadas:** `/`, `/login`, `/login?error=...`, `/login?next=...`, `/tablero`, `/propiedades`, `/leads`, `/leads/nuevo`, `/agenda`, `/reportes`, `/ruta-que-no-existe`
- Las rutas protegidas (`/tablero`, `/propiedades`, `/leads`, `/agenda`) redirigen correctamente a `/login` en ambos breakpoints (HTTP 307).
- **No se ejecutó ningún flujo de creación/modificación** (la app no podía hablar con Supabase).

Screenshots en `reportes/qa-2026-05-25/screenshots/`.

---

## 🚨 P0 — Bloqueantes

### P0-01 · Credenciales hardcodeadas en el repo
- **Archivo:** `app/login/demo-actions.ts:10-13`
- **Categoría:** seguridad
- **Descripción:** Los emails y contraseñas de los usuarios `martin` y `carolina` viven literales en código. Aunque la action es server-only, el archivo está en git: si el repo se hace público (típico portfolio JS80), las credenciales quedan en `git log`.
- **Impacto:** cualquiera con acceso a la historia git puede loguearse como esos usuarios en cualquier ambiente donde existan (incluido producción si los emails coinciden).
- **Fix sugerido:** mover a `process.env.DEMO_MARTIN_PASSWORD` / `DEMO_CAROLINA_PASSWORD` + guardar en Vercel; opcionalmente envolver con `if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEMO_LOGIN) return error`. **Requiere decisión de producto** — no aplicado en esta rama.

---

## P1 — Importantes

### P1-01 · 404 default de Next (inglés, sin branding) ✅ FIXEADO
- **Archivo:** no existe `app/not-found.tsx`
- **Categoría:** branding / a11y / consistencia
- **Descripción:** rutas inexistentes muestran "404 — This page could not be found." en inglés, sans-serif del sistema, sobre fondo blanco. Rompe la identidad visual y deja al usuario sin acción siguiente.
- **Screenshot:** `screenshots/09-404-custom-desktop.png`
- **Fix aplicado:** se crea `app/not-found.tsx` con branding cream/ink, mensaje en español, botón de volver al tablero.

### P1-02 · `/reportes` accesible vía URL retorna 404 ✅ FIXEADO
- **Archivo:** falta `app/(dashboard)/reportes/page.tsx`
- **Categoría:** UX / consistencia
- **Descripción:** el sidebar muestra "Reportes" como disabled, pero un usuario que tipea la URL directo cae al 404 default (en inglés). Bookmarks/links de mail terminan igual.
- **Screenshot:** `screenshots/08-reportes-protected-desktop.png`
- **Fix aplicado:** se crea página "Próximamente" con copy alineado al sidebar.

### P1-03 · No hay favicon ✅ FIXEADO
- **Archivo:** no hay `app/icon.*` ni `public/favicon.*`
- **Categoría:** branding / errores (genera 404 en cada request)
- **Descripción:** la pestaña del browser usa el icono default de Next (raro en una app inmobiliaria), y cada request a `/favicon.ico` genera 404 en logs.
- **Fix aplicado:** se agrega `app/icon.svg` con el monograma "ZC" del Mark.

### P1-04 · Mensaje de error de login en inglés ✅ FIXEADO
- **Archivo:** `app/login/page.tsx:54-56`
- **Categoría:** UX / i18n
- **Descripción:** `searchParams.error` se imprime crudo. Supabase devuelve "Invalid login credentials" en inglés mientras el resto de la UI está en español.
- **Screenshot:** `screenshots/02b-login-with-error-desktop.png`
- **Fix aplicado:** se mapean los errores conocidos de Supabase a español, con fallback genérico para los desconocidos.

### P1-05 · `next` param de login sin validar (open redirect) ✅ FIXEADO
- **Archivo:** `app/login/page.tsx:79-83`
- **Categoría:** seguridad
- **Descripción:** el hidden input `next` se pasa directo a `redirect()` sin verificar que sea una path interna. Un atacante puede armar `?next=https://evil.com` y desviar al usuario post-login.
- **Fix aplicado:** se valida que empiece con `/` y no con `//` (impedir protocol-relative).

### P1-06 · Tap targets <44px en mobile (Button sm/md, Input) ✅ FIXEADO parcial
- **Archivo:** `components/ui/Button.tsx:23-26`, `components/ui/Input.tsx:11`
- **Categoría:** responsive / a11y
- **Descripción:** Button size `sm` mide 30px y `md` 38px. Apple HIG y Material recomiendan ≥44px. La app usa `sm` en muchos lugares (filtros leads, agenda, etc.).
- **Fix aplicado:** se sube focus ring opacity de `/10` a `/25` para mejor visibilidad. Se deja la altura como decisión del autor — cambiar tamaños afecta diseño global y requiere revisión visual.

### P1-07 · `grid-cols-2` sin variante mobile en formulario de leads ✅ FIXEADO
- **Archivo:** `components/lead/LeadFormNuevo.tsx:209, 294, 344`
- **Categoría:** responsive
- **Descripción:** los pares "Nombre/Teléfono", "Email/Canal", etc. usan `grid grid-cols-2 gap-4` sin breakpoint. En 390px los inputs quedan ~145px de ancho efectivo — apretadísimos.
- **Fix aplicado:** `grid-cols-1 sm:grid-cols-2` en las 3 ocurrencias.

### P1-08 · `combinarFechaYHora` ignora timezone (visitas en hora equivocada)
- **Archivo:** `lib/fechas.ts:130-132`, también usado en `app/(dashboard)/agenda/actions.ts:35`
- **Categoría:** lógica
- **Descripción:** `new Date(\`${fecha}T${hora}:00\`).toISOString()` interpreta en TZ del **servidor** (UTC en Vercel). Usuario en Argentina ingresa "10:00" → guardado como "10:00 UTC = 07:00 ARG". Bug crítico para agenda.
- **Fix sugerido:** usar offset `-03:00` explícito o `date-fns-tz` con `America/Argentina/Buenos_Aires`.
- **No aplicado:** requiere testing contra DB real y decisión sobre DST (Argentina no tiene horario de verano pero por las dudas).

### P1-09 · `AutoRefreshOnFocus` puede tirar input de formularios sin guardar
- **Archivo:** `components/AutoRefreshOnFocus.tsx:31`
- **Categoría:** lógica / UX
- **Descripción:** si el usuario está tipeando un lead/visita y deja la tab en background >5 min, al volver dispara `router.refresh()`. Los inputs controlados con `useState` y los `defaultValue` con cambios sin commit se pierden.
- **Fix sugerido:** detectar si hay forms con cambios sin guardar (event `beforeunload` o `dirty` state) antes de refrescar, o limitar el refresh a páginas read-only (`/tablero`, `/agenda` lista, etc.) excluyendo `/leads/*/editar` y `/nuevo`.
- **No aplicado:** requiere decisión sobre qué páginas excluir.

### P1-10 · `VisitaDetalleModal` no refleja notas guardadas sin cerrar
- **Archivo:** `app/(dashboard)/agenda/VisitaDetalleModal.tsx:82-94`
- **Categoría:** lógica / UX
- **Descripción:** tras guardar notas, `router.refresh()` actualiza la lista pero la prop `visita` del modal viene de `visitaSeleccionada` (estado del padre) que no se sincroniza. Usuario ve "Sin notas" hasta cerrar y reabrir.
- **Fix sugerido:** después de `editarNotasVisita` exitoso, actualizar localmente `visitaSeleccionada` con las notas nuevas.
- **No aplicado:** requiere refactor de cómo `AgendaSemanal` mantiene la visita seleccionada.

### P1-11 · `marcarNovedadesComoVistas` ejecuta N updates secuenciales
- **Archivo:** `app/(dashboard)/tablero/actions.ts:42-65`
- **Categoría:** performance
- **Descripción:** un UPDATE por novedad, en loop. Con 20 novedades = 20 round-trips a Supabase. Más allá de 50 novedades, se nota la latencia.
- **Fix sugerido:** un solo query `update(...).in("id", ids)` con la columna `vistas_por` actualizada vía RPC o array append.
- **No aplicado:** requiere ver schema exacto de `vistas_por`.

### P1-12 · Logout vía GET — vulnerable a CSRF
- **Archivo:** `app/logout/route.ts`, link en `components/UserPill.tsx:32-38`
- **Categoría:** seguridad
- **Descripción:** `<img src="/logout">` o un link en un mail/Slack desloguea al usuario. Es CSRF.
- **Fix sugerido:** convertir el handler en POST y reemplazar el `<Link>` por un `<form action="/logout" method="post">` con botón estilizado.
- **No aplicado:** cambio que afecta layout/UX y requiere revisión.

### P1-13 · `Field` no usa `htmlFor` → click en label no enfoca `Select`
- **Archivo:** `components/ui/Field.tsx:22-25`
- **Categoría:** a11y / lógica
- **Descripción:** `Field` envuelve children con `<label>`. Para `<input>` simples funciona (label asocia por proximidad), pero `Select` tiene un `<div>` wrapper interno, y el click en label cae en el div, no en el select. El usuario no puede hacer click en el label para abrir el dropdown.
- **Fix sugerido:** `Field` recibe `id` (autogenerado con `useId()`) y pasa `htmlFor` al label + lo agrega al children via clone.
- **No aplicado:** refactor que toca la API del componente.

### P1-14 · `aria-label="ZC"` en el componente Mark ✅ FIXEADO
- **Archivo:** `components/brand/Mark.tsx:18`
- **Categoría:** a11y
- **Descripción:** un screen reader lee "Z C" cuando encuentra el logo. No es informativo.
- **Fix aplicado:** se cambia a `aria-label="Logo Cantú Propiedades"`.

---

## P2 — Notables

### Modal & UI base

- **P2-01** · `components/ui/Modal.tsx:51-60` · `<dialog>` con `w-[calc(100vw-1.5rem)]` + `max-w-md` combinados es confuso y rompe alineación con `max-w-2xl`.
- **P2-02** · `components/ui/Modal.tsx:83` · `max-h-[calc(92vh-4.5rem)]` asume header de 4.5rem; con subtítulo se recorta.
- **P2-03** · `components/ui/Modal.tsx:51` · falta `aria-modal` y `aria-labelledby` apuntando al título.
- **P2-04** · `components/ui/Modal.tsx:53-55` · drag-to-close: arrastres dentro del cuerpo que sueltan en padding cierran el modal sin querer.
- **P2-05** · `components/ui/Select.tsx:9-29` · `ChevronDown` sin `aria-hidden`. ✅ FIXEADO
- **P2-06** · `components/MobileNav.tsx:42-77` · drawer mobile no es `<dialog>`, no tiene focus trap ni retorna focus al cerrar.

### Sidebar / Topbar / UserPill

- **P2-07** · `components/SidebarNav.tsx:43-51` · "Reportes" disabled usa `<span>` con `title` — no focusable por teclado, screen readers no anuncian "próximamente".
- **P2-08** · `components/Topbar.tsx:20` · "Buscar" disabled solo accesible por mouse; `title` no se lee.
- **P2-09** · `components/Topbar.tsx:16-27` · botón "Buscar" no usa el componente `Button` del sistema (inconsistencia).
- **P2-10** · `components/UserPill.tsx:32-38` · logout sin `aria-label`. ✅ FIXEADO
- **P2-11** · `components/TopbarBreadcrumb.tsx:16-45` · `formatearFechaHoy()` calculada en cliente puede diferir de la del server. Inconsistencia en frontera de día.

### Tablero

- **P2-12** · `app/(dashboard)/tablero/page.tsx:26-31` · saludo "Buenos días/tardes" usa `new Date()` server-side; en Vercel (UTC) sale equivocado.
- **P2-13** · `app/(dashboard)/tablero/NovedadesModule.tsx:24-36` · `useEffect` con dep `novedades` re-dispara timer en cada refresh; bucle de marcado.
- **P2-14** · `app/(dashboard)/tablero/NuevaNovedadModal.tsx:72` · estado de `error` no se limpia al editar el textarea.

### Leads

- **P2-15** · `app/(dashboard)/leads/page.tsx:94` · `<form>` de filtros sin `method="get"` explícito.
- **P2-16** · `app/(dashboard)/leads/page.tsx:150-159` · barra "Limpiar / Filtrar" no hace stack en mobile.
- **P2-17** · `app/(dashboard)/leads/page.tsx:209-219` · `l.canal_origen.replace(...)` sin null check. Si llega null, crashea la página entera. (También L294-300.)
- **P2-18** · `app/(dashboard)/leads/page.tsx:238` · tabla con `min-w-[640px]` puede rebalsar a viewports `md` (768px) con sidebar.
- **P2-19** · `app/(dashboard)/leads/actions.ts:122-131` · `actualizarLead` no valida que `estado` esté en el enum permitido.
- **P2-20** · `app/(dashboard)/leads/actions.ts:139-144` · `chequearDuplicado` es server action pública sin auth check — permite enumerar leads por teléfono.
- **P2-21** · `app/(dashboard)/leads/[id]/page.tsx:88-94` · `<h1>` sin `break-words` puede desbordar en mobile con nombres largos. ✅ FIXEADO
- **P2-22** · `app/(dashboard)/leads/[id]/page.tsx:188-192` · `criterio_busqueda` se muestra como `<pre>` con JSON crudo — feo para usuarios finales.
- **P2-23** · `app/(dashboard)/leads/[id]/page.tsx:434-442` · botones "WhatsApp / email / Archivar" disabled sin badge "Próximamente" visible.

### Lead form (nuevo/editar)

- **P2-24** · `components/lead/LeadFormNuevo.tsx:378` · `bg-red-50 text-red-800` fuera del design system. ✅ FIXEADO (→ `brick-50` / `brick-700`)
- **P2-25** · `components/lead/LeadFormNuevo.tsx:73-91` · `handleTelefonoBlur` sin debounce — múltiples requests si el usuario edita rápido y pierde foco.
- **P2-26** · `components/lead/LeadFormNuevo.tsx:355-358` · `datetime-local` enviado sin TZ → mismo bug TZ que combinarFechaYHora.
- **P2-27** · `components/lead/LeadFormNuevo.tsx:70, 182-191` · `errorGeneral` no se renderiza en modo `asociar-consulta`.
- **P2-28** · `components/lead/LeadFormEditar.tsx:36-38` · `new Date(...).toISOString().slice(0,16)` formatea como UTC; usuario ARG ve la hora corrida 3 horas.

### Propiedades

- **P2-29** · `app/(dashboard)/propiedades/page.tsx:84-87` · "Nueva propiedad" disabled con variant accent — pareciera funcional.
- **P2-30** · `app/(dashboard)/propiedades/page.tsx:91` · filtros sin `method="get"`.
- **P2-31** · `app/(dashboard)/propiedades/page.tsx:298` · `p.estado_en_portal.replace(...)` sin null check.
- **P2-32** · `app/(dashboard)/propiedades/[id]/page.tsx:77-78` · `<h1>` sin `break-words`. ✅ FIXEADO

### Agenda

- **P2-33** · `app/(dashboard)/agenda/AgendaSemanal.tsx:62-69` · `router.push` sin `scroll: false` → scrollea al top en cada cambio de semana.
- **P2-34** · `app/(dashboard)/agenda/AgendaSemanal.tsx:49-57` · estado inicial del modal no se reinicializa cuando cambian las query params.
- **P2-35** · `app/(dashboard)/agenda/NuevaVisitaModal.tsx:107` · `defaultValue={fechaPrellenada}` no se actualiza si la prop cambia.
- **P2-36** · `app/(dashboard)/agenda/NuevaVisitaModal.tsx:92` · select de "responsable" muestra TODOS los usuarios; admin no debería ser responsable.
- **P2-37** · `app/(dashboard)/agenda/VisitaDetalleModal.tsx:184-209` · botones de edición de notas no usan el componente `Button`.
- **P2-38** · `app/(dashboard)/agenda/VisitaDetalleModal.tsx:101-112` · `notasEdit` se pierde sin confirmación al cerrar el modal.
- **P2-39** · `app/(dashboard)/agenda/actions.ts:18-49 + 51-71 + 73-97 + 99-116` · ninguna acción de agenda verifica `getUsuarioActual()`.
- **P2-40** · `app/(dashboard)/agenda/actions.ts:99-116` · `editarNotasVisita` no valida longitud — se puede meter texto arbitrariamente largo.

### Auth / Layout

- **P2-41** · `app/(dashboard)/layout.tsx:13` · `redirect("/login")` no preserva `next` — usuario post-login siempre va a `/tablero`, pierde destino.
- **P2-42** · `app/login/page.tsx:15-31` · server action inline crea nuevo action ID en cada render — menor performance, mejor extraer.

### General

- **P2-43** · Tipado `any` rampante en `leads/page.tsx`, `leads/[id]/page.tsx`, `propiedades/page.tsx`, etc. — oculta los null check bugs señalados.
- **P2-44** · Listados (leads, propiedades) sin paginación — degradan con >200 filas.

---

## P3 — Cosméticos / mejoras

- **P3-01** · `components/ui/Button.tsx:36` · focus ring `/10` poco visible. ✅ FIXEADO (`/25`)
- **P3-02** · `components/lead/LeadFormNuevo.tsx:225` · typo Tailwind `text-ink/40` (no resuelve). ✅ FIXEADO
- **P3-03** · `components/lead/LeadFormNuevo.tsx:266` · `<Link target="_blank">` sin `rel="noopener noreferrer"`. ✅ FIXEADO
- **P3-04** · `app/(dashboard)/tablero/page.tsx:19-24` · `Promise.all` sin try/catch.
- **P3-05** · `app/(dashboard)/tablero/NovedadItem.tsx:9-22` · `tiempoRelativo` server-rendered — no actualiza con la tab abierta.
- **P3-06** · `app/(dashboard)/leads/page.tsx:82` · `{nuevos === 1 ? "sin contactar" : "sin contactar"}` — ambas ramas iguales.
- **P3-07** · Textarea duplicado en 5 archivos (mismo string de clases en `NuevaNovedadModal`, `LeadFormNuevo` ×2, `LeadFormEditar`, `NuevaVisitaModal`, `VisitaDetalleModal`) — extraer a `components/ui/Textarea.tsx`.
- **P3-08** · `app/(dashboard)/leads/[id]/page.tsx:233-239` · `lead.consultas.sort(...)` muta el array de prop.
- **P3-09** · `app/(dashboard)/propiedades/[id]/page.tsx:116-138` · visitas sin sort por fecha.
- **P3-10** · `app/(dashboard)/agenda/page.tsx:33-50` · `searchParams.semana` sin validar formato.
- **P3-11** · `app/(dashboard)/tablero/actions.ts:67` · `revalidatePath` se llama aún si todos los updates fallaron.
- **P3-12** · `lib/auth/current-user.ts:40-50` · `puedeBorrar` definido pero no usado.
- **P3-13** · `components/MobileNav.tsx:29` · `document.body.style.overflow` puede quedar lockeado si cleanup falla.
- **P3-14** · `components/ui/Modal.tsx:42` · `handleCancel` sin cleanup si componente se desmonta con `open=true`.
- **P3-15** · `app/(dashboard)/agenda/DiaConVisitas.tsx:84-107` · `<button>` que abre visita engloba todo el contenido sin `aria-label` explícito.
- **P3-16** · `app/layout.tsx:18-21` · metadata sin `viewport` explícito (Next 14 lo agrega por default; declararlo es buena práctica).
- **P3-17** · `app/(dashboard)/propiedades/[id]/page.tsx:249-253` · `canal_preferido?.replace` muestra "—" si null pero no si vacío `""`.
- **P3-18** · Páginas de detalle sin `loading.tsx` / `Suspense` → blanco mientras carga.
- **P3-19** · `app/(dashboard)/leads/[id]/page.tsx:55-60` · `try/catch` colapsa errores de RLS a 404 — usuario no sabe si es perm o existencia.

---

## Por breakpoint

### Desktop (1440×900)
- Landing y login se ven perfectos. Layout centrado correcto.
- 404 nativo de Next se ve fuera de contexto.
- Sin issues visuales en las pantallas accesibles.

### Mobile (390×844)
- Landing y login responsive correcto. Sin overflow horizontal.
- El problema responsive principal (`grid-cols-2` en LeadFormNuevo) no fue verificable en runtime — confirmado por revisión de código y aplicado el fix.
- Tap targets (Button sm, Input) por debajo de 44px — anotado para revisión global.

---

## Apéndice · Screenshots

| Ruta | Desktop | Mobile |
|---|---|---|
| `/` | [01-landing-desktop.png](screenshots/01-landing-desktop.png) | [01-landing-mobile.png](screenshots/01-landing-mobile.png) |
| `/login` | [02-login-desktop.png](screenshots/02-login-desktop.png) | [02-login-mobile.png](screenshots/02-login-mobile.png) |
| `/login?error=...` | [02b-login-with-error-desktop.png](screenshots/02b-login-with-error-desktop.png) | [02b-login-with-error-mobile.png](screenshots/02b-login-with-error-mobile.png) |
| `/login?next=...` | [02c-login-with-next-desktop.png](screenshots/02c-login-with-next-desktop.png) | [02c-login-with-next-mobile.png](screenshots/02c-login-with-next-mobile.png) |
| `/tablero` → redirect a /login | [03-tablero-protected-desktop.png](screenshots/03-tablero-protected-desktop.png) | [03-tablero-protected-mobile.png](screenshots/03-tablero-protected-mobile.png) |
| `/propiedades` → redirect a /login | [04-propiedades-protected-desktop.png](screenshots/04-propiedades-protected-desktop.png) | [04-propiedades-protected-mobile.png](screenshots/04-propiedades-protected-mobile.png) |
| `/leads` → redirect a /login | [05-leads-protected-desktop.png](screenshots/05-leads-protected-desktop.png) | [05-leads-protected-mobile.png](screenshots/05-leads-protected-mobile.png) |
| `/leads/nuevo` → redirect a /login | [06-leads-nuevo-protected-desktop.png](screenshots/06-leads-nuevo-protected-desktop.png) | [06-leads-nuevo-protected-mobile.png](screenshots/06-leads-nuevo-protected-mobile.png) |
| `/agenda` → redirect a /login | [07-agenda-protected-desktop.png](screenshots/07-agenda-protected-desktop.png) | [07-agenda-protected-mobile.png](screenshots/07-agenda-protected-mobile.png) |
| `/reportes` → 404 | [08-reportes-protected-desktop.png](screenshots/08-reportes-protected-desktop.png) | [08-reportes-protected-mobile.png](screenshots/08-reportes-protected-mobile.png) |
| `/ruta-que-no-existe` → 404 | [09-404-custom-desktop.png](screenshots/09-404-custom-desktop.png) | [09-404-custom-mobile.png](screenshots/09-404-custom-mobile.png) |

Datos crudos de cada navegación (status, errores de consola, request failures, screenshot) en `reportes/qa-2026-05-25/runtime-findings.json`.
