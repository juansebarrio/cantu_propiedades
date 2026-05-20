"use client";

import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

const rutaLabels: Record<string, string> = {
  tablero: "Tablero",
  propiedades: "Propiedades",
  leads: "Leads",
  agenda: "Agenda",
  reportes: "Reportes",
  nuevo: "Nuevo",
  editar: "Editar",
};

function formatearFechaHoy(): string {
  const fecha = new Date();
  const dias = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const dia = dias[fecha.getDay()];
  const numero = fecha.getDate();
  const mes = meses[fecha.getMonth()];
  return `${dia.charAt(0).toUpperCase() + dia.slice(1)} ${numero} de ${mes}`;
}

export function TopbarBreadcrumb() {
  const pathname = usePathname();
  const partes = pathname.split("/").filter(Boolean);
  const seccionRaw = partes[0] ?? "";
  const seccion = rutaLabels[seccionRaw] ?? "Inicio";

  return (
    <div className="flex items-center gap-2.5 text-[13px] text-ink-500">
      <Home size={14} strokeWidth={1.5} />
      <span>{seccion}</span>
      <span className="opacity-40">/</span>
      <span className="text-ink-900">{formatearFechaHoy()}</span>
    </div>
  );
}
