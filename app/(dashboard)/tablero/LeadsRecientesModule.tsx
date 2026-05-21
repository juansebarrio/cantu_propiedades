import Link from "next/link";
import { Users } from "lucide-react";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import type { LeadCompacto } from "@/lib/supabase/queries/tablero";

function tiempoRelativo(iso: string): string {
  const ahora = new Date();
  const fecha = new Date(iso);
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHs = Math.floor(diffMin / 60);
  if (diffHs < 24) return `hace ${diffHs}h`;
  const diffDias = Math.floor(diffHs / 24);
  if (diffDias === 1) return "ayer";
  return `hace ${diffDias} días`;
}

export function LeadsRecientesModule({ leads }: { leads: LeadCompacto[] }) {
  return (
    <section className="rounded-md border border-ink-100 bg-white">
      <header className="flex items-center justify-between gap-4 border-b border-cream-200 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <Users size={16} strokeWidth={1.5} className="text-ink-500" />
          <h2 className="font-display text-lg tracking-tight text-ink-900">
            Leads recientes
          </h2>
        </div>
        <Link
          href="/leads"
          className="font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
        >
          Ver todos →
        </Link>
      </header>

      {leads.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-400">
            Sin leads recientes
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-cream-200">
          {leads.map((l) => (
            <li key={l.id}>
              <Link
                href={`/leads/${l.id}`}
                className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-[15px] text-ink-900">
                    {l.nombre}
                  </div>
                  <div className="truncate font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    {tiempoRelativo(l.creado_en)}
                    {l.canal_origen &&
                      ` · ${l.canal_origen.replace(/_/g, " ")}`}
                  </div>
                </div>
                <Badge tone={tonoParaEstado(l.estado)}>
                  {l.estado.replace(/_/g, " ")}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
