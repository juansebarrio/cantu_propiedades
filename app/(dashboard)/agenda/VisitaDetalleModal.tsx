"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
  formatearDiaLargo,
  horaLocalDeTimestamp,
  fechaLocalDeTimestamp,
} from "@/lib/fechas";
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

  const fecha = new Date(visita.fecha_agendada);
  const fechaISO = fechaLocalDeTimestamp(visita.fecha_agendada);
  const horaISO = horaLocalDeTimestamp(visita.fecha_agendada);

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
    const f = String(formData.get("fecha") || "");
    const h = String(formData.get("hora") || "");
    startTransition(async () => {
      const r = await reagendarVisita(visita!.id, f, h);
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
      subtitle={`${formatearDiaLargo(fecha)} · ${horaISO}`}
      maxWidth="md"
    >
      <div className="flex flex-col gap-5">
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
              {visita.responsable?.nombre ?? "Sin asignar"}
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
                <span className="italic text-ink-400">Sin notas</span>
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

        {/* Modo reagendar */}
        {modoReagendar && (
          <form
            action={handleReagendar}
            className="rounded-sm bg-amber-50 px-4 py-3"
          >
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-amber-500">
              Reagendar visita
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Nueva fecha" required>
                <Input
                  type="date"
                  name="fecha"
                  defaultValue={fechaISO}
                  required
                />
              </Field>
              <Field label="Nueva hora" required>
                <Input
                  type="time"
                  name="hora"
                  defaultValue={horaISO}
                  required
                />
              </Field>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Al reagendar, el estado vuelve a &quot;agendada&quot; y hay que
              reconfirmar
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
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isPending}
              >
                {isPending && (
                  <Loader2
                    size={14}
                    strokeWidth={1.5}
                    className="animate-spin"
                  />
                )}
                Confirmar reagenda
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="rounded-sm border border-brick-200 bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
            {error}
          </div>
        )}

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
            Visita {labelEstado[visita.estado].toLowerCase()} · sin acciones
            disponibles
          </p>
        )}
      </div>
    </Modal>
  );
}
