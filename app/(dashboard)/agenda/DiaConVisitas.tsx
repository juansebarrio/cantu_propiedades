"use client";

import { Plus } from "lucide-react";
import { clsx } from "clsx";
import {
  formatearDiaCorto,
  horaLocalDeTimestamp,
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

export function DiaConVisitas({
  dia,
  visitas,
  onClickVisita,
  onClickNueva,
}: Props) {
  const esDiaActual = esHoy(dia);

  return (
    <section
      className={clsx(
        "rounded-md border bg-white",
        esDiaActual ? "border-ink-200" : "border-ink-100",
      )}
    >
      <header
        className={clsx(
          "flex items-baseline justify-between gap-3 border-b px-5 py-3",
          esDiaActual ? "border-ink-100 bg-cream-50" : "border-cream-200",
        )}
      >
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-xl tracking-tight text-ink-900">
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
                <div className="num min-w-[58px] font-display text-xl tabular-nums text-ink-900">
                  {horaLocalDeTimestamp(v.fecha_agendada)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[17px] text-ink-900">
                    {v.propiedad?.direccion ?? "Propiedad eliminada"}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    con {v.lead?.nombre ?? "lead eliminado"}
                    {v.responsable && (
                      <span className="ml-2 opacity-70">
                        · muestra {v.responsable.nombre.split(" ")[0]}
                      </span>
                    )}
                  </div>
                </div>

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
