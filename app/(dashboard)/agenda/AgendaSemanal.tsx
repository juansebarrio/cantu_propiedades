"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  parsearFechaISO,
  formatearFechaISO,
  semanaAnterior,
  semanaSiguiente,
  diasDeSemana,
  inicioDeSemana,
  fechaLocalDeTimestamp,
} from "@/lib/fechas";
import { DiaConVisitas } from "./DiaConVisitas";
import { NuevaVisitaModal } from "./NuevaVisitaModal";
import { VisitaDetalleModal } from "./VisitaDetalleModal";
import type { VisitaConRelaciones } from "@/lib/supabase/queries/visitas";

type Props = {
  semanaInicio: string;
  visitas: VisitaConRelaciones[];
  propiedadesSelect: Array<{ id: string; direccion: string }>;
  leadsSelect: Array<{ id: string; nombre: string; telefono: string | null }>;
  usuariosSelect: Array<{ id: string; nombre: string; rol: string }>;
  aperturaInicial?: { propiedadId?: string; leadId?: string };
};

type ModalNuevaState = {
  open: boolean;
  propiedadId?: string;
  leadId?: string;
  fecha?: string;
};

export function AgendaSemanal({
  semanaInicio,
  visitas,
  propiedadesSelect,
  leadsSelect,
  usuariosSelect,
  aperturaInicial,
}: Props) {
  const router = useRouter();
  const fechaPivote = parsearFechaISO(semanaInicio);
  const dias = diasDeSemana(fechaPivote);

  const [modalNueva, setModalNueva] = useState<ModalNuevaState>(
    aperturaInicial
      ? {
          open: true,
          propiedadId: aperturaInicial.propiedadId,
          leadId: aperturaInicial.leadId,
        }
      : { open: false },
  );

  const [visitaSeleccionada, setVisitaSeleccionada] =
    useState<VisitaConRelaciones | null>(null);

  function irASemanaAnterior() {
    const nueva = semanaAnterior(fechaPivote);
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  function irASemanaSiguiente() {
    const nueva = semanaSiguiente(fechaPivote);
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  function irAHoy() {
    const nueva = inicioDeSemana(new Date());
    router.push(`/agenda?semana=${formatearFechaISO(nueva)}`);
  }

  // Agrupar visitas por fecha local (YYYY-MM-DD)
  const visitasPorDia = visitas.reduce<Record<string, VisitaConRelaciones[]>>(
    (acc, v) => {
      const key = fechaLocalDeTimestamp(v.fecha_agendada);
      (acc[key] ??= []).push(v);
      return acc;
    },
    {},
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={irASemanaAnterior}
            aria-label="Semana anterior"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={irAHoy}>
            Hoy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={irASemanaSiguiente}
            aria-label="Semana siguiente"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => setModalNueva({ open: true })}
        >
          <Plus size={16} strokeWidth={1.5} />
          <span className="hidden sm:inline">Nueva visita</span>
          <span className="sm:hidden">Nueva</span>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {dias.map((dia) => {
          const iso = formatearFechaISO(dia);
          const visitasDelDia = visitasPorDia[iso] ?? [];
          return (
            <DiaConVisitas
              key={iso}
              dia={dia}
              visitas={visitasDelDia}
              onClickVisita={(v) => setVisitaSeleccionada(v)}
              onClickNueva={() => setModalNueva({ open: true, fecha: iso })}
            />
          );
        })}
      </div>

      <NuevaVisitaModal
        open={modalNueva.open}
        propiedadIdPrellenado={modalNueva.propiedadId}
        leadIdPrellenado={modalNueva.leadId}
        fechaPrellenada={modalNueva.fecha}
        propiedades={propiedadesSelect}
        leads={leadsSelect}
        usuarios={usuariosSelect}
        onClose={() => setModalNueva({ open: false })}
      />

      <VisitaDetalleModal
        visita={visitaSeleccionada}
        onClose={() => setVisitaSeleccionada(null)}
      />
    </>
  );
}
