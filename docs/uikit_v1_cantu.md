# UI Kit · Vuelta 1 · Tokens + Componentes UI Base

Aplicar el sistema de diseño de Cantú al proyecto. Esta vuelta toca **tokens visuales** (paleta, tipografía, radios, sombras) y **componentes UI base** (Button, Badge, Card, Input, Select + dos nuevos: Field y Mark).

**No toca:** Sidebar, Topbar, pantallas existentes. Eso es Vuelta 2 y Vuelta 3.

**Después de esta vuelta:** las pantallas existentes (`/propiedades`, `/leads`) siguen andando (no se rompen) pero todavía no tienen el look completo del kit. Lo van a tener cuando lleguen las vueltas 2 y 3.

## Contexto · decisiones tomadas

- **Modo:** light only en esta etapa. Dark vuelve al final del proyecto.
- **Fuentes:** Instrument Serif (display) + Geist (sans) + Geist Mono — vía `next/font/google`
- **Iconos:** seguimos con `lucide-react` ya instalado · pasamos `strokeWidth={1.5}` siempre
- **Paleta:** Ink (10 pasos) + Cream (5 pasos) + Brick (7 pasos) + 4 semánticos (slate, amber, plum, green)
- **Sidebar branding:** monograma ZC + separador + "Propiedades" (lo aplicamos en Vuelta 2)

## Compatibilidad

El refactor de `<Badge>` cambia los nombres de tonos (de `neutral/yellow/violet/...` a `slate/amber/plum/...`). Para no romper las pantallas existentes hasta que las refactoricemos en Vuelta 3, **el componente acepta tanto los nombres nuevos como los viejos** y mapea internamente. Lo mismo con `<Button>`: la variante nueva `accent` se suma a las existentes sin romper nada.

---

## 1 · Cargar fuentes en `app/layout.tsx`

Reemplazar `app/layout.tsx` por:

```tsx
import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const fontDisplay = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const fontSans = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cantú Propiedades",
  description: "Tablero operativo · Cantú Propiedades · Coghlan",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen bg-cream-50 font-sans text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
```

> **Nota:** las variables CSS las inyecta `next/font` en el `<html>`. Tailwind las usa después vía `fontFamily.sans/display/mono`.

---

## 2 · CSS variables en `app/globals.css`

Reemplazar el contenido por:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Ink scale · warm near-black neutrals */
  --ink-900: #1A1814;
  --ink-800: #26221C;
  --ink-700: #3A352D;
  --ink-600: #524B40;
  --ink-500: #6B6358;
  --ink-400: #8A8276;
  --ink-300: #ABA295;
  --ink-200: #CFC7BB;
  --ink-100: #E5DFD4;
  --ink-50:  #EFEAE0;

  /* Cream scale · paper / off-white */
  --cream-50:  #FAF6EE;
  --cream-100: #F5EFE3;
  --cream-200: #EBE3D2;
  --cream-300: #DBD0B8;
  --cream-400: #C7BA9C;

  /* Brick · único acento vibrante */
  --brick-50:  #F7E9DF;
  --brick-100: #EFD0BC;
  --brick-200: #E2A989;
  --brick-300: #D08760;
  --brick-500: #BD5E37;
  --brick-600: #9E4B27;
  --brick-700: #7E3B1E;

  /* Semánticos · sobrios, nunca neón */
  --green-50:  #E8EFE3;
  --green-500: #4A6B3E;
  --amber-50:  #F4ECD6;
  --amber-500: #8C6A1E;
  --plum-50:   #ECE5EC;
  --plum-500:  #5E4459;
  --slate-50:  #E5E9EC;
  --slate-500: #46596A;

  /* Radii · restrained, nunca pill (salvo badges) */
  --radius-xs: 3px;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;

  /* Shadows · casi planas · border-first */
  --shadow-sm: 0 1px 2px rgba(26,24,20,.06), 0 0 0 1px rgba(26,24,20,.04);
  --shadow-md: 0 2px 8px rgba(26,24,20,.07), 0 0 0 1px rgba(26,24,20,.05);
  --shadow-lg: 0 8px 28px rgba(26,24,20,.10), 0 0 0 1px rgba(26,24,20,.06);
}

/* Tabular nums por default en clase .num · útil para precios, días, etc */
.num {
  font-variant-numeric: tabular-nums;
}

/* Body por default */
body {
  font-feature-settings: "ss01" on, "cv11" on;
}
```

---

## 3 · `tailwind.config.ts` con tokens

Reemplazar el archivo entero por:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ink
        ink: {
          50:  "var(--ink-50)",
          100: "var(--ink-100)",
          200: "var(--ink-200)",
          300: "var(--ink-300)",
          400: "var(--ink-400)",
          500: "var(--ink-500)",
          600: "var(--ink-600)",
          700: "var(--ink-700)",
          800: "var(--ink-800)",
          900: "var(--ink-900)",
          DEFAULT: "var(--ink-900)",
        },
        // Cream
        cream: {
          50:  "var(--cream-50)",
          100: "var(--cream-100)",
          200: "var(--cream-200)",
          300: "var(--cream-300)",
          400: "var(--cream-400)",
          DEFAULT: "var(--cream-50)",
        },
        // Brick · acento
        brick: {
          50:  "var(--brick-50)",
          100: "var(--brick-100)",
          200: "var(--brick-200)",
          300: "var(--brick-300)",
          500: "var(--brick-500)",
          600: "var(--brick-600)",
          700: "var(--brick-700)",
          DEFAULT: "var(--brick-500)",
        },
        // Semánticos
        green:  { 50: "var(--green-50)",  500: "var(--green-500)" },
        amber:  { 50: "var(--amber-50)",  500: "var(--amber-500)" },
        plum:   { 50: "var(--plum-50)",   500: "var(--plum-500)" },
        slate:  { 50: "var(--slate-50)",  500: "var(--slate-500)" },
        // Aliases legacy (se mantienen mientras las pantallas no estén refactorizadas)
        paper:  "var(--cream-50)",
        line:   "var(--cream-200)",
        accent: "var(--brick-500)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Times New Roman", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      boxShadow: {
        "subtle-sm": "var(--shadow-sm)",
        "subtle-md": "var(--shadow-md)",
        "subtle-lg": "var(--shadow-lg)",
      },
      letterSpacing: {
        // Tracking del kit
        tightest: "-0.02em",
        tighter: "-0.015em",
        tight: "-0.01em",
        wide: "0.04em",
        wider: "0.08em",
        widest: "0.12em",
        "ultra-wide": "0.18em",
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 4 · Refactor de `components/ui/Button.tsx`

Reemplazar el archivo por:

```tsx
import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

// Variantes según el kit:
//   primary  → Ink (acción principal, navegación)
//   accent   → Brick (CTAs comerciales: publicar, enviar oferta)
//   secondary→ outline ink-200 (acciones secundarias)
//   ghost    → sin borde (acciones inline, "Limpiar filtros")
//   danger   → ghost brick-700 con borde brick-200 (archivar, eliminar)
const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-cream-50 border border-ink-900 hover:bg-ink-800",
  accent: "bg-brick-500 text-cream-50 border border-brick-500 hover:bg-brick-600",
  secondary:
    "bg-transparent text-ink-900 border border-ink-200 hover:bg-cream-100",
  ghost: "bg-transparent text-ink-900 border border-transparent hover:bg-cream-100",
  danger:
    "bg-transparent text-brick-700 border border-brick-200 hover:bg-brick-50",
};

// Sizes según el kit: 30px / 38px / 46px
const sizes: Record<Size, string> = {
  sm: "h-[30px] px-3 text-xs gap-1.5",
  md: "h-[38px] px-4 text-sm gap-2",
  lg: "h-[46px] px-5 text-[15px] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-sm font-medium tracking-tight",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus:ring-2 focus:ring-ink-900/10",
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

---

## 5 · Refactor de `components/ui/Badge.tsx`

Reemplazar el archivo. Este componente **mantiene compatibilidad** con los nombres viejos (`neutral`, `yellow`, `violet`, etc.) mapeándolos a los nuevos:

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

// Tones del kit
type Tone =
  | "slate"
  | "amber"
  | "plum"
  | "brick"
  | "cream"
  | "green"
  | "ink"
  // Aliases legacy · serán removidos en Vuelta 3
  | "neutral"
  | "yellow"
  | "violet"
  | "orange"
  | "red"
  | "blue";

// Mapa de tonos. cada tone tiene bg + fg.
const tones: Record<Exclude<Tone, "neutral" | "yellow" | "violet" | "orange" | "red" | "blue">, { bg: string; fg: string }> = {
  slate:  { bg: "bg-slate-50",   fg: "text-slate-500" },
  amber:  { bg: "bg-amber-50",   fg: "text-amber-500" },
  plum:   { bg: "bg-plum-50",    fg: "text-plum-500" },
  brick:  { bg: "bg-brick-50",   fg: "text-brick-700" },
  cream:  { bg: "bg-cream-200",  fg: "text-ink-700" },
  green:  { bg: "bg-green-50",   fg: "text-green-500" },
  ink:    { bg: "bg-ink-800",    fg: "text-cream-100" },
};

// Aliases legacy
const legacyAliases: Record<"neutral" | "yellow" | "violet" | "orange" | "red" | "blue", keyof typeof tones> = {
  neutral: "slate",
  yellow:  "amber",
  violet:  "plum",
  orange:  "brick",
  red:     "brick",
  blue:    "slate",
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
};

export function Badge({ tone = "slate", dot = true, className, children, ...props }: Props) {
  const resolved = (tone in tones ? tone : legacyAliases[tone as keyof typeof legacyAliases]) as keyof typeof tones;
  const t = tones[resolved];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "text-[11px] font-medium tracking-tight whitespace-nowrap",
        t.bg,
        t.fg,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-[5px] w-[5px] rounded-full opacity-50"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

// Helper actualizado: mapea estados de propiedad a tones del kit
export function tonoParaEstado(estado: string): Tone {
  const map: Record<string, Tone> = {
    // Propiedades
    captada: "cream",
    publicada: "green",
    con_visitas: "slate",
    con_oferta: "brick",
    reservada: "plum",
    cerrada: "ink",
    pausada: "amber",
    archivada: "slate",
    // Leads
    nuevo: "slate",
    contactado: "amber",
    con_visita: "plum",
    sin_interes: "slate",
    cerrado_exitoso: "green",
    // Visitas
    agendada: "slate",
    confirmada: "plum",
    realizada: "green",
    cancelada: "slate",
    no_asistio: "amber",
  };
  return map[estado] ?? "slate";
}
```

---

## 6 · Refactor de `components/ui/Card.tsx`

Reemplazar por:

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

// Card del kit:
// - Fondo blanco puro sobre cream-50 del canvas
// - Border ink-100 (sutil)
// - Sin sombra fuerte
// - rounded-md (10px)
// - Padding 18-24px según contexto
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-md border border-ink-100 bg-white p-6",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx("mb-4 flex items-start justify-between gap-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={clsx(
        "font-display text-xl text-ink-900 tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

// CardSubtitle: el label-style del kit (mono uppercase tracking abierto)
export function CardSubtitle({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx(
        "font-mono text-[10px] uppercase tracking-widest text-ink-500",
        className,
      )}
      {...props}
    />
  );
}
```

---

## 7 · Refactor de `components/ui/Input.tsx`

Reemplazar por:

```tsx
import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

// Input del kit:
// - Fondo blanco puro (contrasta con cream del canvas)
// - Border ink-200
// - Focus: ring ink-900 con halo cream
// - Error: border brick-500 con halo brick-50
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5",
        "font-sans text-sm text-ink-900",
        "placeholder:text-ink-400",
        "focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Aria-invalid (validación de form) muestra error visual
        "aria-[invalid=true]:border-brick-500 aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-brick-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
```

---

## 8 · Refactor de `components/ui/Select.tsx`

Reemplazar por:

```tsx
import { clsx } from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

// Select del kit: como Input pero con chevron a la derecha.
// Wrapper en div porque el <select> nativo no permite icon dentro.
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          "w-full appearance-none rounded-sm border border-ink-200 bg-white",
          "px-3 py-2.5 pr-9 font-sans text-sm text-ink-900",
          "focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        strokeWidth={1.5}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
      />
    </div>
  ),
);
Select.displayName = "Select";
```

---

## 9 · Componente nuevo: `components/ui/Field.tsx`

Crear archivo nuevo. Este es el patrón de form del kit: label en mono uppercase + required marker brick + hint opcional.

```tsx
import { clsx } from "clsx";
import { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLLabelElement> & {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className,
  ...props
}: Props) {
  return (
    <label
      className={clsx("flex flex-col gap-1.5", className)}
      {...(props as any)}
    >
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {label}
        {required && <span className="text-brick-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] text-brick-600">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}
```

---

## 10 · Componente nuevo: `components/brand/Mark.tsx`

Crear el monograma ZC. Se usará en Sidebar (Vuelta 2), Login, etc.

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
  color?: string;
};

/**
 * Monograma ZC en Instrument Serif con kerning fuerte (-0.16em).
 * La Z se mete adentro del C creando una firma editorial.
 * Referencia: portales arqueados británicos / property crests.
 */
export function Mark({ size = 96, color, className, style, ...props }: Props) {
  return (
    <span
      aria-label="ZC"
      className={clsx("inline-flex items-center justify-center", className)}
      style={{
        width: size * 1.08,
        height: size,
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      <span
        className="font-display"
        style={{
          fontSize: size * 0.96,
          lineHeight: 1,
          letterSpacing: "-0.16em",
          color: color ?? "currentColor",
          paddingRight: size * 0.04,
        }}
      >
        ZC
      </span>
    </span>
  );
}
```

---

## 11 · Componente nuevo: `components/brand/Wordmark.tsx`

```tsx
import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
  color?: string;
};

/**
 * Wordmark "Cantú" en Instrument Serif.
 * Para hero, footer, login, materiales formales.
 */
export function Wordmark({ size = 96, color, className, style, ...props }: Props) {
  return (
    <span
      className={clsx("font-display", className)}
      style={{
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "-0.01em",
        color: color ?? "currentColor",
        fontFeatureSettings: '"liga" 1',
        ...style,
      }}
      {...props}
    >
      Cantú
    </span>
  );
}
```

---

## 12 · Verificación · pantallas existentes siguen andando

Con `pnpm dev` corriendo, abrir el navegador y navegar:

- `/` → la landing tiene que verse con la tipografía nueva (Instrument Serif para el `<h1>`, Geist para body)
- `/login` → debería seguir funcionando (los estilos ya cambian a la paleta cream/ink)
- `/propiedades` (logueado) → la lista carga, los Badge se ven con el nuevo estilo (dot + colores nuevos), los Card y Button siguen funcionando
- `/leads` → idem
- `/leads/nuevo` → el form sigue funcionando, los Field nuevos se ven (label mono uppercase)

**Atención visual esperada:**
- Los Badge ahora tienen un punto (dot) a la izquierda del texto
- Los botones primarios son ink-900 (negro cálido), no azules
- Las fuentes son Geist (no Inter) y los headings Instrument Serif (no Fraunces)
- El fondo es cream-50 (cálido), no blanco puro
- Los inputs tienen focus halo más amplio

**Algunas cosas pueden verse "raras" porque las pantallas todavía no fueron refactorizadas para usar el kit completo** — esto es esperado. Vuelta 2 (layout) y Vuelta 3 (pantallas) van a cerrar el ciclo.

---

## 13 · Verificación técnica

```bash
pnpm type-check
pnpm lint
```

Si TypeScript se queja en algún lado por las clases nuevas de Tailwind, probablemente sea cache. Limpiar con:

```bash
rm -rf .next
pnpm dev
```

---

## 14 · Commit y push

```bash
git add .
git commit -m "feat(ui): tokens del kit Cantú + refactor de componentes base"
git push
```

---

## 15 · Confirmación final

Mostrame:

- Output de `pnpm type-check` y `pnpm lint`
- Captura (o markers HTTP) de `/login`, `/propiedades`, `/leads/nuevo` con el kit aplicado
- Hash del commit
- Cualquier error que haya aparecido y cómo lo resolviste
- Una **nota especial** si hay alguna pantalla que se rompió visualmente en forma severa (no menor) — ahí podemos decidir si parchear ahora o dejarlo para Vuelta 3

Si algún paso falla, parate y avisame antes de seguir improvisando.
