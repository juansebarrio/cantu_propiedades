# Pantalla de Leads · Cantú Propiedades · Vuelta B

Creación y edición de leads. Esta vuelta introduce **escritura** por primera vez en el producto: formularios reales con Server Actions, validación, y la pieza emblemática del proyecto — **detección activa de duplicados** mientras se carga un teléfono.

Al terminar, Carolina puede:
1. Cargar un lead nuevo desde un form
2. Si el teléfono ya existe en otro lead, el sistema le avisa antes de guardar
3. Elegir si asociar como consulta nueva del lead existente o crear lead nuevo igual
4. Editar leads (estado, próxima acción, notas, responsable)

## Contexto

- **Repo:** `cantu_propiedades` con auth, /propiedades, /leads (lista + ficha) funcionando
- **Stack:** Next.js 14 App Router · Server Actions · Tailwind · Supabase
- **Doc fuente:** `docs/discovery.md` § Carolina · *"Sería un sueño que cuando un lead nuevo llega, el sistema me diga: esta persona ya consultó hace dos meses por otra propiedad"*

---

## 1 · Extender `lib/supabase/queries/leads.ts`

Agregar al final del archivo existente:

```typescript
/**
 * Verifica si un teléfono ya pertenece a otro lead.
 * Devuelve los leads coincidentes (puede haber más de uno si hubo carga sin chequeo).
 */
export async function verificarTelefonoDuplicado(telefono: string) {
  if (!telefono || telefono.trim().length < 6) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(`
      id, nombre, telefono, email, estado, canal_origen, creado_en,
      propiedad:propiedades(id, direccion)
    `)
    .eq("telefono", telefono.trim())
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Lista de propiedades disponibles para asignar a un lead.
 * Excluye archivadas y cerradas.
 */
export async function listarPropiedadesParaLead() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select("id, direccion, tipo, operacion, estado")
    .not("estado", "in", "(cerrada,archivada)")
    .order("direccion");
  if (error) throw error;
  return data ?? [];
}

/**
 * Lista de dueños · para el caso referido_zulma.
 */
export async function listarDuenosParaReferencia() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("duenos")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}
```

---

## 2 · Server Actions · `app/(dashboard)/leads/actions.ts`

Crear archivo nuevo:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/current-user";

type ActionResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

/**
 * Crea un lead nuevo. Si el teléfono ya existe, NO valida acá:
 * la validación de duplicados se hace en el cliente con verificarTelefonoDuplicado.
 * Esta acción asume que el user ya decidió "crear igual aunque haya duplicado".
 */
export async function crearLead(formData: FormData): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const nombre = formData.get("nombre")?.toString().trim();
  const telefono = formData.get("telefono")?.toString().trim() || null;
  const email = formData.get("email")?.toString().trim() || null;
  const propiedad_id = formData.get("propiedad_id")?.toString() || null;
  const canal_origen = formData.get("canal_origen")?.toString();
  const referido_por_dueno_id = formData.get("referido_por_dueno_id")?.toString() || null;
  const responsable_id = formData.get("responsable_id")?.toString() || null;
  const proxima_accion = formData.get("proxima_accion")?.toString() || null;
  const fecha_proxima_accion = formData.get("fecha_proxima_accion")?.toString() || null;
  const notas_internas = formData.get("notas_internas")?.toString() || null;

  // Validación
  const fieldErrors: Record<string, string> = {};
  if (!nombre) fieldErrors.nombre = "El nombre es obligatorio";
  if (!canal_origen) fieldErrors.canal_origen = "Indicá por dónde llegó el lead";
  if (canal_origen === "referido_zulma" && !referido_por_dueno_id) {
    fieldErrors.referido_por_dueno_id = "Elegí qué dueño lo refirió";
  }
  if (!telefono && !email) {
    fieldErrors.telefono = "Cargá al menos teléfono o email";
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      nombre,
      telefono,
      email,
      propiedad_id,
      canal_origen,
      referido_por_dueno_id,
      responsable_id,
      proxima_accion,
      fecha_proxima_accion: fecha_proxima_accion || null,
      notas_internas,
      creado_por_id: usuario.id,
      estado: "nuevo",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

/**
 * Asocia una nueva consulta a un lead existente.
 * Caso: Lucía Fernández ya está en el sistema y vuelve a consultar por otra propiedad.
 */
export async function agregarConsultaALead(formData: FormData): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const lead_id = formData.get("lead_id")?.toString();
  const propiedad_id = formData.get("propiedad_id")?.toString();
  const canal_origen = formData.get("canal_origen")?.toString();
  const notas = formData.get("notas")?.toString() || null;

  const fieldErrors: Record<string, string> = {};
  if (!lead_id) fieldErrors.lead_id = "Lead no encontrado";
  if (!propiedad_id) fieldErrors.propiedad_id = "Elegí la propiedad de la consulta";
  if (!canal_origen) fieldErrors.canal_origen = "Elegí el canal";
  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const { error } = await supabase.from("consultas_lead").insert({
    lead_id: lead_id!,
    propiedad_id: propiedad_id!,
    canal_origen: canal_origen!,
    notas,
    creado_por_id: usuario.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${lead_id}`);
  redirect(`/leads/${lead_id}`);
}

/**
 * Edita un lead existente. Solo campos editables: estado, responsable,
 * próxima acción, fecha próxima acción, notas internas.
 */
export async function actualizarLead(
  leadId: string,
  formData: FormData,
): Promise<ActionResult> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "Sesión expirada" };

  const estado = formData.get("estado")?.toString();
  const responsable_id = formData.get("responsable_id")?.toString() || null;
  const proxima_accion = formData.get("proxima_accion")?.toString() || null;
  const fecha_proxima_accion = formData.get("fecha_proxima_accion")?.toString() || null;
  const notas_internas = formData.get("notas_internas")?.toString() || null;

  const supabase = createClient();
  const { error } = await supabase
    .from("leads")
    .update({
      estado,
      responsable_id,
      proxima_accion,
      fecha_proxima_accion: fecha_proxima_accion || null,
      notas_internas,
    })
    .eq("id", leadId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

/**
 * Server action puente para el chequeo de duplicados desde el form cliente.
 */
export async function chequearDuplicado(telefono: string) {
  const { verificarTelefonoDuplicado } = await import("@/lib/supabase/queries/leads");
  return await verificarTelefonoDuplicado(telefono);
}
```

---

## 3 · Componente `<LeadFormNuevo>` · Client Component

Crear `components/lead/LeadFormNuevo.tsx`:

```tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { crearLead, agregarConsultaALead, chequearDuplicado } from "@/app/(dashboard)/leads/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { AlertCircle, Loader2 } from "lucide-react";

type Propiedad = { id: string; direccion: string; tipo: string; operacion: string };
type Dueno = { id: string; nombre: string };
type Socio = { id: string; nombre: string };

type LeadDuplicado = {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  canal_origen: string;
  creado_en: string;
  propiedad: { id: string; direccion: string } | null;
};

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

type Modo = "crear-lead" | "asociar-consulta";

export function LeadFormNuevo({
  propiedades,
  duenos,
  socios,
}: {
  propiedades: Propiedad[];
  duenos: Dueno[];
  socios: Socio[];
}) {
  const [isPending, startTransition] = useTransition();
  const [duplicados, setDuplicados] = useState<LeadDuplicado[]>([]);
  const [chequeando, setChequeando] = useState(false);
  const [telefonoActual, setTelefonoActual] = useState("");
  const [modo, setModo] = useState<Modo>("crear-lead");
  const [leadElegido, setLeadElegido] = useState<LeadDuplicado | null>(null);
  const [canalOrigen, setCanalOrigen] = useState("");
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Chequeo de duplicados al perder foco del teléfono
  async function handleTelefonoBlur(value: string) {
    const t = value.trim();
    if (t.length < 6) {
      setDuplicados([]);
      return;
    }
    if (t === telefonoActual) return;
    setTelefonoActual(t);
    setChequeando(true);
    try {
      const result = await chequearDuplicado(t);
      setDuplicados(result as LeadDuplicado[]);
    } catch (err) {
      console.error("Error chequeando duplicado", err);
      setDuplicados([]);
    } finally {
      setChequeando(false);
    }
  }

  function elegirLeadExistente(lead: LeadDuplicado) {
    setLeadElegido(lead);
    setModo("asociar-consulta");
  }

  function volverACrear() {
    setModo("crear-lead");
    setLeadElegido(null);
  }

  // === Modo: asociar consulta a lead existente ===
  if (modo === "asociar-consulta" && leadElegido) {
    return (
      <div className="space-y-4">
        <Card className="border-violet-200 bg-violet-50/40">
          <h3 className="font-display text-lg font-semibold text-violet-900">
            Asociar consulta a {leadElegido.nombre}
          </h3>
          <p className="mt-1 text-sm text-violet-800/70">
            Vas a agregar una nueva consulta al lead existente.
            Si te equivocaste,{" "}
            <button onClick={volverACrear} className="underline">
              volvé a crear lead nuevo
            </button>
            .
          </p>
        </Card>

        <form
          action={(formData) => {
            formData.set("lead_id", leadElegido.id);
            startTransition(async () => {
              const r = await agregarConsultaALead(formData);
              if (!r.ok) {
                setErrorGeneral(r.error ?? null);
                setFieldErrors(r.fieldErrors ?? {});
              }
            });
          }}
          className="space-y-4"
        >
          <Field label="Propiedad de interés" error={fieldErrors.propiedad_id} required>
            <Select name="propiedad_id" required>
              <option value="">Elegí una propiedad...</option>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.direccion} · {p.tipo} · {p.operacion}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Canal de la consulta" error={fieldErrors.canal_origen} required>
            <Select name="canal_origen" required>
              <option value="">Elegí un canal...</option>
              {canales.map((c) => (
                <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </Field>

          <Field label="Notas (opcional)">
            <textarea
              name="notas"
              rows={3}
              className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder='Ej: "Volvió a llamar interesada en otra propiedad"'
            />
          </Field>

          {errorGeneral && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorGeneral}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 size={14} className="animate-spin" />}
              Agregar consulta
            </Button>
            <Button type="button" variant="ghost" onClick={volverACrear}>
              Cancelar y crear lead nuevo
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // === Modo: crear lead nuevo ===
  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const r = await crearLead(formData);
          if (!r.ok) {
            setErrorGeneral(r.error ?? null);
            setFieldErrors(r.fieldErrors ?? {});
          }
        });
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre" error={fieldErrors.nombre} required>
          <Input name="nombre" required placeholder="Nombre y apellido" />
        </Field>

        <div>
          <Field label="Teléfono" error={fieldErrors.telefono}>
            <div className="relative">
              <Input
                name="telefono"
                placeholder="+54 9 11 1234 5678"
                onBlur={(e) => handleTelefonoBlur(e.target.value)}
              />
              {chequeando && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink/40"
                />
              )}
            </div>
          </Field>
        </div>
      </div>

      {/* Banner de duplicados */}
      {duplicados.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-orange-600" />
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-orange-900">
                Este teléfono ya está en el sistema
              </h3>
              <p className="mt-1 text-sm text-orange-800/80">
                Encontramos {duplicados.length}{" "}
                {duplicados.length === 1 ? "lead" : "leads"} con este número.
                ¿Es la misma persona?
              </p>
              <ul className="mt-3 space-y-2">
                {duplicados.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-orange-200/60 bg-white px-3 py-2"
                  >
                    <div className="text-sm">
                      <div className="font-medium text-ink">{d.nombre}</div>
                      <div className="text-xs text-ink/60">
                        {d.propiedad?.direccion ?? "consulta general"} · estado{" "}
                        {d.estado.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/leads/${d.id}`} target="_blank">
                        <Button type="button" variant="ghost" size="sm">
                          Ver ficha
                        </Button>
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => elegirLeadExistente(d)}
                      >
                        Es esta persona
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-orange-800/60">
                Si es persona distinta con el mismo número, podés seguir cargando el lead nuevo abajo.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Field label="Email" error={fieldErrors.email}>
        <Input name="email" type="email" placeholder="email@ejemplo.com" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Propiedad de interés (opcional)">
          <Select name="propiedad_id">
            <option value="">Sin propiedad asignada (búsqueda general)</option>
            {propiedades.map((p) => (
              <option key={p.id} value={p.id}>
                {p.direccion}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Canal de origen" error={fieldErrors.canal_origen} required>
          <Select
            name="canal_origen"
            required
            value={canalOrigen}
            onChange={(e) => setCanalOrigen(e.target.value)}
          >
            <option value="">Elegí un canal...</option>
            {canales.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </Field>
      </div>

      {/* Solo si el canal es referido_zulma */}
      {canalOrigen === "referido_zulma" && (
        <Field
          label="¿Qué dueño lo refirió?"
          error={fieldErrors.referido_por_dueno_id}
          required
        >
          <Select name="referido_por_dueno_id" required>
            <option value="">Elegí un dueño...</option>
            {duenos.map((d) => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsable">
          <Select name="responsable_id">
            <option value="">Sin asignar</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
        </Field>

        <Field label="Fecha próxima acción">
          <Input type="datetime-local" name="fecha_proxima_accion" />
        </Field>
      </div>

      <Field label="Próxima acción">
        <Input
          name="proxima_accion"
          placeholder="Ej: Llamar para coordinar visita"
        />
      </Field>

      <Field label="Notas internas">
        <textarea
          name="notas_internas"
          rows={3}
          className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Detalles que ayuden a continuar la conversación"
        />
      </Field>

      {errorGeneral && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorGeneral}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Crear lead
        </Button>
        <Link href="/leads">
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
        {label}
        {required && <span className="ml-1 text-orange-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
```

---

## 4 · Página `/leads/nuevo`

Crear `app/(dashboard)/leads/nuevo/page.tsx`:

```tsx
import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  listarPropiedadesParaLead,
  listarDuenosParaReferencia,
  listarSociosActivos,
} from "@/lib/supabase/queries/leads";
import { LeadFormNuevo } from "@/components/lead/LeadFormNuevo";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default async function NuevoLeadPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const [propiedades, duenos, socios] = await Promise.all([
    listarPropiedadesParaLead(),
    listarDuenosParaReferencia(),
    listarSociosActivos(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a leads
      </Link>

      <h1 className="font-display text-3xl font-semibold text-ink">Nuevo lead</h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        Cargá los datos. Al ingresar el teléfono, el sistema chequea si ya consultó antes.
      </p>

      <Card>
        <LeadFormNuevo
          propiedades={propiedades}
          duenos={duenos}
          socios={socios as any}
        />
      </Card>
    </div>
  );
}
```

---

## 5 · Página `/leads/[id]/editar`

Crear `app/(dashboard)/leads/[id]/editar/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getUsuarioActual, puedeVerNotasInternas } from "@/lib/auth/current-user";
import { obtenerLead, listarSociosActivos } from "@/lib/supabase/queries/leads";
import { LeadFormEditar } from "@/components/lead/LeadFormEditar";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default async function EditarLeadPage({
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

  const socios = await listarSociosActivos();
  const verNotas = puedeVerNotasInternas(usuario.rol);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/leads/${params.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a la ficha
      </Link>

      <h1 className="font-display text-3xl font-semibold text-ink">
        Editar lead
      </h1>
      <p className="mt-1 mb-6 text-sm text-ink/60">
        {lead.nombre} · {lead.telefono ?? "sin teléfono"}
      </p>

      <Card>
        <LeadFormEditar
          lead={lead}
          socios={socios as any}
          puedeEditarNotas={verNotas}
        />
      </Card>
    </div>
  );
}
```

---

## 6 · Componente `<LeadFormEditar>`

Crear `components/lead/LeadFormEditar.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { actualizarLead } from "@/app/(dashboard)/leads/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Loader2 } from "lucide-react";

const estadosLead = [
  "nuevo",
  "contactado",
  "con_visita",
  "con_oferta",
  "sin_interes",
  "cerrado_exitoso",
  "archivado",
];

type Socio = { id: string; nombre: string };

export function LeadFormEditar({
  lead,
  socios,
  puedeEditarNotas,
}: {
  lead: any;
  socios: Socio[];
  puedeEditarNotas: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Para input datetime-local necesitamos formato YYYY-MM-DDTHH:mm
  const fechaProxAccion = lead.fecha_proxima_accion
    ? new Date(lead.fecha_proxima_accion).toISOString().slice(0, 16)
    : "";

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const r = await actualizarLead(lead.id, formData);
          if (!r.ok) setErrorGeneral(r.error ?? null);
        });
      }}
      className="space-y-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <Field label="Estado">
          <Select name="estado" defaultValue={lead.estado}>
            {estadosLead.map((e) => (
              <option key={e} value={e}>{e.replace(/_/g, " ")}</option>
            ))}
          </Select>
        </Field>

        <Field label="Responsable">
          <Select name="responsable_id" defaultValue={lead.responsable_id ?? ""}>
            <option value="">Sin asignar</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Próxima acción">
        <Input
          name="proxima_accion"
          defaultValue={lead.proxima_accion ?? ""}
          placeholder="Ej: Llamar para coordinar visita"
        />
      </Field>

      <Field label="Fecha próxima acción">
        <Input
          type="datetime-local"
          name="fecha_proxima_accion"
          defaultValue={fechaProxAccion}
        />
      </Field>

      {puedeEditarNotas && (
        <Field label="Notas internas">
          <textarea
            name="notas_internas"
            rows={4}
            defaultValue={lead.notas_internas ?? ""}
            className="w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </Field>
      )}

      {errorGeneral && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorGeneral}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Guardar cambios
        </Button>
        <Link href={`/leads/${lead.id}`}>
          <Button type="button" variant="ghost">Cancelar</Button>
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
        {label}
      </label>
      {children}
    </div>
  );
}
```

---

## 7 · Habilitar botones existentes

### En `app/(dashboard)/leads/page.tsx`

Reemplazar el botón "Nuevo lead" actual (que está `disabled`) por un link real a `/leads/nuevo`:

```tsx
// Donde dice:
<Button disabled title="Próximamente · vuelta B">
  <Plus size={16} />
  Nuevo lead
</Button>

// Cambiar por:
<Link href="/leads/nuevo">
  <Button>
    <Plus size={16} />
    Nuevo lead
  </Button>
</Link>
```

### En `app/(dashboard)/leads/[id]/page.tsx`

Agregar un botón "Editar" en el header del lead. Cerca del título del lead, en la zona del header (la parte arriba con el badge y el nombre):

```tsx
import { Pencil } from "lucide-react";
// ... y en el header:
<div className="flex items-start justify-between gap-4">
  <div>
    {/* ... badge y h1 existentes ... */}
  </div>
  <Link href={`/leads/${lead.id}/editar`}>
    <Button variant="secondary" size="sm">
      <Pencil size={14} />
      Editar
    </Button>
  </Link>
</div>
```

---

## 8 · Smoke test manual

Con `pnpm dev` corriendo, hacé los siguientes flujos en orden:

### Flujo A · crear un lead nuevo limpio

1. Login como Zulma
2. `/leads` → click "Nuevo lead"
3. Llenar: nombre "Test Person", teléfono "+5491199998888" (uno nuevo), email opcional, propiedad cualquiera, canal "whatsapp_oficina"
4. Click "Crear lead"
5. Redirige a `/leads/[id]` con el nuevo lead

### Flujo B · detectar duplicado y elegir "no, persona distinta"

1. `/leads/nuevo`
2. Nombre "Otra Persona", teléfono **`+5491155112233`** (el de Lucía Fernández del seed)
3. Al salir del campo de teléfono → aparece el banner naranja con la(s) Lucía(s) existente(s)
4. Ignorás el banner, llenás el resto del form
5. Click "Crear lead" → se crea igual (es un caso legítimo de mismo teléfono con persona distinta)

### Flujo C · detectar duplicado y asociar consulta

1. `/leads/nuevo`
2. Nombre cualquiera, teléfono `+5491155112233` (Lucía otra vez)
3. Banner aparece con Lucía existente
4. Click "Es esta persona" en uno de los duplicados
5. **El form se transforma** a una versión más chica solo con: propiedad, canal, notas
6. Elegir una propiedad distinta a la que ya tiene Lucía, canal "whatsapp_oficina", notas "Volvió a consultar"
7. Click "Agregar consulta" → redirige a `/leads/[id-de-lucia]`
8. En la ficha de Lucía verás una nueva entrada en "Historial de consultas"

### Flujo D · editar lead existente

1. `/leads` → click en cualquier lead
2. Botón "Editar" arriba a la derecha
3. Cambiar estado a "contactado", agregar próxima acción "Llamar mañana", elegir un responsable
4. Click "Guardar cambios" → redirige a la ficha con los datos actualizados

### Flujo E · validaciones

1. `/leads/nuevo` → click "Crear lead" sin llenar nada
2. Tiene que mostrar errores: nombre requerido, canal requerido, al menos teléfono o email
3. Probá canal "referido_zulma" → debe aparecer el select de dueño que refirió, marcado como requerido
4. Si lo dejás vacío → error específico de ese campo

### Flujo F · filtrado por rol

1. Logueate como Carolina → editar un lead
2. El campo "Notas internas" **no debe aparecer** en el form de edición
3. El submit funciona igual sin esa fila

---

## 9 · Verificación de tipos y lint

```bash
pnpm type-check
pnpm lint
```

Cualquier error que aparezca, resolver con `as any` en los joins de Supabase siguiendo el patrón ya establecido. Si hay errores de TypeScript en los formularios cliente, prestar atención: los Server Actions con `formData` pueden necesitar type assertions.

---

## 10 · Commit y push

```bash
git add .
git commit -m "feat(leads): creación con detección de duplicados activa + edición"
git push
```

---

## 11 · Confirmación final

Mostrame:

- Resultado de los 6 flujos del smoke test (idealmente con capturas, pero markers HTTP también sirven)
- Output de `pnpm type-check` y `pnpm lint`
- Hash del commit
- Cualquier error que haya aparecido y cómo lo resolviste
- Si algo del UX no quedó claro o se ve raro, marcalo — vemos si lo retocamos en esta vuelta o lo dejamos para iteración

Si algún paso falla, parate y avisame antes de seguir improvisando.
