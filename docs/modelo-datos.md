# Modelo de datos · Cantú Propiedades

**Versión:** 0.2 · post-discovery
**Última revisión:** 26 de mayo de 2026
**Fuente:** `docs/discovery.md`

> Este documento describe el esquema de datos en lenguaje natural + diagrama. El SQL definitivo vive en `supabase/migrations/`.
> Convención: campos y tablas se escriben en **español rioplatense** (decisión del discovery), aunque mantenemos snake_case para compatibilidad con Postgres.

---

## 1 · Principios de diseño

1. **Tres niveles de permisos:** socia titular (Zulma) · socio operativo (Martín) · administrativa (Carolina).
2. **Datos confidenciales por registro:** algunos dueños y propiedades tienen información que solo ve Zulma. No es un esquema separado: es un flag `confidencial` + campos sensibles que se filtran por RLS.
3. **El sistema no es la única fuente de verdad.** Conviven canales humanos (grupo de WhatsApp con dueños, cuaderno de Martín) que el sistema reconoce pero no reemplaza.
4. **Lo que entra al sistema, queda inmutable** (audit log). Nada se borra duro; se marca como `archivado`.
5. **Quién cargó qué siempre se registra.** Cada movimiento queda con `creado_por` y `creado_en`. Carolina y Zulma necesitan saberlo.

---

## 2 · Entidades

### `usuarios`
Perfil extendido de los usuarios autenticados de Supabase (`auth.users`).

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | FK a `auth.users.id` |
| `nombre` | text | "Zulma Cantú", "Martín Larrea", "Carolina Méndez" |
| `rol` | enum | `socia_titular` · `socio_operativo` · `administrativa` |
| `email` | text | Login |
| `telefono` | text | Para auditoría · no se usa para auth |
| `activo` | bool | Default `true` · soft delete |
| `creado_en` | timestamptz | |

> Hay un solo `socia_titular` por sistema (Zulma). Ese rol es el que accede a los campos confidenciales.

---

### `duenos`
Persona o entidad que posee una o más propiedades. Recibe los reportes.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `nombre` | text | |
| `email` | text | |
| `telefono` | text | |
| `canal_preferido` | enum | `mail` · `whatsapp_pdf` · `llamada` · `no_contactar` |
| `frecuencia_reporte` | enum | `mensual` · `trimestral` · `on_demand` · `ninguna` |
| `en_grupo_whatsapp` | bool | Solo informativo · el sistema no postea ahí |
| `notas_internas` | text | Visible para `socia_titular` y `socio_operativo` (no para administrativa) |
| **`confidencial`** | bool | **Flag de privacidad reforzada · default `false`** |
| **`acuerdo_especial`** | text | **Solo visible para `socia_titular` (RLS) · texto libre con condiciones especiales** |
| `creado_por_id` | uuid | FK a `usuarios.id` |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

**Reglas de visibilidad:**
- `acuerdo_especial` se filtra por RLS: solo lo ve quien tenga `rol = socia_titular`.
- `notas_internas` se filtra por RLS: lo ven `socia_titular` y `socio_operativo`. Carolina ve el dueño pero esa columna le viene `null`.
- El resto de los campos los ven los tres roles.

---

### `propiedades`
Una unidad publicada o en gestión.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `direccion` | text | "Av. Congreso 3400, 5° B" |
| `tipo` | enum | `depto` · `casa` · `ph` · `local` · `oficina` · `cochera` · `terreno` |
| `operacion` | enum | `alquiler` · `venta` · `temporada` |
| `estado` | enum | `captada` · `publicada` · `con_visitas` · `con_oferta` · `reservada` · `cerrada` · `pausada` · `archivada` |
| `precio_actual` | numeric | |
| `moneda` | enum | `ars` · `usd` |
| `dueno_id` | uuid | FK a `duenos` |
| `descripcion_comercial` | text | El texto que sale en portales |
| `fotos` | jsonb | Array de URLs (storage de Supabase) |
| `fecha_captacion` | date | |
| **`confidencial`** | bool | Hereda del dueño · si el dueño es confidencial, la propiedad también |
| `notas_internas` | text | Visible para socios, no para administrativa |
| `creado_por_id` | uuid | FK a `usuarios` |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

> **Días "quieta":** se calcula a partir de `fecha_captacion` y la fecha de la última visita. Es uno de los datos que Zulma quiere ver en el tablero ("propiedades quietas hace más de 20 días").

---

### `portales_propiedad`
Estado de cada propiedad en cada portal donde está publicada.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `propiedad_id` | uuid | FK |
| `portal` | enum | `zonaprop` · `argenprop` · `mercadolibre` · `soloduenos` · `fb_marketplace` · `wsp_inmobiliarias_coghlan` |
| `estado_en_portal` | enum | `publicada` · `pausada` · `vencida` · `no_publicada` |
| `url_publicacion` | text | Si está publicada |
| `fecha_publicacion` | date | |
| `notas` | text | |
| `actualizado_en` | timestamptz | |

> Una propiedad puede tener múltiples filas (una por portal). Compuesta `(propiedad_id, portal)` debe ser única.

---

### `leads`
Persona que consultó por una propiedad o por una búsqueda.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `nombre` | text | |
| `telefono` | text | **Índice para detección de duplicados** |
| `email` | text | |
| `propiedad_id` | uuid | FK · **nullable** (puede ser un lead general "busco 2 amb en Villa Urquiza") |
| `canal_origen` | enum | `whatsapp_oficina` · `whatsapp_zulma` · `whatsapp_martin` · `mail` · `formulario_web` · `zonaprop` · `argenprop` · `mercadolibre` · `soloduenos` · `fb_marketplace` · `referido_zulma` · `wsp_inmobiliarias_coghlan` · `otro` |
| **`referido_por_dueno_id`** | uuid | **FK a `duenos` · solo poblado si `canal_origen = referido_zulma`** |
| `estado` | enum | `nuevo` · `contactado` · `con_visita` · `con_oferta` · `sin_interes` · `cerrado_exitoso` · `archivado` |
| `responsable_id` | uuid | FK a `usuarios` · quién lo atiende |
| `proxima_accion` | text | "Llamar para confirmar visita" |
| `fecha_proxima_accion` | timestamptz | |
| `notas_internas` | text | |
| `criterio_busqueda` | jsonb | Solo para leads sin propiedad asignada: zona, tipo, presupuesto, etc. |
| `creado_por_id` | uuid | FK |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

**Detección de duplicados (feature pedida por Carolina):**
- Al cargar un lead nuevo, antes de guardar, se hace una búsqueda por `telefono` y `email` normalizados.
- Si hay coincidencia, se muestra un modal: *"Este teléfono ya consultó por [propiedad X] hace [Y] días. ¿Es la misma persona?"*
- Si confirma, se asocia al lead existente como una **nueva consulta** sobre otra propiedad (ver `consultas_lead` abajo).

---

### `consultas_lead`
Cada vez que un lead consulta por una propiedad. Un lead puede tener múltiples consultas a lo largo del tiempo.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `lead_id` | uuid | FK |
| `propiedad_id` | uuid | FK |
| `fecha` | timestamptz | |
| `canal_origen` | enum | Igual que en `leads` |
| `notas` | text | |
| `creado_por_id` | uuid | FK |

> Esto resuelve el historial cross-propiedad que pidió Carolina.

---

### `visitas`
Una visita agendada, confirmada o realizada.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `lead_id` | uuid | FK |
| `propiedad_id` | uuid | FK |
| `responsable_id` | uuid | FK a `usuarios` · qué socio la hace |
| `fecha_agendada` | timestamptz | |
| `estado` | enum | `agendada` · `confirmada` · `realizada` · `cancelada` · `no_asistio` |
| `confirmacion_enviada_en` | timestamptz | Cuándo el sistema mandó el WhatsApp de confirmación |
| `confirmacion_respondida_en` | timestamptz | Cuándo el lead respondió "sí, voy" |
| `devolucion_prospecto` | text | **Texto libre · el corazón del reporte mensual** |
| `devolucion_cargada_por_id` | uuid | FK · típicamente Carolina (transcribiendo audio de Martín) |
| `devolucion_audio_url` | text | Opcional · si quedó archivado el audio original |
| `notas` | text | |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

> El campo `devolucion_prospecto` es lo que va al reporte mensual del dueño. Sin esto cargado, el reporte queda flaco.

---

### `comunicaciones`
Registro cronológico de interacciones con leads o dueños.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `tipo` | enum | `whatsapp_entrante` · `whatsapp_saliente` · `mail_entrante` · `mail_saliente` · `llamada` · `nota_interna` |
| `lead_id` | uuid | FK · nullable |
| `dueno_id` | uuid | FK · nullable |
| `contenido` | text | |
| `fecha` | timestamptz | |
| `registrada_por_id` | uuid | FK |

> Una comunicación pertenece a un lead **o** a un dueño, no a ambos a la vez. CHECK constraint en la DB para asegurarlo.

---

### `reportes_mensuales`
Reportes generados (y eventualmente enviados) a los dueños.

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK |
| `propiedad_id` | uuid | FK |
| `dueno_id` | uuid | FK |
| `periodo` | date | Primer día del mes (ej `2026-06-01`) |
| `estado` | enum | `borrador` · `listo_para_enviar` · `enviado` · `no_enviar` · `fallido` |
| **`nota_personalizada`** | text | **El párrafo libre que escribe Zulma cada mes · puede ir vacío** |
| `pdf_url` | text | URL en Supabase Storage |
| `canal_envio` | enum | `mail` · `whatsapp_pdf` · `llamada` · `ninguno` · hereda del `dueno.canal_preferido` al momento del envío |
| `enviado_a` | text | Mail o número de WhatsApp efectivo |
| `enviado_en` | timestamptz | |
| `error_envio` | text | Si `estado = fallido` |
| `creado_en` | timestamptz | |
| `actualizado_en` | timestamptz | |

**Flujo del reporte:**
1. Día 25 de cada mes: el sistema genera un borrador de cada reporte y notifica a Zulma.
2. Zulma revisa, edita la `nota_personalizada` de los reportes que quiere personalizar.
3. Día 1 del mes siguiente: el sistema envía todos los reportes en estado `listo_para_enviar` por el canal correspondiente.
4. Dueños con `frecuencia_reporte = ninguna` no aparecen.
5. Dueños con `canal_preferido = llamada` generan una tarea para Zulma, no un envío automático.

---

## 3 · Vista lógica · diagrama de relaciones

```
                        ┌─────────────┐
                        │  usuarios   │
                        └──────┬──────┘
                               │ (creado_por_id en todo)
                               ▼
┌──────────┐  1:N   ┌─────────────┐  1:N   ┌──────────────────┐
│  duenos  │◄──────►│ propiedades │◄──────►│ portales_propiedad│
└──────────┘        └──────┬──────┘         └──────────────────┘
     ▲                     │
     │                     │ 1:N
     │                     ▼
     │              ┌─────────────┐
     │ 1:N          │   visitas   │
     │              └──────┬──────┘
     │                     │ N:1
     │                     ▼
     │              ┌─────────────┐  1:N   ┌─────────────────┐
     │              │    leads    │◄──────►│ consultas_lead  │
     │              └──────┬──────┘         └─────────────────┘
     │                     │
     │                     │
     ▼                     ▼
   ┌────────────────────────────┐
   │      comunicaciones        │
   └────────────────────────────┘

   ┌──────────────────────────────┐
   │     reportes_mensuales       │ ←  propiedad_id, dueno_id
   └──────────────────────────────┘
```

---

## 4 · Reglas de visibilidad (RLS)

Las políticas de Row-Level Security en Supabase implementan estas reglas:

### Por rol

| Tabla | `socia_titular` (Zulma) | `socio_operativo` (Martín) | `administrativa` (Carolina) |
|---|---|---|---|
| `duenos` (campos generales) | ✅ todos | ✅ todos | ✅ todos |
| `duenos.notas_internas` | ✅ | ✅ | ❌ |
| `duenos.acuerdo_especial` | ✅ | ❌ | ❌ |
| `propiedades` (campos generales) | ✅ todas | ✅ todas | ✅ todas |
| `propiedades.notas_internas` | ✅ | ✅ | ❌ |
| `leads` / `visitas` / `consultas_lead` | ✅ | ✅ | ✅ |
| `comunicaciones` | ✅ | ✅ | ✅ |
| `reportes_mensuales` (lectura) | ✅ | ✅ | ✅ |
| `reportes_mensuales.nota_personalizada` (escritura) | ✅ | ❌ | ❌ |

### Por flag `confidencial`

Cuando un dueño tiene `confidencial = true`:
- Su `acuerdo_especial` solo lo lee Zulma.
- Sus `notas_internas` se ocultan también para Martín (no solo para Carolina).
- Aparece marcado con un ícono discreto en el tablero, solo para usuarios con permiso.

---

## 5 · Lo que el modelo NO resuelve

Decisiones explícitas de no-implementación tomadas en el discovery:

- **Grupo de WhatsApp con dueños:** queda manual, no se modela.
- **Operaciones "off the books" de Martín:** no entran al sistema.
- **Cuaderno de Martín:** convive con el sistema. La info entra por audio → transcripción de Carolina.
- **Transcripción automática de audio:** no en fase 1. Carolina lo hace a mano.
- **Tracking de mail abierto:** opcional, depende de qué soporte Resend al momento del setup.
- **Comparador entre propiedades / portfolio analytics:** fase 2 si el cliente lo pide.

---

## 6 · Cambios pendientes a confirmar en la segunda llamada

- [ ] ¿La nota personalizada de Zulma en el reporte tiene límite de caracteres? Propongo 600.
- [ ] ¿Cómo manejamos un dueño con propiedades confidenciales y no-confidenciales? Hoy el flag es por dueño y se hereda. Tal vez convenga moverlo a nivel propiedad.
- [ ] ¿Quién carga las propiedades nuevas? Carolina dice que ella, pero Martín capta. Definir el flujo.
- [ ] Lista final de portales que efectivamente usan vs. abandonados.
- [ ] Tono de los mensajes automáticos de WhatsApp (confirmación de visita). Zulma quiere escribirlos personalmente.

---

*Próximo paso técnico: traducir esto a migrations de Supabase en `supabase/migrations/` con las RLS policies escritas. Pendiente para la siguiente vuelta.*
