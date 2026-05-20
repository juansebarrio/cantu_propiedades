# /agenda · vista semanal de visitas

Construir la pantalla `/agenda` con vista lista semanal, modal de creación, modal de detalle con acciones de estado, y enlaces cruzados desde fichas de propiedad y lead.

## Contexto

Esta es la primera pantalla nueva post-kit Cantú. Las Vueltas 1, 2 y 3 del kit ya están aplicadas (`/propiedades` y `/leads` están con el look completo). `/agenda` nace ya con el kit puesto — los patrones del **vocabulario común** de Vuelta 3 (header, label-style, fila editorial, sección de ficha) se reutilizan acá.

La metáfora es **el calendario impreso de Carolina en la pared de la oficina**. No es Outlook ni Google Calendar — es una hoja semanal con días listados verticalmente, las visitas como filas dentro de cada día.

## Decisiones tomadas

- **Vista lista semanal por default.** Lunes a domingo, navegación con `< Anterior · Hoy · Siguiente >`. Sin vista mensual en V1.
- **Sin "Modo TV".** La pantalla nace operativa con tipografía editorial — si se proyecta se ve bien igual.
- **Sin drag-and-drop.** Reagendar abre un modal con date/time picker.
- **Operaciones V1:** listar, crear, cambiar estado (confirmada / realizada / cancelada / no_asistio), reagendar, editar notas. WhatsApp + recordatorios + bloqueo de agente quedan para V2.

## Permisos

- **Ver:** todos los usuarios autenticados (Zulma, Martín, Carolina).
- **Crear / Editar / Cambiar estado / Reagendar:** todos los usuarios autenticados. No hay restricción de rol para visitas — es operativo, no confidencial.
- **RLS:** simple. `SELECT/INSERT/UPDATE` permitido para cualquier usuario autenticado en `visitas`.

---

## 0 · Verificar el schema actual

Antes de empezar, **inspeccionar el schema actual** de la tabla `visitas` (debería existir del setup inicial):

```bash
# Conectarse a Postgres local y mostrar la estructura
docker exec -it $(docker ps -qf "name=supabase-db") psql -U postgres -d postgres -c "\d public.visitas"
```

Reportarme las columnas reales. El prompt asume este shape:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | uuid | PK, default gen_random_uuid() |
| `propiedad_id` | uuid | FK → propiedades.id |
| `lead_id` | uuid | FK → leads.id |
| `agente_id` | uuid | FK → usuarios.id · quien muestra |
| `fecha` | date | NOT NULL |
| `hora` | time | NOT NULL |
| `estado` | text | CHECK in ('agendada','confirmada','realizada','cancelada','no_asistio') |
| `notas` | text | nullable |
| `created_at` | timestamptz | default now() |
| `updated_at` | timestamptz | default now() |

Si el schema real difiere significativamente (ej. usa `timestamp` en vez de `date + time`), avisame antes de seguir y ajustamos. Si las diferencias son menores (nombres de columnas), adaptá el código a lo real y dejá nota en el reporte final.

---

## 1 · Utilities de fecha · `lib/fechas.ts`

Crear archivo nuevo. Sin librerías externas (no date-fns, no dayjs).

```typescript
// lib/fechas.ts
// Utilities para manejar fechas en español rioplatense.
// Sin dependencias — Date nativo + arrays de nombres.

const DIAS_LARGO = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Devuelve el lunes 00:00 de la semana en la que cae `fecha`. */
export function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay(); // 0=dom, 1=lun, ... 6=sáb
  const offset = dia === 0 ? -6 : 1 - dia; // si es domingo, ir 6 días atrás
  d.setDate(d.getDate() + offset);
  return d;
}

/** Devuelve el domingo 23:59 de la semana en la que cae `fecha`. */
export function finDeSemana(fecha: Date): Date {
  const inicio = inicioDeSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}

/** Suma `dias` días a una fecha (puede ser negativo). */
export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

/** Lunes de la semana siguiente. */
export function semanaSiguiente(fecha: Date): Date {
  return sumarDias(inicioDeSemana(fecha), 7);
}

/** Lunes de la semana anterior. */
export function semanaAnterior(fecha: Date): Date {
  return sumarDias(inicioDeSemana(fecha), -7);
}

/** True si la fecha es hoy (comparando día/mes/año). */
export function esHoy(fecha: Date): boolean {
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

/** "Lunes 18" */
export function formatearDiaCorto(fecha: Date): string {
  const dia = DIAS_LARGO[fecha.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.getDate()}`;
}

/** "Lunes 18 de mayo" */
export function formatearDiaLargo(fecha: Date): string {
  const dia = DIAS_LARGO[fecha.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

/** "18 al 24 de mayo" (rango de una semana) */
export function formatearRangoSemana(inicio: Date, fin: Date): string {
  const dIni = inicio.getDate();
  const dFin = fin.getDate();
  const mIni = MESES[inicio.getMonth()];
  const mFin = MESES[fin.getMonth()];
  if (mIni === mFin) {
    return `${dIni} al ${dFin} de ${mFin}`;
  }
  return `${dIni} de ${mIni} al ${dFin} de ${mFin}`;
}

/** "2026-05-18" → Date a las 00:00 hora local. */
export function parsearFechaISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Date → "2026-05-18" (para URL params y DB). */
export function formatearFechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "10:00:00" o "10:00" → "10:00" */
export function formatearHora(hora: string): string {
  const partes = hora.split(":");
  return `${partes[0]}:${partes[1]}`;
}

/** Devuelve los 7 días (Date) de la semana que contiene `fecha`. */
export function diasDeSemana(fecha: Date): Date[] {
  const inicio = inicioDeSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
}
```

---

## 2 · Query de visitas · `lib/supabase/queries/visitas.ts`

Crear archivo nuevo. Si ya existe (por las fichas de propiedad/lead que muestran visitas), **sumar las funciones nuevas** sin tocar las existentes.

```typescript
// lib/supabase/queries/visitas.ts
import { createClient } from "@/lib/supabase/server";
import { formatearFechaISO } from "@/lib/fechas";

export type EstadoVisita =
  | "agendada"
  | "confirmada"
  | "realizada"
  | "cancelada"
  | "no_asistio";

export type VisitaConRelaciones = {
  id: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM:SS
  estado: EstadoVisita;
  notas: string | null;
  created_at: string;
  updated_at: string;

  propiedad: {
    id: string;
    direccion: string;
    barrio: string | null;
  } | null;

  lead: {
    id: string;
    nombre: string;
    telefono: string | null;
  } | null;

  agente: {
    id: string;
    nombre: string;
  } | null;
};

/**
 * Lista todas las visitas en un rango de fechas (inclusivo).
 * Ordenadas por fecha asc, hora asc.
 */
export async function listarVisitasEnRango(
  desde: Date,
  hasta: Date,
): Promise<VisitaConRelaciones[]> {
  const supabase = await createClient();

  const desdeISO = formatearFechaISO(desde);
  const hastaISO = formatearFechaISO(hasta);

  const { data, error } = await supabase
    .from("visitas")
    .select(
      `
      id, fecha, hora, estado, notas, created_at, updated_at,
      propiedad:propiedades ( id, direccion, barrio ),
      lead:leads ( id, nombre, telefono ),
      agente:usuarios ( id, nombre )
      `,
    )
    .gte("fecha", desdeISO)
    .lte("fecha", hastaISO)
    .order("fecha", { ascending: true })
    .order("hora", { ascending: true });

  if (error) {
    console.error("listarVisitasEnRango error:", error);
    throw new Error("No se pudieron cargar las visitas");
  }

  // El select() de Supabase devuelve objetos para joins pero TS no infiere bien
  return (data ?? []) as unknown as VisitaConRelaciones[];
}

/** Una visita individual con sus relaciones, para el modal de detalle. */
export async function obtenerVisita(
  id: string,
): Promise<VisitaConRelaciones | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("visitas")
    .select(
      `
      id, fecha, hora, estado, notas, created_at, updated_at,
      propiedad:propiedades ( id, direccion, barrio ),
      lead:leads ( id, nombre, telefono ),
      agente:usuarios ( id, nombre )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("obtenerVisita error:", error);
    return null;
  }

  return data as unknown as VisitaConRelaciones | null;
}

/** Listas auxiliares para los selects del modal de creación. */
export async function listarPropiedadesActivasParaSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("propiedades")
    .select("id, direccion, barrio, estado")
    .in("estado", ["captada", "publicada", "con_visitas", "con_oferta"])
    .order("direccion", { ascending: true });
  return data ?? [];
}

export async function listarLeadsActivosParaSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, nombre, telefono, estado")
    .in("estado", ["nuevo", "contactado", "con_visita"])
    .order("nombre", { ascending: true });
  return data ?? [];
}

export async function listarUsuariosParaSelect() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, rol")
    .order("nombre", { ascending: true });
  return data ?? [];
}
```

---

## 3 · Server actions · `app/agenda/actions.ts`

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { EstadoVisita } from "@/lib/supabase/queries/visitas";

type Resultado = { ok: true } | { ok: false; error: string };

const ESTADOS_VALIDOS: EstadoVisita[] = [
  "agendada", "confirmada", "realizada", "cancelada", "no_asistio",
];

/** Crear una visita nueva. */
export async function crearVisita(formData: FormData): Promise<Resultado> {
  const propiedad_id = String(formData.get("propiedad_id") || "");
  const lead_id = String(formData.get("lead_id") || "");
  const agente_id = String(formData.get("agente_id") || "");
  const fecha = String(formData.get("fecha") || "");
  const hora = String(formData.get("hora") || "");
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!propiedad_id || !lead_id || !agente_id || !fecha || !hora) {
    return { ok: false, error: "Faltan campos obligatorios" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("visitas").insert({
    propiedad_id,
    lead_id,
    agente_id,
    fecha,
    hora,
    estado: "agendada",
    notas,
  });

  if (error) {
    console.error("crearVisita error:", error);
    return { ok: false, error: "No se pudo crear la visita" };
  }

  revalidatePath("/agenda");
  revalidatePath(`/propiedades/${propiedad_id}`);
  revalidatePath(`/leads/${lead_id}`);
  return { ok: true };
}

/** Cambiar el estado de una visita. */
export async function cambiarEstadoVisita(
  id: string,
  nuevoEstado: EstadoVisita,
): Promise<Resultado> {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { ok: false, error: "Estado inválido" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("visitas")
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("cambiarEstadoVisita error:", error);
    return { ok: false, error: "No se pudo cambiar el estado" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}

/** Reagendar (cambiar fecha y/o hora). */
export async function reagendarVisita(
  id: string,
  fecha: string,
  hora: string,
): Promise<Resultado> {
  if (!fecha || !hora) {
    return { ok: false, error: "Faltan fecha u hora" };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("visitas")
    .update({
      fecha,
      hora,
      // Si estaba confirmada, volver a "agendada" porque hay que reconfirmar
      estado: "agendada",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("reagendarVisita error:", error);
    return { ok: false, error: "No se pudo reagendar" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}

/** Editar notas de una visita. */
export async function editarNotasVisita(
  id: string,
  notas: string,
): Promise<Resultado> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("visitas")
    .update({ notas: notas.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("editarNotasVisita error:", error);
    return { ok: false, error: "No se pudieron guardar las notas" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}
```

---

## 4 · Componente Modal nuevo · `components/ui/Modal.tsx`

Modal base usando `<dialog>` HTML nativo + el kit. Va a ser reutilizable para todas las pantallas futuras.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
};

const widthClasses: Record<NonNullable<Props["maxWidth"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  // Sincronizar prop `open` con el método nativo del <dialog>
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Cerrar con Esc
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", handleCancel);
    return () => d.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        // Cerrar al click en backdrop
        if (e.target === ref.current) onClose();
      }}
      className={clsx(
        "w-full rounded-md border border-ink-100 bg-white p-0",
        "backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px]",
        widthClasses[maxWidth],
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-4">
        <div>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-sm p-1 text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      {/* Contenido */}
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
```

---

## 5 · Página `/agenda` · `app/agenda/page.tsx`

Server Component que lee el query param `?semana=YYYY-MM-DD`, calcula el rango, y pasa todo a `<AgendaSemanal>`.

```tsx
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  listarVisitasEnRango,
  listarPropiedadesActivasParaSelect,
  listarLeadsActivosParaSelect,
  listarUsuariosParaSelect,
} from "@/lib/supabase/queries/visitas";
import {
  inicioDeSemana,
  finDeSemana,
  parsearFechaISO,
  formatearFechaISO,
  formatearRangoSemana,
} from "@/lib/fechas";
import { AgendaSemanal } from "./AgendaSemanal";

type Props = {
  searchParams: Promise<{ semana?: string }>;
};

export default async function AgendaPage({ searchParams }: Props) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const { semana } = await searchParams;

  // Si no viene `?semana=`, usar la semana de hoy
  const fechaPivote = semana ? parsearFechaISO(semana) : new Date();
  const desde = inicioDeSemana(fechaPivote);
  const hasta = finDeSemana(fechaPivote);

  // Cargar datos en paralelo
  const [visitas, propiedadesSelect, leadsSelect, usuariosSelect] =
    await Promise.all([
      listarVisitasEnRango(desde, hasta),
      listarPropiedadesActivasParaSelect(),
      listarLeadsActivosParaSelect(),
      listarUsuariosParaSelect(),
    ]);

  return (
    <main className="px-9 py-8">
      <header className="mb-8 flex items-end justify-between gap-6 border-b border-cream-200 pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            Agenda
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Semana del {formatearRangoSemana(desde, hasta)} · {visitas.length}{" "}
            {visitas.length === 1 ? "visita" : "visitas"}
          </p>
        </div>
        {/* El botón "Nueva visita" vive dentro de AgendaSemanal porque abre modal */}
      </header>

      <AgendaSemanal
        semanaInicio={formatearFechaISO(desde)}
        visitas={visitas}
        propiedadesSelect={propiedadesSelect}
        leadsSelect={leadsSelect}
        usuariosSelect={usuariosSelect}
      />
    </main>
  );
}
```

---

## 6 · `AgendaSemanal` · `app/agenda/AgendaSemanal.tsx`

Client Component. Maneja la navegación entre semanas (vía `router.push` con query param), el estado de modales abiertos y la composición de los días.

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  parsearFechaISO,
  formatearFechaISO,
  semanaAnterior,
  semanaSiguiente,
  diasDeSemana,
  inicioDeSemana,
} from "@/lib/fechas";
import { DiaConVisitas } from "./DiaConVisitas";
import { NuevaVisitaModal } from "./NuevaVisitaModal";
import { VisitaDetalleModal } from "./VisitaDetalleModal";
import type { VisitaConRelaciones } from "@/lib/supabase/queries/visitas";

type Props = {
  semanaInicio: string; // YYYY-MM-DD
  visitas: VisitaConRelaciones[];
  propiedadesSelect: Array<{ id: string; direccion: string; barrio: string | null }>;
  leadsSelect: Array<{ id: string; nombre: string; telefono: string | null }>;
  usuariosSelect: Array<{ id: string; nombre: string; rol: string }>;
};

export function AgendaSemanal({
  semanaInicio,
  visitas,
  propiedadesSelect,
  leadsSelect,
  usuariosSelect,
}: Props) {
  const router = useRouter();
  const fechaPivote = parsearFechaISO(semanaInicio);
  const dias = diasDeSemana(fechaPivote);

  const [modalNueva, setModalNueva] = useState<{
    open: boolean;
    propiedadId?: string;
    leadId?: string;
    fecha?: string;
  }>({ open: false });

  const [visitaSeleccionada, setVisitaSeleccionada] =
    useState<VisitaConRelaciones | null>(null);

  function irASemanaAnterior() {
    const nueva = semanaAnterior(fechaPivote);
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  function irASemanaSiguiente() {
    const nueva = semanaSiguiente(fechaPivote);
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  function irAHoy() {
    const nueva = inicioDeSemana(new Date());
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  // Agrupar visitas por fecha (YYYY-MM-DD)
  const visitasPorDia = visitas.reduce<Record<string, VisitaConRelaciones[]>>(
    (acc, v) => {
      (acc[v.fecha] ??= []).push(v);
      return acc;
    },
    {},
  );

  return (
    <>
      {/* Toolbar de navegación */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={irASemanaAnterior}>
            <ChevronLeft size={14} strokeWidth={1.5} />
            Anterior
          </Button>
          <Button variant="ghost" size="sm" onClick={irAHoy}>
            Hoy
          </Button>
          <Button variant="secondary" size="sm" onClick={irASemanaSiguiente}>
            Siguiente
            <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => setModalNueva({ open: true })}
        >
          <Plus size={16} strokeWidth={1.5} />
          Nueva visita
        </Button>
      </div>

      {/* Lista de días */}
      <div className="flex flex-col gap-3">
        {dias.map((dia) => {
          const iso = formatearFechaISO(dia);
          const visitasDelDia = visitasPorDia[iso] ?? [];
          return (
            <DiaConVisitas
              key={iso}
              dia={dia}
              visitas={visitasDelDia}
              onClickVisita={(v) => setVisitaSeleccionada(v)}
              onClickNueva={() =>
                setModalNueva({ open: true, fecha: iso })
              }
            />
          );
        })}
      </div>

      {/* Modal de creación */}
      <NuevaVisitaModal
        open={modalNueva.open}
        propiedadIdPrellenado={modalNueva.propiedadId}
        leadIdPrellenado={modalNueva.leadId}
        fechaPrellenada={modalNueva.fecha}
        propiedades={propiedadesSelect}
        leads={leadsSelect}
        usuarios={usuariosSelect}
        onClose={() => setModalNueva({ open: false })}
      />

      {/* Modal de detalle (con acciones) */}
      <VisitaDetalleModal
        visita={visitaSeleccionada}
        onClose={() => setVisitaSeleccionada(null)}
      />
    </>
  );
}
```

---

## 7 · `DiaConVisitas` · `app/agenda/DiaConVisitas.tsx`

Renderiza un día con su lista de visitas, o vacío con CTA "Agendar visita". Server Component (no necesita interactividad propia, los handlers vienen como props).

> ⚠ Como recibe handlers como props (`onClickVisita`, `onClickNueva`), tiene que ser Client. Marca `"use client"` arriba.

```tsx
"use client";

import { Plus } from "lucide-react";
import { clsx } from "clsx";
import {
  formatearDiaCorto,
  formatearHora,
  esHoy,
} from "@/lib/fechas";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import type { VisitaConRelaciones } from "@/lib/supabase/queries/visitas";

const labelEstado: Record<string, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

type Props = {
  dia: Date;
  visitas: VisitaConRelaciones[];
  onClickVisita: (v: VisitaConRelaciones) => void;
  onClickNueva: () => void;
};

export function DiaConVisitas({ dia, visitas, onClickVisita, onClickNueva }: Props) {
  const esDiaActual = esHoy(dia);

  return (
    <section
      className={clsx(
        "rounded-md border bg-white",
        esDiaActual ? "border-ink-200" : "border-ink-100",
      )}
    >
      {/* Header del día */}
      <header
        className={clsx(
          "flex items-baseline justify-between gap-3 border-b px-5 py-3",
          esDiaActual ? "border-ink-100 bg-cream-50" : "border-cream-200",
        )}
      >
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl text-ink-900 tracking-tight">
            {formatearDiaCorto(dia)}
          </h2>
          {esDiaActual && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-brick-600">
              · Hoy
            </span>
          )}
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
          {visitas.length === 0
            ? "Sin visitas"
            : `${visitas.length} ${visitas.length === 1 ? "visita" : "visitas"}`}
        </span>
      </header>

      {/* Cuerpo */}
      {visitas.length === 0 ? (
        <div className="flex items-center justify-center px-5 py-6">
          <button
            type="button"
            onClick={onClickNueva}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-400 transition-colors hover:text-ink-900"
          >
            <Plus size={14} strokeWidth={1.5} />
            Agendar visita
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-cream-200">
          {visitas.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onClickVisita(v)}
                className="flex w-full items-center gap-5 px-5 py-3.5 text-left transition-colors hover:bg-cream-50"
              >
                {/* Hora */}
                <div className="num min-w-[58px] font-display text-xl tabular-nums text-ink-900">
                  {formatearHora(v.hora)}
                </div>

                {/* Propiedad + lead */}
                <div className="flex-1 min-w-0">
                  <div className="truncate font-display text-[17px] text-ink-900">
                    {v.propiedad?.direccion ?? "Propiedad eliminada"}
                    {v.propiedad?.barrio && (
                      <span className="ml-1 text-ink-400">
                        · {v.propiedad.barrio}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    con {v.lead?.nombre ?? "lead eliminado"}
                    {v.agente && (
                      <span className="ml-2 opacity-70">
                        · muestra {v.agente.nombre.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estado */}
                <Badge tone={tonoParaEstado(v.estado)}>
                  {labelEstado[v.estado] ?? v.estado}
                </Badge>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

---

## 8 · `NuevaVisitaModal` · `app/agenda/NuevaVisitaModal.tsx`

Modal de creación con form. Acepta valores pre-llenados (`propiedadIdPrellenado`, `leadIdPrellenado`, `fechaPrellenada`) para cuando se abre desde una ficha de propiedad o lead.

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";
import { crearVisita } from "./actions";

type Props = {
  open: boolean;
  onClose: () => void;
  propiedadIdPrellenado?: string;
  leadIdPrellenado?: string;
  fechaPrellenada?: string;
  propiedades: Array<{ id: string; direccion: string; barrio: string | null }>;
  leads: Array<{ id: string; nombre: string; telefono: string | null }>;
  usuarios: Array<{ id: string; nombre: string; rol: string }>;
};

export function NuevaVisitaModal({
  open,
  onClose,
  propiedadIdPrellenado,
  leadIdPrellenado,
  fechaPrellenada,
  propiedades,
  leads,
  usuarios,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await crearVisita(formData);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva visita"
      subtitle="Agendá una visita a una propiedad"
      maxWidth="md"
    >
      <form action={handleSubmit} className="flex flex-col gap-4">
        <Field label="Propiedad" required>
          <Select
            name="propiedad_id"
            defaultValue={propiedadIdPrellenado ?? ""}
            required
          >
            <option value="">Seleccionar propiedad…</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.direccion}
                {p.barrio ? ` · ${p.barrio}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Lead" required>
          <Select
            name="lead_id"
            defaultValue={leadIdPrellenado ?? ""}
            required
          >
            <option value="">Seleccionar lead…</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
                {l.telefono ? ` · ${l.telefono}` : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Quién muestra" required>
          <Select name="agente_id" required>
            <option value="">Seleccionar agente…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha" required>
            <Input
              type="date"
              name="fecha"
              defaultValue={fechaPrellenada}
              required
            />
          </Field>
          <Field label="Hora" required>
            <Input type="time" name="hora" required />
          </Field>
        </div>

        <Field label="Notas" hint="Opcional · contexto para el agente">
          <textarea
            name="notas"
            rows={3}
            className="w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
            placeholder="Ej: el lead conoce la zona, le interesa el balcón..."
          />
        </Field>

        {error && (
          <div className="rounded-sm bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
            {error}
          </div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending && (
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            )}
            Agendar visita
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

---

## 9 · `VisitaDetalleModal` · `app/agenda/VisitaDetalleModal.tsx`

Modal de detalle. Muestra info de la visita + acciones según estado.

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { formatearDiaLargo, formatearHora, parsearFechaISO } from "@/lib/fechas";
import {
  cambiarEstadoVisita,
  reagendarVisita,
  editarNotasVisita,
} from "./actions";
import type {
  VisitaConRelaciones,
  EstadoVisita,
} from "@/lib/supabase/queries/visitas";
import { Loader2 } from "lucide-react";

const labelEstado: Record<EstadoVisita, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

type Props = {
  visita: VisitaConRelaciones | null;
  onClose: () => void;
};

export function VisitaDetalleModal({ visita, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modoReagendar, setModoReagendar] = useState(false);
  const [notasEdit, setNotasEdit] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!visita) return null;

  const fecha = parsearFechaISO(visita.fecha);

  function handleCambiarEstado(nuevoEstado: EstadoVisita) {
    setError(null);
    startTransition(async () => {
      const r = await cambiarEstadoVisita(visita!.id, nuevoEstado);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
      onClose();
    });
  }

  function handleReagendar(formData: FormData) {
    setError(null);
    const fecha = String(formData.get("fecha") || "");
    const hora = String(formData.get("hora") || "");
    startTransition(async () => {
      const r = await reagendarVisita(visita!.id, fecha, hora);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setModoReagendar(false);
      router.refresh();
      onClose();
    });
  }

  function handleGuardarNotas() {
    if (notasEdit === null) return;
    setError(null);
    startTransition(async () => {
      const r = await editarNotasVisita(visita!.id, notasEdit);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setNotasEdit(null);
      router.refresh();
    });
  }

  const esFinal =
    visita.estado === "realizada" ||
    visita.estado === "cancelada" ||
    visita.estado === "no_asistio";

  return (
    <Modal
      open={!!visita}
      onClose={() => {
        setModoReagendar(false);
        setNotasEdit(null);
        setError(null);
        onClose();
      }}
      title={visita.propiedad?.direccion ?? "Propiedad eliminada"}
      subtitle={`${formatearDiaLargo(fecha)} · ${formatearHora(visita.hora)}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
        {/* Estado + acciones rápidas */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Estado:
            </span>
            <Badge tone={tonoParaEstado(visita.estado)}>
              {labelEstado[visita.estado]}
            </Badge>
          </div>
        </div>

        {/* Info de propiedad + lead + agente */}
        <dl className="grid grid-cols-1 gap-3 rounded-sm bg-cream-50 px-4 py-3">
          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Propiedad
            </dt>
            <dd className="mt-0.5">
              {visita.propiedad ? (
                <Link
                  href={`/propiedades/${visita.propiedad.id}`}
                  className="font-display text-base text-ink-900 underline-offset-4 hover:underline"
                >
                  {visita.propiedad.direccion}
                </Link>
              ) : (
                <span className="text-ink-400">Eliminada</span>
              )}
            </dd>
          </div>

          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Lead
            </dt>
            <dd className="mt-0.5">
              {visita.lead ? (
                <Link
                  href={`/leads/${visita.lead.id}`}
                  className="font-display text-base text-ink-900 underline-offset-4 hover:underline"
                >
                  {visita.lead.nombre}
                </Link>
              ) : (
                <span className="text-ink-400">Eliminado</span>
              )}
              {visita.lead?.telefono && (
                <span className="ml-2 font-mono text-xs text-ink-500">
                  · {visita.lead.telefono}
                </span>
              )}
            </dd>
          </div>

          <div>
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Quién muestra
            </dt>
            <dd className="mt-0.5 text-sm text-ink-900">
              {visita.agente?.nombre ?? "Sin asignar"}
            </dd>
          </div>
        </dl>

        {/* Notas */}
        <div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Notas
            </span>
            {notasEdit === null ? (
              <button
                type="button"
                onClick={() => setNotasEdit(visita.notas ?? "")}
                className="font-mono text-[10px] uppercase tracking-widest text-ink-400 hover:text-ink-900"
              >
                Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNotasEdit(null)}
                  className="font-mono text-[10px] uppercase tracking-widest text-ink-400 hover:text-ink-900"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarNotas}
                  disabled={isPending}
                  className="font-mono text-[10px] uppercase tracking-widest text-brick-700 hover:text-brick-600"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
          {notasEdit === null ? (
            <p className="mt-2 text-sm text-ink-700">
              {visita.notas?.trim() || (
                <span className="text-ink-400 italic">Sin notas</span>
              )}
            </p>
          ) : (
            <textarea
              value={notasEdit}
              onChange={(e) => setNotasEdit(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
            />
          )}
        </div>

        {/* Modo reagendar (form inline) */}
        {modoReagendar && (
          <form action={handleReagendar} className="rounded-sm bg-amber-50 px-4 py-3">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-amber-500">
              Reagendar visita
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nueva fecha" required>
                <Input type="date" name="fecha" defaultValue={visita.fecha} required />
              </Field>
              <Field label="Nueva hora" required>
                <Input
                  type="time"
                  name="hora"
                  defaultValue={formatearHora(visita.hora)}
                  required
                />
              </Field>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Al reagendar, el estado vuelve a "agendada" y hay que reconfirmar
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setModoReagendar(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={isPending}>
                {isPending && (
                  <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                )}
                Confirmar reagenda
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="rounded-sm bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
            {error}
          </div>
        )}

        {/* Acciones de cambio de estado */}
        {!esFinal && !modoReagendar && (
          <div className="flex flex-wrap gap-2 border-t border-cream-200 pt-4">
            {visita.estado === "agendada" && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleCambiarEstado("confirmada")}
                disabled={isPending}
              >
                Confirmar
              </Button>
            )}
            {visita.estado === "confirmada" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCambiarEstado("realizada")}
                  disabled={isPending}
                >
                  Marcar realizada
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCambiarEstado("no_asistio")}
                  disabled={isPending}
                >
                  No asistió
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setModoReagendar(true)}
              disabled={isPending}
            >
              Reagendar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleCambiarEstado("cancelada")}
              disabled={isPending}
            >
              Cancelar visita
            </Button>
          </div>
        )}

        {esFinal && (
          <p className="border-t border-cream-200 pt-4 font-mono text-[10px] uppercase tracking-widest text-ink-400">
            Visita {labelEstado[visita.estado].toLowerCase()} · sin acciones disponibles
          </p>
        )}
      </div>
    </Modal>
  );
}
```

---

## 10 · Habilitar `/agenda` en el sidebar

En `components/SidebarNav.tsx`, cambiar la entrada de Agenda de `disabled: true` a habilitada:

```tsx
// Antes
{ href: "/agenda", label: "Agenda", icon: Calendar, disabled: true },

// Después
{ href: "/agenda", label: "Agenda", icon: Calendar },
```

---

## 11 · Enlaces "Agendar visita" desde fichas

### En `app/propiedades/[id]/page.tsx`

Buscar el Card de "Visitas" del aside (debe existir desde la Vuelta 3). En la parte de header de ese Card, sumar un botón "Agendar":

```tsx
<Card>
  <CardHeader>
    <CardSubtitle>Visitas</CardSubtitle>
    <Link
      href={`/agenda?nueva=1&propiedad=${propiedad.id}`}
      className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
    >
      + Agendar
    </Link>
  </CardHeader>
  {/* ... lista de visitas existentes */}
</Card>
```

### En `app/leads/[id]/page.tsx`

Mismo patrón en el Card de visitas o en el Card de "Acciones":

```tsx
<Link
  href={`/agenda?nueva=1&lead=${lead.id}`}
  className="..."
>
  + Agendar visita
</Link>
```

### Adaptar `app/agenda/page.tsx` para leer estos params

Agregar al parsing de `searchParams`:

```tsx
const { semana, nueva, propiedad, lead } = await searchParams;
```

Y pasar a `<AgendaSemanal>` como prop `aperturaInicial`:

```tsx
<AgendaSemanal
  semanaInicio={...}
  visitas={...}
  propiedadesSelect={...}
  leadsSelect={...}
  usuariosSelect={...}
  aperturaInicial={
    nueva === "1"
      ? { propiedadId: propiedad, leadId: lead }
      : undefined
  }
/>
```

Y en `AgendaSemanal`, en el primer render abrir el modal:

```tsx
type Props = {
  // ... + 
  aperturaInicial?: { propiedadId?: string; leadId?: string };
};

export function AgendaSemanal({ aperturaInicial, ...props }: Props) {
  // ...
  const [modalNueva, setModalNueva] = useState<{...}>(
    aperturaInicial
      ? { open: true, ...aperturaInicial }
      : { open: false }
  );
  // ...
}
```

---

## 12 · Smoke test

Como Carolina (administrativa):

1. `/agenda` → ver semana actual con días listados, visitas del seed visibles
2. Click en visita existente → modal con detalle + acciones
3. Click "Confirmar" en una visita agendada → estado cambia, modal cierra
4. Click "Reagendar" → form inline con date/time → cambiar → vuelve a agendada
5. Click "Nueva visita" → modal con form → completar → se crea, modal cierra
6. Navegación: `< Anterior` → ver semana previa, "Hoy" → vuelve, `Siguiente >` → semana próxima
7. Click "Editar notas" → textarea → guardar → notas actualizadas
8. Una visita realizada → modal sin acciones, solo "Visita realizada · sin acciones"

Cross-link:

9. Ir a `/propiedades/[cabildo-2840]` → click "+ Agendar" → debería abrir `/agenda?nueva=1&propiedad=...` con el modal abierto y propiedad pre-llenada
10. Ir a `/leads/[lucia]` → click "+ Agendar visita" → idem con lead pre-llenado

Visual check:

- Los días con visitas se ven con tipografía editorial (hora en serif tabular, dirección en serif)
- "Hoy" se destaca con borde más marcado + tag "· Hoy" en brick
- Días sin visitas muestran "Sin visitas" en mono + CTA "Agendar visita"
- Modales con header serif + subtitle mono tracking abierto
- Badges de estado funcionan: agendada (slate), confirmada (plum), realizada (green), cancelada (slate sin destacar), no_asistio (amber)

---

## 13 · Verificación técnica

```bash
pnpm type-check
pnpm lint
```

Es probable que Supabase se queje de tipos en los joins (`propiedad:propiedades(...)`). El cast `as unknown as VisitaConRelaciones[]` en las queries lo resuelve — ya está incluido.

---

## 14 · Commit y push

```bash
git add .
git commit -m "feat(agenda): vista semanal de visitas con CRUD básico"
git push
```

---

## 15 · Confirmación final

Mostrame:

- Output de `pnpm type-check` y `pnpm lint`
- Hash del commit + stats (`git diff --stat HEAD~1`)
- Smoke test markers HTTP de `/agenda`, `/agenda?semana=2026-05-25`, `/agenda?nueva=1&propiedad=...`
- Confirmación de los flujos: crear, confirmar, reagendar, editar notas, marcar realizada
- Nota especial si:
  - El schema de `visitas` era diferente y tuviste que ajustar nombres
  - Algún cross-link no funcionó (ej. el modal no se abre con `?nueva=1`)
  - Algo del modal nativo `<dialog>` se comporta raro en tu navegador

Si algún paso falla, parate y avisame antes de improvisar.
