# Pantalla de Leads · Cantú Propiedades · Vuelta A

Lista + ficha de leads. Patrón calcado del de propiedades, adaptado al modelo de Lead. Suma una pieza nueva: el bloque "Otros leads con este teléfono" en la ficha, que ya entrega valor sin necesidad del flujo de creación (vuelta B).

## Contexto

- **Repo:** `cantu_propiedades`
- **Estado actual:** pantalla `/propiedades` funcional con filtrado por rol validado. Layout autenticado, componentes UI base, queries centralizadas — todo armado.
- **Stack:** Next.js 14 App Router · Tailwind · Supabase · lucide-react
- **Doc fuente:** `docs/modelo-datos.md` (entidad `leads` + `consultas_lead` + `visitas` + `comunicaciones`) y `docs/discovery.md` (lo que pidió Carolina · detección de duplicados)

## Qué tiene que quedar al final

1. Lista de leads en `/leads` con filtros + búsqueda
2. Ficha de lead en `/leads/[id]` con historial cross-propiedad, visitas, comunicaciones
3. Bloque "Otros leads con este teléfono" cuando aplique
4. Sidebar con item "Leads" habilitado
5. Filtrado por rol funcionando (notas internas solo para socios)
6. Todo commiteado y pusheado

---

## 1 · Queries centralizadas

Crear `lib/supabase/queries/leads.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/auth/current-user";
import { puedeVerNotasInternas } from "@/lib/auth/current-user";

const COLUMNAS_LEAD_BASE = "id, nombre, telefono, email, propiedad_id, canal_origen, referido_por_dueno_id, estado, responsable_id, proxima_accion, fecha_proxima_accion, criterio_busqueda, creado_en, actualizado_en";

function columnasLead(rol: RolUsuario): string {
  const cols = [COLUMNAS_LEAD_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  return cols.join(", ");
}

export type FiltrosLeads = {
  busqueda?: string;
  estado?: string;
  canal_origen?: string;
  responsable_id?: string;
};

export async function listarLeads(rol: RolUsuario, filtros: FiltrosLeads = {}) {
  const supabase = createClient();

  let query = supabase
    .from("leads")
    .select(`
      ${columnasLead(rol)},
      propiedad:propiedades(id, direccion),
      responsable:usuarios!leads_responsable_id_fkey(id, nombre),
      referido_por:duenos(id, nombre)
    `)
    .order("creado_en", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.canal_origen) query = query.eq("canal_origen", filtros.canal_origen);
  if (filtros.responsable_id) query = query.eq("responsable_id", filtros.responsable_id);
  if (filtros.busqueda) {
    // Busca en nombre OR teléfono
    query = query.or(`nombre.ilike.%${filtros.busqueda}%,telefono.ilike.%${filtros.busqueda}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function obtenerLead(id: string, rol: RolUsuario) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(`
      ${columnasLead(rol)},
      propiedad:propiedades(id, direccion, tipo, operacion, precio_actual, moneda, estado),
      responsable:usuarios!leads_responsable_id_fkey(id, nombre),
      referido_por:duenos(id, nombre, telefono),
      consultas:consultas_lead(
        id, fecha, canal_origen, notas,
        propiedad:propiedades(id, direccion, tipo)
      ),
      visitas(
        id, fecha_agendada, estado, devolucion_prospecto,
        propiedad:propiedades(id, direccion),
        responsable:usuarios!visitas_responsable_id_fkey(nombre)
      ),
      comunicaciones(id, tipo, contenido, fecha, registrada_por:usuarios(nombre))
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Devuelve OTROS leads que comparten el mismo teléfono.
 * Usado para el bloque "Posibles duplicados" en la ficha.
 */
export async function leadsConMismoTelefono(leadId: string, telefono: string | null) {
  if (!telefono) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select("id, nombre, propiedad:propiedades(direccion), canal_origen, estado, creado_en")
    .eq("telefono", telefono)
    .neq("id", leadId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Lista de socios (titular + operativo) para el filtro de responsable.
 */
export async function listarSociosActivos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rol")
    .in("rol", ["socia_titular", "socio_operativo"])
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}
```

---

## 2 · Habilitar "Leads" en el Sidebar

Editar `components/Sidebar.tsx` y cambiar el item de Leads de `disabled: true` a `disabled: false`. La línea queda así:

```tsx
{ href: "/leads", label: "Leads", icon: Users, disabled: false },
```

El resto del array queda igual (Tablero, Agenda, Reportes siguen disabled).

---

## 3 · Página `/leads` · lista

### `app/(dashboard)/leads/page.tsx`

```tsx
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarLeads, listarSociosActivos } from "@/lib/supabase/queries/leads";
import { Card } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, Search } from "lucide-react";

const estadosLead = ["nuevo", "contactado", "con_visita", "con_oferta", "sin_interes", "cerrado_exitoso", "archivado"];
const canales = [
  "whatsapp_oficina",
  "whatsapp_zulma",
  "whatsapp_martin",
  "mail",
  "formulario_web",
  "zonaprop",
  "argenprop",
  "mercadolibre",
  "soloduenos",
  "fb_marketplace",
  "referido_zulma",
  "wsp_inmobiliarias_coghlan",
  "otro",
];

type SearchParams = {
  q?: string;
  estado?: string;
  canal_origen?: string;
  responsable_id?: string;
};

function tonoParaEstadoLead(estado: string) {
  const map: Record<string, any> = {
    nuevo: "blue",
    contactado: "yellow",
    con_visita: "violet",
    con_oferta: "orange",
    sin_interes: "neutral",
    cerrado_exitoso: "green",
    archivado: "neutral",
  };
  return map[estado] ?? "neutral";
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const [leads, socios] = await Promise.all([
    listarLeads(usuario.rol, {
      busqueda: searchParams.q,
      estado: searchParams.estado,
      canal_origen: searchParams.canal_origen,
      responsable_id: searchParams.responsable_id,
    }),
    listarSociosActivos(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink/60">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} en seguimiento
          </p>
        </div>
        <Button disabled title="Próximamente · vuelta B">
          <Plus size={16} />
          Nuevo lead
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
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
                placeholder="Nombre o teléfono..."
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
              {estadosLead.map((e) => (
                <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Canal
            </label>
            <Select name="canal_origen" defaultValue={searchParams.canal_origen ?? ""}>
              <option value="">Todos</option>
              {canales.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Responsable
            </label>
            <Select name="responsable_id" defaultValue={searchParams.responsable_id ?? ""}>
              <option value="">Todos</option>
              {socios.map((s: any) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">Filtrar</Button>
            <Link href="/leads">
              <Button type="button" variant="ghost">Limpiar</Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card className="p-0 overflow-hidden">
        {leads.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/50">
            No hay leads que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Nombre</th>
                <th className="px-6 py-3 text-left font-medium">Teléfono</th>
                <th className="px-6 py-3 text-left font-medium">Propiedad</th>
                <th className="px-6 py-3 text-left font-medium">Canal</th>
                <th className="px-6 py-3 text-left font-medium">Estado</th>
                <th className="px-6 py-3 text-left font-medium">Responsable</th>
                <th className="px-6 py-3 text-left font-medium">Próxima acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-line/10">
                  <td className="px-6 py-4">
                    <Link
                      href={`/leads/${l.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {l.nombre}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-ink/70">{l.telefono ?? "—"}</td>
                  <td className="px-6 py-4 text-ink/70">
                    {l.propiedad?.direccion ?? <span className="italic text-ink/40">general</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs capitalize text-ink/60">
                      {l.canal_origen.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={tonoParaEstadoLead(l.estado)}>
                      {l.estado.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-ink/70">{l.responsable?.nombre ?? "—"}</td>
                  <td className="px-6 py-4 text-ink/60">
                    {l.proxima_accion ? (
                      <>
                        <div className="text-xs">{l.proxima_accion}</div>
                        <div className="text-xs text-ink/40">{formatearFecha(l.fecha_proxima_accion)}</div>
                      </>
                    ) : (
                      "—"
                    )}
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

## 4 · Página `/leads/[id]` · ficha

### `app/(dashboard)/leads/[id]/page.tsx`

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUsuarioActual,
  puedeVerNotasInternas,
} from "@/lib/auth/current-user";
import { obtenerLead, leadsConMismoTelefono } from "@/lib/supabase/queries/leads";
import { Card, CardHeader, CardTitle, CardSubtitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaHora(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tonoParaEstadoLead(estado: string): any {
  const map: Record<string, any> = {
    nuevo: "blue",
    contactado: "yellow",
    con_visita: "violet",
    con_oferta: "orange",
    sin_interes: "neutral",
    cerrado_exitoso: "green",
    archivado: "neutral",
  };
  return map[estado] ?? "neutral";
}

export default async function LeadDetalle({
  params,
}: {
  params: { id: string };
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  let lead: any;
  try {
    lead = await obtenerLead(params.id, usuario.rol);
  } catch {
    notFound();
  }
  if (!lead) notFound();

  const duplicados = await leadsConMismoTelefono(lead.id, lead.telefono);
  const verNotas = puedeVerNotasInternas(usuario.rol);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a leads
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tonoParaEstadoLead(lead.estado)}>
              {lead.estado.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs capitalize text-ink/50">
              vía {lead.canal_origen.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {lead.nombre}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {lead.telefono ?? "sin teléfono"} · {lead.email ?? "sin email"} ·
            ingresó {formatearFecha(lead.creado_en)}
          </p>
        </div>
      </div>

      {/* ALERTA · posibles duplicados */}
      {duplicados.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/40">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-orange-600" />
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-orange-900">
                Otros leads con este teléfono
              </h3>
              <p className="mt-1 text-sm text-orange-800/80">
                Este número apareció en {duplicados.length}{" "}
                {duplicados.length === 1 ? "consulta previa" : "consultas previas"}.
                Es muy probable que sea la misma persona.
              </p>
              <ul className="mt-3 divide-y divide-orange-200/60">
                {duplicados.map((d: any) => (
                  <li key={d.id} className="py-2">
                    <Link
                      href={`/leads/${d.id}`}
                      className="group flex items-center justify-between"
                    >
                      <div className="text-sm">
                        <span className="font-medium text-orange-900 group-hover:underline">
                          {d.nombre}
                        </span>
                        <span className="ml-2 text-orange-800/70">
                          {d.propiedad?.direccion ?? "consulta general"} · vía{" "}
                          {d.canal_origen.replace(/_/g, " ")}
                        </span>
                      </div>
                      <ExternalLink size={12} className="text-orange-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="col-span-2 space-y-6">
          {/* Propiedad de interés */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedad de interés</CardTitle>
            </CardHeader>
            {lead.propiedad ? (
              <Link
                href={`/propiedades/${lead.propiedad.id}`}
                className="group flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-medium text-ink group-hover:text-accent">
                    {lead.propiedad.direccion}
                  </div>
                  <div className="mt-1 text-sm capitalize text-ink/60">
                    {lead.propiedad.tipo} · {lead.propiedad.operacion} ·{" "}
                    <Badge tone="neutral">{lead.propiedad.estado.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                {lead.propiedad.precio_actual && (
                  <div className="text-right text-sm font-medium text-ink">
                    {lead.propiedad.moneda?.toUpperCase()}{" "}
                    {new Intl.NumberFormat("es-AR").format(lead.propiedad.precio_actual)}
                  </div>
                )}
              </Link>
            ) : (
              <p className="text-sm text-ink/50">
                Sin propiedad asignada · es una búsqueda general.
              </p>
            )}

            {/* Criterio de búsqueda · solo si es lead general */}
            {!lead.propiedad && lead.criterio_busqueda && (
              <div className="mt-4 rounded-md bg-line/20 p-3 text-sm">
                <div className="mb-2 text-xs uppercase tracking-wide text-ink/50">
                  Criterio
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-ink/70">
                  {JSON.stringify(lead.criterio_busqueda, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {/* Si es referido por un dueño */}
          {lead.referido_por && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="text-violet-900">Referido personal</CardTitle>
                <CardSubtitle className="text-violet-700">
                  Este lead llegó por recomendación
                </CardSubtitle>
              </CardHeader>
              <p className="text-sm text-violet-900">
                Lo refirió{" "}
                <span className="font-semibold">{lead.referido_por.nombre}</span>
                {lead.referido_por.telefono && (
                  <span className="text-violet-800/70"> · {lead.referido_por.telefono}</span>
                )}
              </p>
            </Card>
          )}

          {/* Historial cross-propiedad */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de consultas</CardTitle>
              <CardSubtitle>Por qué propiedades preguntó este lead</CardSubtitle>
            </CardHeader>
            {(lead.consultas?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">
                Sin consultas previas registradas.
              </p>
            ) : (
              <ul className="space-y-3">
                {lead.consultas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between border-l-2 border-line pl-4"
                    >
                      <div>
                        <Link
                          href={`/propiedades/${c.propiedad?.id}`}
                          className="text-sm font-medium text-ink hover:text-accent"
                        >
                          {c.propiedad?.direccion ?? "Propiedad sin asignar"}
                        </Link>
                        <div className="text-xs text-ink/50">
                          {formatearFechaHora(c.fecha)} · vía{" "}
                          {c.canal_origen.replace(/_/g, " ")}
                        </div>
                        {c.notas && (
                          <p className="mt-1 text-sm italic text-ink/60">
                            "{c.notas}"
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {/* Visitas */}
          <Card>
            <CardHeader>
              <CardTitle>Visitas</CardTitle>
            </CardHeader>
            {(lead.visitas?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">Sin visitas registradas.</p>
            ) : (
              <ul className="space-y-4">
                {lead.visitas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha_agendada).getTime() -
                      new Date(a.fecha_agendada).getTime(),
                  )
                  .map((v: any) => (
                    <li key={v.id} className="border-l-2 border-line pl-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-ink">
                          {v.propiedad?.direccion ?? "—"}
                        </div>
                        <Badge tone="neutral">{v.estado.replace(/_/g, " ")}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-ink/50">
                        {formatearFechaHora(v.fecha_agendada)} · con{" "}
                        {v.responsable?.nombre ?? "—"}
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

          {/* Comunicaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Comunicaciones</CardTitle>
            </CardHeader>
            {(lead.comunicaciones?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">Sin comunicaciones registradas.</p>
            ) : (
              <ul className="space-y-3">
                {lead.comunicaciones
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="border-l-2 border-line pl-4 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs capitalize text-ink/50">
                          {c.tipo.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-ink/40">
                          {formatearFechaHora(c.fecha)}
                        </span>
                      </div>
                      <p className="mt-1 text-ink/80">{c.contenido}</p>
                      {c.registrada_por?.nombre && (
                        <p className="mt-1 text-xs text-ink/40">
                          registrado por {c.registrada_por.nombre}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {/* Notas internas · solo socios */}
          {verNotas && lead.notas_internas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
                <CardSubtitle>Solo visible para socios</CardSubtitle>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
                {lead.notas_internas}
              </p>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Próxima acción */}
          {lead.proxima_accion && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle>Próxima acción</CardTitle>
                <CardSubtitle>
                  {formatearFechaHora(lead.fecha_proxima_accion)}
                </CardSubtitle>
              </CardHeader>
              <p className="text-sm text-ink/80">{lead.proxima_accion}</p>
            </Card>
          )}

          {/* Responsable */}
          <Card>
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <div className="text-sm">
              {lead.responsable ? (
                <span className="font-medium text-ink">
                  {lead.responsable.nombre}
                </span>
              ) : (
                <span className="text-ink/50">Sin asignar</span>
              )}
            </div>
          </Card>

          {/* Datos rápidos */}
          <Card>
            <CardHeader>
              <CardTitle>Datos</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Canal de origen
                </div>
                <div className="capitalize text-ink/70">
                  {lead.canal_origen.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Última actualización
                </div>
                <div className="text-ink/70">
                  {formatearFechaHora(lead.actualizado_en)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Creación
                </div>
                <div className="text-ink/70">
                  {formatearFechaHora(lead.creado_en)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

---

## 5 · Smoke test

Con `pnpm dev` corriendo, probá lo siguiente:

### Lista

1. Andá a `/leads` → 5 leads (es lo que tiene el seed)
2. Verificá que **Lucía Fernández aparece dos veces** (mismo teléfono `+5491155112233`). Ese es el caso de duplicado.
3. Probá filtros:
   - `?estado=nuevo` → 2 leads
   - `?canal_origen=referido_zulma` → 1 lead (Ariel Sobrino)
   - `?q=Lucía` → 2 leads (las dos entradas de Lucía)

### Ficha · caso duplicado

1. Click en cualquiera de las dos "Lucía Fernández"
2. Arriba aparece la **alerta naranja "Otros leads con este teléfono"** con link a la otra entrada
3. Bajás y ves el historial de consultas (2 propiedades distintas)

### Ficha · referido_zulma

1. Andá al lead **Ariel Sobrino** (sobrino de Inés)
2. Aparece el bloque violeta **"Referido personal"** con el nombre de Inés Maldonado
3. La propiedad de interés está vacía (es un lead general)
4. El criterio de búsqueda aparece como JSON formateado abajo

### Filtrado por rol

1. Logueate como Carolina → andá a la ficha de cualquier lead con `notas_internas` cargadas → el bloque de notas NO aparece
2. Logueate como Zulma o Martín → el bloque de notas SÍ aparece

### Navegación entre leads y propiedades

1. Desde la ficha de un lead, click en la propiedad de interés → te lleva a la ficha de la propiedad
2. Desde la ficha de una propiedad, en el bloque "Leads asociados", click en un lead → te lleva a la ficha del lead

---

## 6 · Verificación de tipos y lint

```bash
pnpm type-check
pnpm lint
```

Si TypeScript se queja sobre los joins anidados de Supabase, usar `as any` localmente (mismo patrón que ya aplicamos en propiedades). No es bonito pero es consistente con la deuda técnica anotada en `docs/decisiones.md`.

---

## 7 · Commit y push

```bash
git add .
git commit -m "feat(leads): lista + ficha con historial cross-propiedad y alerta de duplicados"
git push
```

---

## 8 · Confirmación final

Mostrame:

- Output de la lista `/leads` (lo verifico contra el seed)
- Captura o markers del caso de Lucía Fernández (con la alerta naranja visible)
- Captura o markers del lead Ariel Sobrino (con el bloque violeta de referido)
- Output de `pnpm type-check` y `pnpm lint`
- Hash del commit
- Cualquier error que haya aparecido y cómo lo resolviste

Si algún paso falla, parate y avisame antes de seguir improvisando.
