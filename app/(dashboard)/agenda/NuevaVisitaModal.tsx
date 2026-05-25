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
  propiedades: Array<{ id: string; direccion: string }>;
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
          <Select name="responsable_id" required>
            <option value="">Seleccionar agente…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="rounded-sm border border-brick-200 bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
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
