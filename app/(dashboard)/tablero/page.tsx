import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  obtenerKpis,
  listarProximasVisitas,
  listarLeadsRecientes,
} from "@/lib/supabase/queries/tablero";
import { listarNovedades } from "@/lib/supabase/queries/novedades";
import { KpiCard } from "@/components/ui/KpiCard";
import { NovedadesModule } from "./NovedadesModule";
import { ProximasVisitasModule } from "./ProximasVisitasModule";
import { LeadsRecientesModule } from "./LeadsRecientesModule";
import { formatearDiaLargo } from "@/lib/fechas";

export default async function TableroPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const [kpis, novedades, proximasVisitas, leadsRecientes] = await Promise.all([
    obtenerKpis(usuario.rol, usuario.id),
    listarNovedades(),
    listarProximasVisitas(),
    listarLeadsRecientes(),
  ]);

  const saludo = (() => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 20) return "Buenas tardes";
    return "Buenas noches";
  })();

  const primerNombre = usuario.nombre.split(" ")[0];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 border-b border-cream-200 pb-6">
        <h1 className="font-display text-4xl tracking-tight text-ink-900">
          {saludo}, {primerNombre}
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {formatearDiaLargo(new Date())} · Cantú Propiedades · Coghlan
        </p>
      </header>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            valor={kpi.valor}
            hint={kpi.hint}
          />
        ))}
      </div>

      <div className="mb-6">
        <NovedadesModule novedades={novedades} usuarioId={usuario.id} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProximasVisitasModule visitas={proximasVisitas} />
        <LeadsRecientesModule leads={leadsRecientes} />
      </div>
    </div>
  );
}
