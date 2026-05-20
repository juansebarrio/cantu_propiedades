# UI Kit · Vuelta 2 · Layout autenticado + Login

Aplicar el kit Cantú al chrome (sidebar, topbar) y a la página de login. Después de esta vuelta, las pantallas se ven envueltas en la marca, no solo "con tokens nuevos".

## Contexto

Vuelta 1 ya aplicó los tokens (paleta, tipografía, componentes UI base). Las pantallas existentes (`/propiedades`, `/leads`) andan con look "a medio camino". Esta vuelta cierra el chrome (sidebar + topbar) y la entrada (login) con el look completo del kit.

**No toca:** páginas internas como `/propiedades` o `/leads`. Eso es Vuelta 3.

## Qué tiene que quedar al final

- **Sidebar nuevo** con monograma ZC + "Propiedades" + nav con item activo, footer "v0.1 · Coghlan"
- **Topbar nuevo** con breadcrumb dinámico + fecha del día + búsqueda `⌘K` (disabled) + user pill con avatar de inicial
- **`/login` redibujado** con Mark ZC grande, Wordmark Cantú, micro-bajada "Propiedades · Coghlan"
- **`/` (landing)** refactorizada con el look del kit
- Todo Server Component salvo lo que necesita interactividad (`SidebarNav`, `TopbarBreadcrumb` usan `usePathname`)

---

## 1 · Refactor de `components/Sidebar.tsx`

Reemplazar el archivo:

```tsx
import { Mark } from "@/components/brand/Mark";
import { SidebarNav } from "@/components/SidebarNav";

// Sidebar del kit:
// - 232px de ancho
// - Fondo cream-50, mismo que el canvas (no white) — se diferencia por borde
// - Brand area arriba: Mark + separador vertical + "Propiedades" en mono uppercase
// - Nav en el medio, item activo con bg cream-200
// - Footer: "v0.1 · Coghlan" en mono micro
export function Sidebar() {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-cream-200 bg-cream-50 px-[18px] py-7">
      {/* Brand */}
      <div className="mb-7 flex items-center gap-3.5 px-2">
        <Mark size={30} color="var(--ink-900)" />
        <div className="h-[22px] w-px bg-cream-300" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Propiedades
        </span>
      </div>

      {/* Nav */}
      <SidebarNav />

      {/* Footer */}
      <div className="mt-auto px-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400">
          v0.1 · Coghlan
        </div>
      </div>
    </aside>
  );
}
```

---

## 2 · Componente nuevo: `components/SidebarNav.tsx`

Es Client Component (usa `usePathname` para item activo). Crear archivo nuevo:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  disabled?: boolean;
};

const items: NavItem[] = [
  { href: "/tablero", label: "Tablero", icon: LayoutDashboard, disabled: true },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar, disabled: true },
  { href: "/reportes", label: "Reportes", icon: FileText, disabled: true },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          !item.disabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        // Item disabled · span no clickeable
        if (item.disabled) {
          return (
            <span
              key={item.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink-300"
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{item.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-cream-200 font-medium text-ink-900"
                : "text-ink-500 hover:bg-cream-100 hover:text-ink-900",
            )}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
```

---

## 3 · Refactor de `components/Topbar.tsx`

Reemplazar el archivo. Es Server Component que compone breadcrumb (cliente) + búsqueda + user pill:

```tsx
import type { UsuarioActual } from "@/lib/auth/current-user";
import { TopbarBreadcrumb } from "@/components/TopbarBreadcrumb";
import { UserPill } from "@/components/UserPill";
import { Search } from "lucide-react";

export function Topbar({ usuario }: { usuario: UsuarioActual }) {
  return (
    <header className="flex items-center justify-between border-b border-cream-200 px-9 py-[18px]">
      {/* Breadcrumb · pathname dinámico + fecha */}
      <TopbarBreadcrumb />

      {/* Acciones derecha */}
      <div className="flex items-center gap-3.5">
        {/* Buscar · placeholder, Cmd+K es para más adelante */}
        <button
          type="button"
          disabled
          title="Próximamente"
          className="flex cursor-not-allowed items-center gap-2 p-1.5 text-[13px] text-ink-500"
        >
          <Search size={16} strokeWidth={1.5} />
          <span>Buscar</span>
          <kbd className="rounded-xs bg-cream-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-600">
            ⌘K
          </kbd>
        </button>

        {/* Separador vertical */}
        <div className="h-[18px] w-px bg-cream-300" />

        {/* User pill · avatar + nombre + rol + logout */}
        <UserPill usuario={usuario} />
      </div>
    </header>
  );
}
```

---

## 4 · Componente nuevo: `components/TopbarBreadcrumb.tsx`

Client Component que arma el breadcrumb desde el pathname + muestra la fecha de hoy en rioplatense:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

// Mapa de rutas a label legible
const rutaLabels: Record<string, string> = {
  tablero: "Tablero",
  propiedades: "Propiedades",
  leads: "Leads",
  agenda: "Agenda",
  reportes: "Reportes",
  nuevo: "Nuevo",
  editar: "Editar",
};

function formatearFechaHoy(): string {
  // "Miércoles 20 de mayo" en español rioplatense
  const fecha = new Date();
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];
  const dia = dias[fecha.getDay()];
  const numero = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${numero} de ${mes}`;
}

export function TopbarBreadcrumb() {
  const pathname = usePathname();

  // Quitar slash inicial y dividir
  const partes = pathname.split("/").filter(Boolean);

  // Sección principal (primera parte del path)
  const seccionRaw = partes[0] ?? "";
  const seccion = rutaLabels[seccionRaw] ?? "Inicio";

  return (
    <div className="flex items-center gap-2.5 text-[13px] text-ink-500">
      <Home size={14} strokeWidth={1.5} />
      <span>{seccion}</span>
      <span className="opacity-40">/</span>
      <span className="text-ink-900">{formatearFechaHoy()}</span>
    </div>
  );
}
```

---

## 5 · Componente nuevo: `components/UserPill.tsx`

Avatar circular con inicial en Instrument Serif + nombre + rol + dropdown con logout. Por ahora el "dropdown" puede ser solo un link a `/logout` con title (sin menu real para mantener simple esta vuelta).

```tsx
import Link from "next/link";
import { LogOut } from "lucide-react";
import type { UsuarioActual } from "@/lib/auth/current-user";

const rolLabel: Record<string, string> = {
  socia_titular: "Socia titular",
  socio_operativo: "Socio operativo",
  administrativa: "Administrativa",
};

export function UserPill({ usuario }: { usuario: UsuarioActual }) {
  // Inicial del primer nombre
  const inicial = usuario.nombre.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      {/* Avatar */}
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200 font-display text-base text-ink-900"
        aria-label={`Avatar de ${usuario.nombre}`}
      >
        {inicial}
      </div>

      {/* Nombre + rol */}
      <div className="leading-tight">
        <div className="text-[13px] font-medium text-ink-900">{usuario.nombre}</div>
        <div className="text-[11px] text-ink-500">{rolLabel[usuario.rol]}</div>
      </div>

      {/* Logout · botón pequeño con icono */}
      <Link
        href="/logout"
        title="Cerrar sesión"
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
      >
        <LogOut size={14} strokeWidth={1.5} />
      </Link>
    </div>
  );
}
```

---

## 6 · Refactor de `app/login/page.tsx`

Buscar el archivo actual y reemplazarlo (o adaptarlo · puede que el form sea otro archivo). El objetivo: una página centrada, sobria, con el Mark grande arriba.

> **Importante:** si el form de login actual está en otro archivo (ej. `login-form.tsx`) o como componente importado, **no toques el form en sí** — solo reemplazá el `page.tsx` que lo envuelve. La lógica de auth no cambia.

```tsx
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { LoginForm } from "./login-form";  // ajustar al nombre real si difiere
import { Mark } from "@/components/brand/Mark";
import { Wordmark } from "@/components/brand/Wordmark";

export default async function LoginPage() {
  // Si ya está logueado, redirect
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/propiedades");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand area */}
        <div className="mb-12 flex flex-col items-center gap-4">
          <Mark size={56} color="var(--ink-900)" />
          <Wordmark size={56} color="var(--ink-900)" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-500">
            Propiedades · Coghlan
          </span>
        </div>

        {/* Form */}
        <div className="rounded-md border border-ink-100 bg-white p-7">
          <h1 className="mb-1 font-display text-2xl text-ink-900 tracking-tight">
            Iniciar sesión
          </h1>
          <p className="mb-6 text-[13px] text-ink-500">
            Ingresá con el email y contraseña que te dieron.
          </p>
          <LoginForm />
        </div>

        {/* Footer · sutil */}
        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            JS80 · Estudio de soluciones digitales
          </p>
        </div>
      </div>
    </main>
  );
}
```

> Si el form está inline en page.tsx en vez de en un archivo aparte, mantenelo inline pero envolvelo en el layout de arriba. La idea es mismo form, nuevo chrome.

---

## 7 · Refactor de `app/login/login-form.tsx` (si existe)

Si el form es un Client Component separado, los inputs hay que pasarlos a usar el `<Field>` nuevo. Acá un esqueleto · adaptar a lo que realmente existe en el archivo:

```tsx
"use client";

import { useState, useTransition } from "react";
import { iniciarSesion } from "./actions"; // o el nombre real de la action
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const r = await iniciarSesion(formData);
          if (r && !r.ok) setError(r.error ?? "Email o contraseña incorrectos.");
        });
      }}
      className="flex flex-col gap-4"
    >
      <Field label="Email" required>
        <Input
          name="email"
          type="email"
          placeholder="zulma@cantu.local"
          required
          autoComplete="email"
          autoFocus
        />
      </Field>

      <Field label="Contraseña" required>
        <Input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </Field>

      {error && (
        <div className="rounded-sm bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
          {error}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
        Entrar
      </Button>
    </form>
  );
}
```

> Ajustar el import de la server action al nombre real que esté usando hoy.

---

## 8 · Refactor de `app/page.tsx` (landing pública)

La landing actual (la que aparece cuando no estás logueado) tiene que verse con el kit aplicado:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { Mark } from "@/components/brand/Mark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/propiedades");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mb-10 flex flex-col items-center gap-5">
          <Mark size={72} color="var(--ink-900)" />
          <Wordmark size={80} color="var(--ink-900)" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-500">
            Propiedades · Coghlan
          </span>
        </div>

        <p className="mx-auto mb-10 max-w-md font-display text-2xl italic leading-snug text-ink-700">
          Casas de Coghlan, con criterio y oficio.
        </p>

        <Link href="/login">
          <Button size="lg">Iniciar sesión</Button>
        </Link>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
          JS80 · Estudio de soluciones digitales
        </p>
      </div>
    </main>
  );
}
```

---

## 9 · Smoke test visual

Con `pnpm dev` corriendo, abrir en navegador y verificar:

### `/` (deslogueado)

- Centrado, fondo cream-50
- Mark ZC + Wordmark grandes arriba en serif
- Frase italic "Casas de Coghlan, con criterio y oficio."
- Botón "Iniciar sesión" en ink (no azul)
- Footer micro "JS80 · Estudio de soluciones digitales" en mono uppercase

### `/login`

- Mark ZC arriba (más chico que en landing, ~56px)
- Wordmark debajo
- Micro-bajada "Propiedades · Coghlan" en mono tracking abierto
- Card con form: label "Email" y "Contraseña" en mono uppercase con asterisco brick
- Botón "Entrar" full-width, ink
- Footer JS80 sutil

### `/propiedades` (logueado, cualquier rol)

- **Sidebar nuevo:** monograma ZC + separador vertical + "Propiedades" en mono · item Leads habilitado, Tablero/Agenda/Reportes en disabled gris claro · item activo (Propiedades) con bg cream-200
- **Topbar nuevo:**
  - Izquierda: Home icon + "Propiedades" + "/" + fecha de hoy en español rioplatense (ej: "Miércoles 20 de mayo")
  - Derecha: botón "Buscar ⌘K" en gris (disabled) + separador + avatar circular con inicial del usuario en serif + nombre + rol
- Contenido (la tabla de propiedades) **no cambia** — sigue como en Vuelta 1 hasta que llegue Vuelta 3
- Click en sidebar "Leads" → cambia el activo, breadcrumb se actualiza

### `/leads/nuevo`

- Sidebar tiene "Leads" como activo
- Topbar breadcrumb dice "Leads" + fecha
- Resto del form sigue igual (Vuelta 3 lo cierra)

### Cambiar de usuario

- Click en el icono de logout (📤 a la derecha del user pill) → vuelve a `/login`
- Loguearse como Martín o Carolina → la inicial del avatar cambia, el rol cambia

---

## 10 · Verificación técnica

```bash
pnpm type-check
pnpm lint
```

Si TypeScript se queja por el `kbd` de HTML, usar el tag igual (es válido). Si se queja por `clsx`, ya está instalado desde Vuelta 1.

---

## 11 · Commit y push

```bash
git add .
git commit -m "feat(ui): sidebar + topbar + login con kit Cantú aplicado"
git push
```

---

## 12 · Confirmación final

Mostrame:

- Output de `pnpm type-check` y `pnpm lint`
- Capturas (o markers HTTP) de las 4 vistas: `/`, `/login`, `/propiedades` con sidebar+topbar, `/leads`
- Hash del commit
- Cualquier issue que haya aparecido y cómo lo resolviste
- Una nota si **algo del breadcrumb o user pill no funciona como espero** (ej. si el día de la semana sale en inglés en vez de español, o la inicial no aparece)

Si algún paso falla, parate y avisame antes de seguir improvisando.
