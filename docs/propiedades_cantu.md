# Pantalla de Propiedades · Cantú Propiedades

Primera pantalla real del producto. Al terminar este paso, un usuario logueado puede:

1. Ver una lista filtrable de propiedades en `/propiedades`
2. Hacer click en una propiedad y ver su ficha completa en `/propiedades/[id]`
3. Ver datos diferenciados según su rol (Zulma ve `acuerdo_especial` del dueño, Martín y Carolina no)
4. Navegar entre páginas con un sidebar persistente y un topbar con su usuario/rol

## Contexto

- **Repo:** `cantu_propiedades`
- **Estado actual:** schema + RLS aplicados, seed con 7 propiedades y 6 dueños, login funcionando con tres usuarios (Zulma / Martín / Carolina)
- **Stack:** Next.js 14 App Router · Tailwind v3 · Supabase · lucide-react · clsx
- **Doc fuente:** `docs/modelo-datos.md` (entidades) y `docs/discovery.md` (lo que pidió cada uno)

---

## 1 · Anotar la decisión arquitectónica

Agregar esta entrada al final de `docs/decisiones.md`:

```markdown
## 2026-05-26 · RLS por fila + filtrado por columna en la app

**Contexto:** El modelo de datos define que la administrativa (Carolina) no ve `notas_internas` ni `acuerdo_especial` de los dueños, y el socio operativo (Martín) no ve `acuerdo_especial`. Postgres no tiene column-level security simple.

**Decisión:** RLS se aplica solo a nivel fila. Todos los usuarios activos ven los registros que les corresponden. El filtrado por columna se hace en el cliente Supabase: las queries se centralizan en `lib/supabase/queries/*.ts` y cada función incluye solo las columnas que el rol actual puede leer.

**Alternativa considerada:** Vistas de Postgres materializadas por rol. Descartada por complejidad para una app interna de 3 usuarios.

**Consecuencias:** El acceso a datos sensibles depende de que el código respete las funciones centralizadas. Una query directa con `select('*')` desde una pantalla nueva podría filtrar datos. Mitigación: ESLint rule (próxima vuelta) que prohíba el wildcard sobre las tablas con datos sensibles.
```

---

## 2 · Helper de usuario actual

Crear `lib/auth/current-user.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type RolUsuario = Database["public"]["Enums"]["rol_usuario"];

export type UsuarioActual = {
  id: string;
  nombre: string;
  rol: RolUsuario;
  email: string;
};

/**
 * Devuelve el perfil completo del usuario logueado, o null si no hay sesión.
 * Se usa en Server Components para decidir qué columnas/bloques renderizar.
 */
export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, email")
    .eq("id", user.id)
    .eq("activo", true)
    .single();

  return perfil ?? null;
}

/**
 * Helpers booleanos para decidir visibilidad en la UI.
 */
export function puedeVerAcuerdoEspecial(rol: RolUsuario): boolean {
  return rol === "socia_titular";
}

export function puedeVerNotasInternas(rol: RolUsuario): boolean {
  return rol === "socia_titular" || rol === "socio_operativo";
}

export function puedeBorrar(rol: RolUsuario): boolean {
  return rol === "socia_titular";
}
```

---

## 3 · Queries centralizadas

Crear `lib/supabase/queries/propiedades.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/auth/current-user";
import { puedeVerAcuerdoEspecial, puedeVerNotasInternas } from "@/lib/auth/current-user";

const COLUMNAS_DUENO_BASE = "id, nombre, email, telefono, canal_preferido, frecuencia_reporte, en_grupo_whatsapp, confidencial";

function columnasDueno(rol: RolUsuario): string {
  const cols = [COLUMNAS_DUENO_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  if (puedeVerAcuerdoEspecial(rol)) cols.push("acuerdo_especial");
  return cols.join(", ");
}

const COLUMNAS_PROPIEDAD_BASE = "id, direccion, tipo, operacion, estado, precio_actual, moneda, fecha_captacion, confidencial, descripcion_comercial, fotos";

function columnasPropiedad(rol: RolUsuario): string {
  const cols = [COLUMNAS_PROPIEDAD_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  return cols.join(", ");
}

export type FiltrosPropiedades = {
  busqueda?: string;
  estado?: string;
  tipo?: string;
  operacion?: string;
};

export async function listarPropiedades(rol: RolUsuario, filtros: FiltrosPropiedades = {}) {
  const supabase = createClient();
  
  let query = supabase
    .from("propiedades")
    .select(`
      ${columnasPropiedad(rol)},
      dueno:duenos(id, nombre)
    `)
    .order("fecha_captacion", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.operacion) query = query.eq("operacion", filtros.operacion);
  if (filtros.busqueda) query = query.ilike("direccion", `%${filtros.busqueda}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function obtenerPropiedad(id: string, rol: RolUsuario) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select(`
      ${columnasPropiedad(rol)},
      dueno:duenos(${columnasDueno(rol)}),
      portales:portales_propiedad(*),
      visitas(
        id, fecha_agendada, estado, devolucion_prospecto,
        lead:leads(id, nombre, telefono),
        responsable:usuarios!visitas_responsable_id_fkey(nombre)
      ),
      leads(id, nombre, telefono, estado, canal_origen, creado_en)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}
```

---

## 4 · Componentes UI base

Crear los siguientes archivos en `components/ui/`:

### `components/ui/Button.tsx`

```tsx
import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/85 disabled:bg-ink/30",
  secondary: "bg-paper border border-line text-ink hover:bg-line/30",
  ghost: "text-ink hover:bg-line/40",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
```

### `components/ui/Card.tsx`

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-lg border border-line bg-white p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mb-4 flex items-center justify-between", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx("font-display text-xl font-semibold text-ink", className)}
      {...props}
    />
  );
}

export function CardSubtitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={clsx("text-xs uppercase tracking-widest text-ink/50", className)} {...props} />
  );
}
```

### `components/ui/Badge.tsx`

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Tone = "neutral" | "green" | "yellow" | "orange" | "red" | "blue" | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-line/40 text-ink/70",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  violet: "bg-violet-100 text-violet-800",
};

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

// Helper para mapear el estado de una propiedad a un tono
export function tonoParaEstado(estado: string): Tone {
  const map: Record<string, Tone> = {
    captada: "neutral",
    publicada: "green",
    con_visitas: "blue",
    con_oferta: "orange",
    reservada: "violet",
    cerrada: "neutral",
    pausada: "yellow",
    archivada: "neutral",
  };
  return map[estado] ?? "neutral";
}
```

### `components/ui/Input.tsx`

```tsx
import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink",
        "placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
```

### `components/ui/Select.tsx`

```tsx
import { clsx } from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={clsx(
        "rounded-md border border-line bg-white px-3 py-2 text-sm text-ink",
        "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";
```

---

## 5 · Layout del dashboard

### `app/(dashboard)/layout.tsx`

```tsx
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar usuario={usuario} />
        <main className="flex-1 px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
```

### `components/Sidebar.tsx`

```tsx
import Link from "next/link";
import { LayoutDashboard, Building2, Users, Calendar, FileText } from "lucide-react";

const items = [
  { href: "/tablero", label: "Tablero", icon: LayoutDashboard, disabled: true },
  { href: "/propiedades", label: "Propiedades", icon: Building2, disabled: false },
  { href: "/leads", label: "Leads", icon: Users, disabled: true },
  { href: "/agenda", label: "Agenda", icon: Calendar, disabled: true },
  { href: "/reportes", label: "Reportes", icon: FileText, disabled: true },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-line bg-white">
      <div className="flex h-16 items-center border-b border-line px-6">
        <span className="font-display text-xl font-semibold text-ink">
          Cantú
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/30"
                title="Próximamente"
              >
                <Icon size={16} />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-line/30 hover:text-ink"
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4 text-xs text-ink/40">
        JS80 · v0.1
      </div>
    </aside>
  );
}
```

### `components/Topbar.tsx`

```tsx
import Link from "next/link";
import type { UsuarioActual } from "@/lib/auth/current-user";
import { LogOut } from "lucide-react";

const rolLabel: Record<string, string> = {
  socia_titular: "Socia titular",
  socio_operativo: "Socio operativo",
  administrativa: "Administrativa",
};

export function Topbar({ usuario }: { usuario: UsuarioActual }) {
  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-line bg-white px-8">
      <div className="text-right">
        <div className="text-sm font-medium text-ink">{usuario.nombre}</div>
        <div className="text-xs text-ink/50">{rolLabel[usuario.rol]}</div>
      </div>
      <Link
        href="/logout"
        className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:bg-line/30"
        title="Cerrar sesión"
      >
        <LogOut size={14} />
        Salir
      </Link>
    </header>
  );
}
```

---

## 6 · Mover `/test-db` y `/login` debajo del layout

`/login` y `/logout` **NO** van debajo del `(dashboard)` group (no necesitan auth ni sidebar). Quedan donde están.

`/test-db` la podés borrar — ya cumplió su función:

```bash
rm -rf app/test-db
```

---

## 7 · Página `/propiedades` · lista

### `app/(dashboard)/propiedades/page.tsx`

```tsx
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarPropiedades } from "@/lib/supabase/queries/propiedades";
import { Card } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, Search } from "lucide-react";

const tiposPropiedad = ["depto", "casa", "ph", "local", "oficina", "cochera", "terreno"];
const operaciones = ["alquiler", "venta", "temporada"];
const estados = ["captada", "publicada", "con_visitas", "con_oferta", "reservada", "cerrada", "pausada", "archivada"];

type SearchParams = {
  q?: string;
  estado?: string;
  tipo?: string;
  operacion?: string;
};

function formatearPrecio(precio: number | null, moneda: string): string {
  if (precio === null) return "—";
  const formato = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  return `${moneda.toUpperCase()} ${formato.format(precio)}`;
}

function diasDesde(fecha: string): number {
  const d = new Date(fecha);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const propiedades = await listarPropiedades(usuario.rol, {
    busqueda: searchParams.q,
    estado: searchParams.estado,
    tipo: searchParams.tipo,
    operacion: searchParams.operacion,
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Propiedades
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {propiedades.length} {propiedades.length === 1 ? "propiedad" : "propiedades"} en cartera
          </p>
        </div>
        <Button disabled title="Próximamente">
          <Plus size={16} />
          Nueva propiedad
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <Input
                name="q"
                placeholder="Dirección..."
                defaultValue={searchParams.q ?? ""}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Estado
            </label>
            <Select name="estado" defaultValue={searchParams.estado ?? ""}>
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e} value={e}>{e.replace("_", " ")}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Tipo
            </label>
            <Select name="tipo" defaultValue={searchParams.tipo ?? ""}>
              <option value="">Todos</option>
              {tiposPropiedad.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Operación
            </label>
            <Select name="operacion" defaultValue={searchParams.operacion ?? ""}>
              <option value="">Todas</option>
              {operaciones.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">Filtrar</Button>
            <Link href="/propiedades">
              <Button type="button" variant="ghost">Limpiar</Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        {propiedades.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/50">
            No hay propiedades que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Dirección</th>
                <th className="px-6 py-3 text-left font-medium">Tipo</th>
                <th className="px-6 py-3 text-left font-medium">Operación</th>
                <th className="px-6 py-3 text-left font-medium">Estado</th>
                <th className="px-6 py-3 text-right font-medium">Precio</th>
                <th className="px-6 py-3 text-left font-medium">Dueño</th>
                <th className="px-6 py-3 text-right font-medium">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {propiedades.map((p: any) => (
                <tr key={p.id} className="hover:bg-line/10">
                  <td className="px-6 py-4">
                    <Link
                      href={`/propiedades/${p.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {p.direccion}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize text-ink/70">{p.tipo}</td>
                  <td className="px-6 py-4 capitalize text-ink/70">{p.operacion}</td>
                  <td className="px-6 py-4">
                    <Badge tone={tonoParaEstado(p.estado)}>
                      {p.estado.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-ink">
                    {formatearPrecio(p.precio_actual, p.moneda)}
                  </td>
                  <td className="px-6 py-4 text-ink/70">{p.dueno?.nombre ?? "—"}</td>
                  <td className="px-6 py-4 text-right text-ink/60">
                    {diasDesde(p.fecha_captacion)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
```

---

## 8 · Página `/propiedades/[id]` · ficha

### `app/(dashboard)/propiedades/[id]/page.tsx`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUsuarioActual, puedeVerAcuerdoEspecial, puedeVerNotasInternas } from "@/lib/auth/current-user";
import { obtenerPropiedad } from "@/lib/supabase/queries/propiedades";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Lock } from "lucide-react";

function formatearPrecio(precio: number | null, moneda: string): string {
  if (precio === null) return "—";
  return `${moneda.toUpperCase()} ${new Intl.NumberFormat("es-AR").format(precio)}`;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default async function PropiedadDetalle({
  params,
}: {
  params: { id: string };
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  let propiedad;
  try {
    propiedad = await obtenerPropiedad(params.id, usuario.rol);
  } catch {
    notFound();
  }
  if (!propiedad) notFound();

  const dueno = propiedad.dueno as any;
  const verNotas = puedeVerNotasInternas(usuario.rol);
  const verAcuerdo = puedeVerAcuerdoEspecial(usuario.rol);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Volver */}
      <Link
        href="/propiedades"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a propiedades
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tonoParaEstado(propiedad.estado)}>
              {propiedad.estado.replace("_", " ")}
            </Badge>
            {propiedad.confidencial && verAcuerdo && (
              <Badge tone="violet">
                <Lock size={10} className="mr-1" />
                Confidencial
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {propiedad.direccion}
          </h1>
          <p className="mt-1 text-ink/60 capitalize">
            {propiedad.tipo} · {propiedad.operacion} · captada {formatearFecha(propiedad.fecha_captacion)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-ink/50">Precio</div>
          <div className="font-display text-2xl font-semibold text-ink">
            {formatearPrecio(propiedad.precio_actual, propiedad.moneda)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="col-span-2 space-y-6">
          {/* Descripción */}
          {propiedad.descripcion_comercial && (
            <Card>
              <CardHeader><CardTitle>Descripción</CardTitle></CardHeader>
              <p className="text-sm leading-relaxed text-ink/70">
                {propiedad.descripcion_comercial}
              </p>
            </Card>
          )}

          {/* Visitas */}
          <Card>
            <CardHeader><CardTitle>Visitas y devoluciones</CardTitle></CardHeader>
            {(propiedad.visitas?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">Sin visitas registradas todavía.</p>
            ) : (
              <ul className="space-y-4">
                {propiedad.visitas.map((v: any) => (
                  <li key={v.id} className="border-l-2 border-line pl-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-ink">
                        {v.lead?.nombre ?? "Prospecto sin nombre"}
                      </div>
                      <Badge tone={tonoParaEstado(v.estado === "realizada" ? "publicada" : "captada")}>
                        {v.estado}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-ink/50">
                      {formatearFecha(v.fecha_agendada)} · responsable: {v.responsable?.nombre ?? "—"}
                    </div>
                    {v.devolucion_prospecto && (
                      <p className="mt-2 text-sm italic text-ink/70">
                        "{v.devolucion_prospecto}"
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Leads asociados */}
          <Card>
            <CardHeader><CardTitle>Leads asociados</CardTitle></CardHeader>
            {(propiedad.leads?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">Sin leads asociados.</p>
            ) : (
              <ul className="divide-y divide-line">
                {propiedad.leads.map((l: any) => (
                  <li key={l.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-medium text-ink">{l.nombre}</div>
                      <div className="text-xs text-ink/50">
                        {l.telefono ?? "sin teléfono"} · vía {l.canal_origen.replace("_", " ")}
                      </div>
                    </div>
                    <Badge tone="neutral">{l.estado.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Notas internas · solo socios */}
          {verNotas && propiedad.notas_internas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
                <CardSubtitle>Solo visible para socios</CardSubtitle>
              </CardHeader>
              <p className="text-sm leading-relaxed text-ink/70 whitespace-pre-wrap">
                {propiedad.notas_internas}
              </p>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Dueño */}
          <Card>
            <CardHeader><CardTitle>Dueño</CardTitle></CardHeader>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">Nombre</div>
                <div className="text-ink">{dueno?.nombre ?? "—"}</div>
              </div>
              {dueno?.email && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">Email</div>
                  <div className="text-ink/70">{dueno.email}</div>
                </div>
              )}
              {dueno?.telefono && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">Teléfono</div>
                  <div className="text-ink/70">{dueno.telefono}</div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">Canal preferido</div>
                <div className="capitalize text-ink/70">
                  {dueno?.canal_preferido?.replace("_", " ")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">Frecuencia reporte</div>
                <div className="capitalize text-ink/70">
                  {dueno?.frecuencia_reporte?.replace("_", " ")}
                </div>
              </div>
              {verNotas && dueno?.notas_internas && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">Notas</div>
                  <div className="text-ink/70 whitespace-pre-wrap">{dueno.notas_internas}</div>
                </div>
              )}
            </div>
          </Card>

          {/* Acuerdo especial · SOLO ZULMA */}
          {verAcuerdo && dueno?.acuerdo_especial && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="text-violet-900">Acuerdo especial</CardTitle>
                <CardSubtitle className="text-violet-700">
                  <Lock size={10} className="mr-1 inline" />
                  Solo visible para vos
                </CardSubtitle>
              </CardHeader>
              <p className="text-sm leading-relaxed text-violet-900 whitespace-pre-wrap">
                {dueno.acuerdo_especial}
              </p>
            </Card>
          )}

          {/* Portales */}
          <Card>
            <CardHeader><CardTitle>Portales</CardTitle></CardHeader>
            {(propiedad.portales?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">No publicada en portales todavía.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {propiedad.portales.map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between">
                    <span className="capitalize text-ink/70">
                      {p.portal.replace("_", " ")}
                    </span>
                    <Badge tone={p.estado_en_portal === "publicada" ? "green" : "neutral"}>
                      {p.estado_en_portal.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 9 · Ajustar la home (`app/page.tsx`)

Si el usuario está logueado, redirect a `/propiedades`. Si no, mostrar la landing actual con un link a `/login`.

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";

export default async function Home() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/propiedades");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-ink/50">
          JS80 · Estudio de soluciones digitales
        </p>
        <h1 className="font-display text-5xl font-semibold leading-tight text-ink">
          Cantú Propiedades
        </h1>
        <p className="mt-6 text-lg italic text-ink/70">
          Tablero operativo.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink/85"
        >
          Iniciar sesión
        </Link>
        <p className="mt-12 text-sm text-ink/40">
          De la idea al negocio funcionando.
        </p>
      </div>
    </main>
  );
}
```

---

## 10 · Smoke test

Con `pnpm dev` corriendo, abrir incognito (para sesión limpia) y probar como cada usuario:

### Como Zulma (`zulma@cantu.local` / `zulma123`)

1. Login → te redirige a `/propiedades` (7 propiedades en la lista)
2. Click en "Av. Triunvirato 4520..." (la de Don Eduardo, dueño confidencial)
3. En la ficha: 
   - Aparece el badge **Confidencial** al lado del estado
   - Aparece el bloque **Acuerdo especial** con borde violeta y el texto del seed
4. Logout

### Como Martín (`martin@cantu.local` / `martin123`)

1. Login → `/propiedades` (las mismas 7)
2. Misma propiedad de Don Eduardo
3. En la ficha:
   - **NO** aparece badge Confidencial (Martín no sabe que es confidencial)
   - **NO** aparece el bloque Acuerdo especial
   - **SÍ** aparecen las notas internas del dueño (si las tiene)
4. Logout

### Como Carolina (`carolina@cantu.local` / `carolina123`)

1. Login → `/propiedades`
2. Misma propiedad de Don Eduardo
3. En la ficha:
   - **NO** aparece Confidencial
   - **NO** aparece Acuerdo especial
   - **NO** aparecen Notas internas del dueño (ni de la propiedad)
   - Todo lo demás (datos básicos, visitas, leads, portales) sí
4. Logout

### Filtros

Como cualquier usuario:
1. En la lista, escribir "Coghlan" en buscar → filtra a las propiedades en Coghlan
2. Cambiar estado a "publicada" → solo las publicadas
3. Click en "Limpiar" → vuelve a la lista completa

---

## 11 · Verificación de tipos y lint

```bash
pnpm type-check
pnpm lint
```

Ninguno debería romper. Si TypeScript se queja sobre `propiedades.visitas` u otros joins, agregar tipo `any` localmente con `as any` y avisame (corregimos los tipos en una vuelta separada · los tipos de Supabase con relaciones requieren un poco de masaje).

---

## 12 · Commit y push

```bash
git add .
git commit -m "feat(propiedades): lista + ficha con filtrado por rol"
git push
```

---

## 13 · Confirmación final

Mostrame:

- Captura de la lista `/propiedades` (mismo usuario, con los datos del seed)
- Captura de la ficha de la propiedad de Don Eduardo logueado como Zulma (con el bloque Acuerdo especial visible)
- Captura de la misma ficha logueado como Martín (sin el bloque)
- Captura de la misma ficha logueado como Carolina (sin notas internas)
- Output de `pnpm type-check` y `pnpm lint`
- Hash del commit
- Cualquier error que haya aparecido y cómo lo resolviste

Si algún paso falla, parate y avisame antes de seguir improvisando.
