"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { actualizarLead } from "@/app/(dashboard)/leads/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field label="Estado">
          <Select name="estado" defaultValue={lead.estado}>
            {estadosLead.map((e) => (
              <option key={e} value={e}>
                {e.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Responsable">
          <Select
            name="responsable_id"
            defaultValue={lead.responsable_id ?? ""}
          >
            <option value="">Sin asignar</option>
            {socios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
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
        <Field label="Notas internas" hint="Solo socios ven esta columna">
          <textarea
            name="notas_internas"
            rows={4}
            defaultValue={lead.notas_internas ?? ""}
            className="w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5 font-sans text-sm text-ink-900 placeholder:text-ink-400 focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8"
          />
        </Field>
      )}

      {errorGeneral && (
        <div className="rounded-sm border border-brick-200 bg-brick-50 px-4 py-3 text-sm text-brick-700">
          {errorGeneral}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-cream-200 pt-5">
        <Link href={`/leads/${lead.id}`}>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
