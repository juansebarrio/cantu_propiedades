# UI Kit · Vuelta 3 · Pantallas existentes con el kit completo aplicado

Cerrar el círculo: refactorizar `/propiedades` (lista + ficha) y `/leads` (lista + ficha + form de creación + form de edición) para que cada elemento use el lenguaje visual del kit Cantú.

## Contexto

Vueltas 1 y 2 ya están aplicadas:
- **Vuelta 1** (`060cae2`): tokens + componentes UI base (`Button`, `Badge`, `Card`, `Input`, `Select`, `Field`, `Mark`, `Wordmark`)
- **Vuelta 2**: chrome del layout (Sidebar + Topbar) + Login + landing pública

Esta vuelta refactoriza las pantallas internas para que las **tablas se vean editoriales**, las **fichas tengan jerarquía tipográfica clara**, los **forms usen el patrón `<Field>` consistentemente** y los **precios/números usen mono tabular o display serif** según corresponda.

## Principio rector

El kit Cantú quiere que cada pantalla se sienta **como una página de catálogo de inmobiliaria boutique**, no como un dashboard SaaS. Eso significa:

- **Direcciones de propiedades y nombres de leads en `font-display`** (Instrument Serif) — son los protagonistas
- **Estados en `<Badge>`** con dot y tono del kit — visualmente discretos pero distinguibles
- **Precios en `font-display tabular-nums`** — el "USD 220.000" se ve editorial
- **Labels en `font-mono uppercase tracking-widest text-ink-500`** — eso ya es el patrón del `<Field>`
- **Headers de tabla en mono uppercase** — no como bold sans default
- **Padding generoso, hover sutil** — no compactar como una hoja de cálculo

Si una pantalla no se siente así al terminar, **algo del refactor faltó**.

---

## Vocabulario común · patrones que se repiten

Antes de tocar pantallas, internalizar estos seis patrones que vas a usar en todas:

### Patrón A · Header de página

```tsx
<header className="mb-8 flex items-end justify-between gap-6 border-b border-cream-200 pb-6">
  <div>
    <h1 className="font-display text-4xl text-ink-900 tracking-tight">
      Propiedades
    </h1>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
      {total} propiedades · {publicadas} publicadas
    </p>
  </div>
  <div className="flex items-center gap-2">
    <Button variant="accent">Nueva propiedad</Button>
  </div>
</header>
```

### Patrón B · Label-style (lo que ya hace `<Field>`)

Cuando necesites un label sin estar dentro de un `<Field>` (ej. en una ficha mostrando metadata):

```tsx
<span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
  Captada el
</span>
```

### Patrón C · Precio o número grande

```tsx
<div className="font-display text-3xl tabular-nums tracking-tight text-ink-900">
  USD <span className="num">220.000</span>
</div>
```

Para precios chicos (en filas de tabla):

```tsx
<span className="font-display text-base tabular-nums text-ink-900 num">
  USD 220.000
</span>
```

### Patrón D · Fila de tabla editorial

```tsx
<tr className="border-b border-cream-200 transition-colors hover:bg-cream-100">
  <td className="px-4 py-4">
    <div className="font-display text-[17px] text-ink-900">Cabildo 2840</div>
    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
      3 ambientes · 78m² · Coghlan
    </div>
  </td>
  <td className="px-4 py-4">
    <Badge tone={tonoParaEstado(p.estado)}>{labelEstado(p.estado)}</Badge>
  </td>
  <td className="px-4 py-4 text-right">
    <span className="num font-display text-base text-ink-900">USD 220.000</span>
  </td>
</tr>
```

### Patrón E · Header de tabla

```tsx
<thead>
  <tr className="border-b border-ink-200">
    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
      Propiedad
    </th>
    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
      Estado
    </th>
    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-ink-500">
      Precio
    </th>
  </tr>
</thead>
```

### Patrón F · Sección de ficha (con `<Card>`)

```tsx
<Card>
  <CardHeader>
    <CardTitle>Información de la propiedad</CardTitle>
  </CardHeader>
  <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
        Captada el
      </dt>
      <dd className="mt-1 text-sm text-ink-900">15 de marzo, 2026</dd>
    </div>
    {/* ... más pares dt/dd */}
  </dl>
</Card>
```

---

## 1 · `/propiedades` (lista)

Archivos involucrados (ajustar nombres a los que existan):
- `app/propiedades/page.tsx`
- Cualquier componente de filtros o tabla que esté importado (probablemente `PropiedadesFiltros.tsx`, `PropiedadesTabla.tsx` o inline)

### Cambios a aplicar

**Header de la página:**
- Aplicar **Patrón A**. Título "Propiedades" en `font-display text-4xl tracking-tight`. Subtítulo con conteos en mono uppercase. Botón "Nueva propiedad" a la derecha (queda disabled como hoy, pero ahora con `variant="accent"`).

**Bloque de filtros:**
- Envolver cada filtro en `<Field label="...">` para que tenga label mono uppercase.
- Layout en grid responsive: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`
- Botón "Limpiar filtros" como `variant="ghost"`

**Tabla:**
- Aplicar **Patrón E** para el header de tabla y **Patrón D** para las filas.
- Las direcciones en `font-display text-[17px]` (no bold sans).
- Debajo de cada dirección, una línea mono uppercase con ambientes + m² + barrio.
- Estado: `<Badge>` con `tonoParaEstado(p.estado)` (ya existe ese helper en `Badge.tsx`).
- Precio alineado a la derecha, en `font-display tabular-nums`.
- Si la propiedad tiene `confidencial=true` (solo visible para Zulma), agregar un `<Badge tone="brick" dot={false}>● Confidencial</Badge>` chiquito al lado de la dirección.
- Click en una fila lleva a la ficha (mantener el `<Link>` existente envolviendo la `<tr>` o la primera celda).

**Estado vacío:**
- Si no hay propiedades cargadas o filtros no devuelven nada: un Card con texto serif italic "No hay propiedades que coincidan con los filtros." y un ghost button "Limpiar filtros".

**Migrar tonos legacy a nombres nuevos:**
- Cualquier `<Badge tone="neutral|yellow|violet|orange|red|blue">` en este archivo → migrar a `slate|amber|plum|brick|brick|slate` respectivamente.

---

## 2 · `/propiedades/[id]` (ficha)

Archivo: `app/propiedades/[id]/page.tsx` (y cualquier componente que importe).

### Estructura nueva

Layout en dos columnas (responsive: una columna en mobile):

```
┌─────────────────────────────────────────────────┐
│  HEADER                                          │
│  Dirección grande (font-display text-5xl)        │
│  Mono uppercase: "Propiedad · Captada hace 12d"  │
│  Badge estado al lado del título                 │
└─────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌────────────────────┐
│ COLUMNA PRINCIPAL (2/3)  │  │ ASIDE (1/3)        │
│                          │  │                    │
│ Card · Información       │  │ Card · Precio      │
│   - tipo                 │  │   USD grande       │
│   - ambientes/dormit/baños│ │   ARS abajo        │
│   - m² cubiertos/totales │  │                    │
│   - antiguedad           │  │ Card · Dueño       │
│                          │  │   Nombre serif     │
│ Card · Notas internas    │  │   Tel / Mail       │
│   (solo Zulma y Martín)  │  │                    │
│                          │  │ Card · Visitas     │
│ Card · Acuerdo especial  │  │   Lista compacta   │
│   (solo Zulma · violeta) │  │                    │
└──────────────────────────┘  └────────────────────┘
```

### Cambios concretos

**Header:**
- `<h1>` con la dirección en `font-display text-5xl tracking-tight text-ink-900`
- Línea sub: `font-mono text-[10px] uppercase tracking-widest text-ink-500` con "Propiedad · Captada hace X días" o "Propiedad · ID #..."
- `<Badge>` con el estado al lado (mismo line del título, vertical-align baseline)
- Si `confidencial`: un `<Badge tone="brick">Confidencial</Badge>` adicional

**Cards de información:**
- Aplicar **Patrón F** consistentemente
- En `<dt>` (los labels) usar el estilo mono uppercase
- En `<dd>` los valores en `text-sm text-ink-900`
- Para números (m², ambientes) usar `font-mono tabular-nums` o un span con `.num`

**Card de precio (aside):**
```tsx
<Card>
  <CardHeader>
    <CardSubtitle>Precio publicado</CardSubtitle>
  </CardHeader>
  <div className="font-display text-3xl tabular-nums tracking-tight text-ink-900">
    USD <span className="num">220.000</span>
  </div>
  <div className="mt-1 font-mono text-xs tabular-nums text-ink-500">
    ARS <span className="num">218.000.000</span>
  </div>
</Card>
```

**Card "Acuerdo especial" (solo Zulma):**
- Mantener la lógica existente (visible solo si `usuario.rol === 'socia_titular'` y la propiedad tiene `acuerdo_especial`)
- Cambiar el styling a:
  ```tsx
  <Card className="border-plum-50 bg-plum-50/30">
    <CardHeader>
      <CardSubtitle className="text-plum-500">Acuerdo especial</CardSubtitle>
    </CardHeader>
    <p className="font-display italic text-lg text-ink-900 leading-snug">
      {propiedad.acuerdo_especial}
    </p>
  </Card>
  ```
- El italic en serif le da el aire de "anotación a mano" del kit.

**Card "Notas internas" (Zulma + Martín, NO Carolina):**
- Mantener la condicional existente
- Styling: Card normal pero con `<CardSubtitle>` "Notas internas"
- Las notas se muestran como bloque de texto en `text-sm text-ink-700 leading-relaxed`

---

## 3 · `/leads` (lista)

Archivo: `app/leads/page.tsx` y componentes asociados.

### Cambios a aplicar

**Header:**
- Aplicar **Patrón A**. Título "Leads" en serif grande, subtítulo con conteos por estado.
- Botón "Nuevo lead" a la derecha con `variant="accent"` (este sí está habilitado y va a `/leads/nuevo`).

**Filtros:**
- Igual que en propiedades: cada filtro envuelto en `<Field>`, grid responsive.

**Tabla:**
- Aplicar **Patrón E + D**.
- Columnas: Nombre · Teléfono · Origen · Estado · Última actividad
- Nombre en `font-display text-[17px]` (los nombres son los protagonistas, como las direcciones en propiedades)
- Debajo del nombre: línea mono uppercase con "Lead · Cargado por {usuario}" o "Lead · {fecha relativa}"
- Teléfono en `font-mono text-sm` (números monoespaciados se ven mejor)
- Origen como `<Badge tone="slate" dot={false}>` chiquito
- Estado como `<Badge tone={tonoParaEstado(l.estado)}>`
- Última actividad: en `text-xs text-ink-500` ("hace 3 días")

**Caso especial · `canal_origen = 'referido_zulma'`:**
- En la fila de un lead con este origen, mostrar el origen como `<Badge tone="plum">Referido por Zulma</Badge>`
- Eso marca visualmente el sexto canal exclusivo de la socia titular sin necesitar columna nueva

**Migrar tonos legacy** igual que en propiedades.

---

## 4 · `/leads/[id]` (ficha)

Archivo: `app/leads/[id]/page.tsx`.

### Estructura nueva

Layout similar a la ficha de propiedad pero más simple:

```
┌─────────────────────────────────────────────────┐
│  HEADER                                          │
│  Nombre del lead (font-display text-5xl)        │
│  Mono uppercase: "Lead · Cargado hace 5 días"   │
│  Badge estado                                    │
└─────────────────────────────────────────────────┘

┌──────────────────────────┐  ┌────────────────────┐
│ COLUMNA PRINCIPAL (2/3)  │  │ ASIDE (1/3)        │
│                          │  │                    │
│ Card · Contacto          │  │ Card · Estado      │
│   - Teléfono             │  │   Badge grande     │
│   - Email                │  │   Última actividad │
│   - Origen / Canal       │  │                    │
│                          │  │ Card · Acciones    │
│ Card · Búsqueda          │  │   - Editar lead    │
│   - Ambientes deseados   │  │   - WhatsApp dis.  │
│   - Presupuesto          │  │   - Email disab.   │
│   - Barrios de interés   │  │                    │
│                          │  └────────────────────┘
│ Card · Notas             │
│   (texto libre)          │
│                          │
│ Card · Otros leads con   │
│  este teléfono           │
│   (si hay duplicados)    │
└──────────────────────────┘
```

### Detalles

**Alerta de duplicados** (cuando hay otros leads con el mismo teléfono):
- Reemplazar el styling actual por:
  ```tsx
  <Card className="border-brick-200 bg-brick-50/50">
    <CardHeader>
      <CardSubtitle className="text-brick-700">
        Otros leads con este teléfono
      </CardSubtitle>
    </CardHeader>
    <p className="mb-3 text-sm text-ink-700">
      Atención: este teléfono aparece en {n} {n === 1 ? "lead" : "leads"} más.
    </p>
    <ul className="flex flex-col divide-y divide-brick-100">
      {duplicados.map((d) => (
        <li key={d.id}>
          <Link
            href={`/leads/${d.id}`}
            className="flex items-center justify-between py-2 hover:bg-brick-50"
          >
            <div>
              <div className="font-display text-base text-ink-900">{d.nombre}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                Cargado el {fmt(d.created_at)}
              </div>
            </div>
            <Badge tone={tonoParaEstado(d.estado)}>{d.estado}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  </Card>
  ```

**Bloque "Referido por Zulma" (solo Zulma, si canal_origen es referido_zulma):**
- Card similar al "acuerdo especial" de propiedades, en plum/violeta:
  ```tsx
  <Card className="border-plum-50 bg-plum-50/30">
    <CardHeader>
      <CardSubtitle className="text-plum-500">Referido por Zulma</CardSubtitle>
    </CardHeader>
    <p className="font-display italic text-lg text-ink-900">
      Referencia personal: {referencia_personal}
    </p>
  </Card>
  ```

**Card "Acciones":**
- Lista vertical de botones:
  - "Editar lead" (`variant="secondary"`, link a `/leads/[id]/editar`)
  - "WhatsApp" (disabled, próximamente)
  - "Enviar email" (disabled, próximamente)
  - "Archivar" (`variant="danger"`, todavía sin handler)

---

## 5 · `/leads/nuevo` (form de creación)

Archivo: `app/leads/nuevo/page.tsx` + el form (probablemente `LeadFormNuevo.tsx` o similar).

### Cambios a aplicar

**Layout:**
- El form pasa a estar dentro de una `<Card>` con padding generoso (p-8 lg:p-10)
- Header de página antes del Card: **Patrón A** simplificado:
  ```tsx
  <header className="mb-8 border-b border-cream-200 pb-6">
    <h1 className="font-display text-4xl text-ink-900 tracking-tight">
      Nuevo lead
    </h1>
    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
      Cargá los datos del contacto · La detección de duplicados se hace al guardar
    </p>
  </header>
  ```

**Inputs:**
- Cada input/select envuelto en `<Field label="..." required={true|false}>` con label mono uppercase.
- Required marker brick visible.
- Si hay un hint (ej. "Formato: +54 9 11 ...") va en el `hint` prop del Field.

**Layout de campos:**
- Grid de dos columnas para campos cortos (`grid grid-cols-1 md:grid-cols-2 gap-5`)
- Campos largos (notas, barrios de interés) ocupan ancho completo con `md:col-span-2`

**Alerta de duplicado activa (cuando el usuario escribe un teléfono que ya existe):**
- Mostrar inline debajo del campo teléfono:
  ```tsx
  {duplicado && (
    <div className="rounded-sm border border-brick-200 bg-brick-50 p-3">
      <div className="flex items-start gap-2 text-sm text-brick-700">
        <AlertTriangle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
        <div>
          <strong>Atención · ya existe un lead con este teléfono.</strong>
          <p className="mt-1 text-brick-600">
            <Link href={`/leads/${duplicado.id}`} className="underline">
              {duplicado.nombre}
            </Link>
            · Cargado el {fmt(duplicado.created_at)}
          </p>
          <p className="mt-2">
            Podés continuar y crear un nuevo lead igual, o volver y editar el existente.
          </p>
        </div>
      </div>
    </div>
  )}
  ```

**Botones al pie:**
- "Cancelar" (`variant="ghost"`, link a `/leads`)
- "Crear lead" (`variant="primary"`, submit)
- Alineados a la derecha, gap-3

---

## 6 · `/leads/[id]/editar` (form de edición)

Archivo: `app/leads/[id]/editar/page.tsx` + el form (`LeadFormEditar.tsx` o similar).

### Cambios

- Mismo patrón que `/leads/nuevo`, pero el header dice "Editar lead" y muestra el nombre actual debajo
- Mantener todas las protecciones de rol existentes (Carolina solo puede editar ciertos campos, etc.)
- Si la detección de duplicados se ejecuta también acá, mismo styling de alerta
- Botones: "Cancelar" ghost + "Guardar cambios" primary

---

## 7 · Limpieza de aliases legacy

Una vez que **todas las pantallas estén refactorizadas**, hacer search-and-replace para asegurar que no quedaron tonos viejos:

```bash
# Verificar que ya no hay tones legacy en uso
grep -rn 'tone="neutral"\|tone="yellow"\|tone="violet"\|tone="orange"\|tone="red"\|tone="blue"' app/ components/

# Verificar que ya no hay clases legacy de Tailwind en uso
grep -rn 'bg-paper\|border-line\|text-accent' app/ components/
```

Si los `grep` devuelven cero matches, **remover los aliases**:

**De `components/ui/Badge.tsx`:**
- Borrar el bloque `legacyAliases` y simplificar el type `Tone` para que solo acepte los nombres del kit.

**De `tailwind.config.ts`:**
- Borrar las líneas `paper`, `line`, `accent` del bloque de colores.

Si algún `grep` devuelve matches, los dejamos para limpiar después. No bloquea el commit.

---

## 8 · Smoke test visual + funcional

Con `pnpm dev` y la app corriendo, hacer los siguientes flujos como **cada uno de los tres usuarios** (Zulma, Martín, Carolina):

### Como Zulma (socia_titular):
1. `/propiedades` → ver lista editorial, click en Don Eduardo Vázquez
2. Ficha de Don Eduardo → ver bloque violeta "Acuerdo especial"
3. `/leads` → ver lista, click en Ariel Sobrino (referido_zulma)
4. Ficha de Ariel → ver bloque violeta "Referido por Zulma"
5. Click en Lucía Fernández → ver alerta brick "Otros leads con este teléfono" (debería listar el lead duplicado)
6. `/leads/nuevo` → cargar un teléfono que ya existe en otro lead → ver alerta inline activa de duplicado
7. Volver y crear un lead nuevo con teléfono limpio → debería redirigir a la ficha del nuevo lead

### Como Martín (socio_operativo):
1. `/propiedades` → la lista NO muestra el badge "Confidencial" en ningún lado (Martín no ve ese flag)
2. Ficha de Don Eduardo → NO ve el bloque "Acuerdo especial" (esto está bien, es Zulma-only)
3. Ficha de Don Eduardo → SÍ ve el bloque "Notas internas"
4. `/leads` → la lista de Ariel NO muestra "Referido por Zulma" (Martín solo ve "referido" sin el detalle)

### Como Carolina (administrativa):
1. `/propiedades` → ve la lista pero NO ve precios "confidenciales" si los hay
2. Ficha de Don Eduardo → NO ve "Notas internas" NI "Acuerdo especial"
3. `/leads` → ve la lista
4. `/leads/nuevo` → puede crear leads (los campos restringidos están en disabled o no se renderizan)

**Visual check general:**
- Las direcciones de propiedades se ven en serif grande, editorial
- Los nombres de leads también
- Los precios se ven en serif con números tabulares (no se desalinean)
- Los badges tienen el dot a la izquierda y los colores nuevos
- Los headers de tabla son mono uppercase chiquito, no bold sans
- El hover de filas es cream-100 sutil
- No hay restos de azul (#6B8CFF), violeta brillante u otros colores legacy en pantalla

---

## 9 · Verificación técnica

```bash
pnpm type-check
pnpm lint
```

Si quedaron tonos legacy en uso (y no los limpiaste en el paso 7), no es bloqueante para este commit. Solo dejá una nota en el reporte final.

---

## 10 · Commit y push

```bash
git add .
git commit -m "feat(ui): pantallas /propiedades y /leads con kit Cantú completo"
git push
```

---

## 11 · Confirmación final

Mostrame:

- Output de `pnpm type-check` y `pnpm lint`
- Hash del commit
- Resumen de archivos tocados (con `git diff --stat HEAD~1`)
- Una pequeña tabla de "**Antes / Después**" describiendo el cambio visual de cada pantalla, ej:

| Pantalla | Cambio principal |
|---|---|
| `/propiedades` lista | Direcciones en serif grande, filas con padding 16px, precios tabular |
| `/propiedades/[id]` | Layout 2/3 + 1/3, header con dirección 48px serif, acuerdo especial en italic |
| `/leads` lista | Nombres en serif, "Referido por Zulma" como badge plum visible |
| `/leads/[id]` | Aside con acciones, alerta de duplicados rediseñada en brick |
| `/leads/nuevo` | Card grande, fields con label mono, alerta duplicado inline |
| `/leads/[id]/editar` | Mismo patrón que /nuevo, mantiene protecciones de rol |

- **Si quedaron aliases legacy sin migrar** (paso 7), listalos para limpiar después
- Cualquier issue que haya aparecido y cómo lo resolviste

Si algún paso falla, parate y avisame antes de seguir improvisando.
