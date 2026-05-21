import Link from "next/link";
import { Calendar } from "lucide-react";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { formatearDiaCorto, parsearFechaISO } from "@/lib/fechas";
import type { VisitaCompacta } from "@/lib/supabase/queries/tablero";

const labelEstado: Record<string, string> = {
  agendada: "Agendada",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

export function ProximasVisitasModule({
  visitas,
}: {
  visitas: VisitaCompacta[];
}) {
  return (
    <section className="rounded-md border border-ink-100 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-cream-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} strokeWidth={1.5} className="text-ink-500" />
          <h2 className="font-display text-lg tracking-tight text-ink-900">
            Próximas visitas
          </h2>
        </div>
        <Link
          href="/agenda"
          className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          Ver agenda →
        </Link>
      </header>

      {visitas.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-400">
            Sin visitas próximas
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-cream-200">
          {visitas.map((v) => {
            const fecha = parsearFechaISO(v.fecha_iso);
            return (
              <li key={v.id} className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-[68px]">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      {formatearDiaCorto(fecha)}
                    </div>
                    <div className="num font-display text-base tabular-nums text-ink-900">
                      {v.hora_str}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-display text-[15px] text-ink-900">
                      {v.propiedad?.direccion ?? "—"}
                    </div>
                    <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      con {v.lead?.nombre ?? "—"}
                    </div>
                  </div>
                  <Badge tone={tonoParaEstado(v.estado)}>
                    {labelEstado[v.estado] ?? v.estado}
                  </Badge>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
