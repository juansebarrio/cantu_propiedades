"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  crearLead,
  agregarConsultaALead,
  chequearDuplicado,
} from "@/app/(dashboard)/leads/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { AlertTriangle, Loader2 } from "lucide-react";

type Propiedad = {
  id: string;
  direccion: string;
  tipo: string;
  operacion: string;
};
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
      setDuplicados(result as unknown as LeadDuplicado[]);
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

  if (modo === "asociar-consulta" && leadElegido) {
    return (
      <div className="space-y-4">
        <Card className="border-plum-50 bg-plum-50/40">
          <h3 className="font-display text-lg text-ink-900">
            Asociar consulta a {leadElegido.nombre}
          </h3>
          <p className="mt-1 text-sm text-ink-700">
            Vas a agregar una nueva consulta al lead existente. Si te
            equivocaste,{" "}
            <button
              type="button"
              onClick={volverACrear}
              className="underline hover:text-plum-500"
            >
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
          <Field
            label="Propiedad de interés"
            error={fieldErrors.propiedad_id}
            required
          >
            <Select name="propiedad_id" required>
              <option value="">Elegí una propiedad...</option>
              {propiedades.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.direccion} · {p.tipo} · {p.operacion}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Canal de la consulta"
            error={fieldErrors.canal_origen}
            required
          >
            <Select name="canal_origen" required>
              <option value="">Elegí un canal...</option>
              {canales.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Notas (opcional)">
            <textarea
              name="notas"
              rows={3}
              className="w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
              placeholder='Ej: "Volvió a llamar interesada en otra propiedad"'
            />
          </Field>

          {errorGeneral && (
            <div className="rounded-sm border border-brick-200 bg-brick-50 px-4 py-3 text-sm text-brick-700">
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

      {duplicados.length > 0 && (
        <Card className="border-brick-200 bg-brick-50/50">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              strokeWidth={1.5}
              className="mt-0.5 shrink-0 text-brick-700"
            />
            <div className="flex-1">
              <h3 className="font-display text-base text-ink-900">
                Este teléfono ya está en el sistema
              </h3>
              <p className="mt-1 text-sm text-ink-700">
                Encontramos {duplicados.length}{" "}
                {duplicados.length === 1 ? "lead" : "leads"} con este número.
                ¿Es la misma persona?
              </p>
              <ul className="mt-3 space-y-2">
                {duplicados.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-3 rounded-sm border border-brick-100 bg-white px-3 py-2"
                  >
                    <div>
                      <div className="font-display text-base text-ink-900">
                        {d.nombre}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                        {d.propiedad?.direccion ?? "consulta general"} · Estado{" "}
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
              <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                Si es persona distinta, podés seguir cargando el lead abajo.
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

        <Field
          label="Canal de origen"
          error={fieldErrors.canal_origen}
          required
        >
          <Select
            name="canal_origen"
            required
            value={canalOrigen}
            onChange={(e) => setCanalOrigen(e.target.value)}
          >
            <option value="">Elegí un canal...</option>
            {canales.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {canalOrigen === "referido_zulma" && (
        <Field
          label="¿Qué dueño lo refirió?"
          error={fieldErrors.referido_por_dueno_id}
          required
        >
          <Select name="referido_por_dueno_id" required>
            <option value="">Elegí un dueño...</option>
            {duenos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Responsable">
          <Select name="responsable_id">
            <option value="">Sin asignar</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
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
          className="w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
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
