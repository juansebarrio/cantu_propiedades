import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  listarVisitasEnRango,
  listarPropiedadesActivasParaSelect,
  listarLeadsActivosParaSelect,
  listarUsuariosParaSelect,
} from "@/lib/supabase/queries/visitas";
import {
  inicioDeSemana,
  finDeSemana,
  parsearFechaISO,
  formatearFechaISO,
  formatearRangoSemana,
} from "@/lib/fechas";
import { AgendaSemanal } from "./AgendaSemanal";

type SearchParams = {
  semana?: string;
  nueva?: string;
  propiedad?: string;
  lead?: string;
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) redirect("/login");

  const { semana, nueva, propiedad, lead } = searchParams;

  const fechaPivote = semana ? parsearFechaISO(semana) : new Date();
  const desde = inicioDeSemana(fechaPivote);
  const hasta = finDeSemana(fechaPivote);

  const [visitas, propiedadesSelect, leadsSelect, usuariosSelect] =
    await Promise.all([
      listarVisitasEnRango(desde, hasta),
      listarPropiedadesActivasParaSelect(),
      listarLeadsActivosParaSelect(),
      listarUsuariosParaSelect(),
    ]);

  const aperturaInicial =
    nueva === "1"
      ? { propiedadId: propiedad, leadId: lead }
      : undefined;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 border-b border-cream-200 pb-5 sm:mb-8 sm:pb-6">
        <h1 className="font-display text-3xl tracking-tight text-ink-900 sm:text-4xl">
          Agenda
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          Semana del {formatearRangoSemana(desde, hasta)} · {visitas.length}{" "}
          {visitas.length === 1 ? "visita" : "visitas"}
        </p>
      </header>

      <AgendaSemanal
        semanaInicio={formatearFechaISO(desde)}
        visitas={visitas}
        propiedadesSelect={propiedadesSelect}
        leadsSelect={leadsSelect}
        usuariosSelect={usuariosSelect as any}
        aperturaInicial={aperturaInicial}
      />
    </div>
  );
}
