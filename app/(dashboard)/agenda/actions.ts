"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { combinarFechaYHora } from "@/lib/fechas";
import type { EstadoVisita } from "@/lib/supabase/queries/visitas";

type Resultado = { ok: true } | { ok: false; error: string };

const ESTADOS_VALIDOS: EstadoVisita[] = [
  "agendada",
  "confirmada",
  "realizada",
  "cancelada",
  "no_asistio",
];

export async function crearVisita(formData: FormData): Promise<Resultado> {
  const propiedad_id = String(formData.get("propiedad_id") || "");
  const lead_id = String(formData.get("lead_id") || "");
  const responsable_id = String(formData.get("responsable_id") || "");
  const fecha = String(formData.get("fecha") || "");
  const hora = String(formData.get("hora") || "");
  const notas = String(formData.get("notas") || "").trim() || null;

  if (!propiedad_id || !lead_id || !responsable_id || !fecha || !hora) {
    return { ok: false, error: "Faltan campos obligatorios" };
  }

  const supabase = createClient();
  const { error } = await supabase.from("visitas").insert({
    propiedad_id,
    lead_id,
    responsable_id,
    fecha_agendada: combinarFechaYHora(fecha, hora),
    estado: "agendada",
    notas,
  } as any);

  if (error) {
    console.error("crearVisita error:", error);
    return { ok: false, error: "No se pudo crear la visita" };
  }

  revalidatePath("/agenda");
  revalidatePath(`/propiedades/${propiedad_id}`);
  revalidatePath(`/leads/${lead_id}`);
  return { ok: true };
}

export async function cambiarEstadoVisita(
  id: string,
  nuevoEstado: EstadoVisita,
): Promise<Resultado> {
  if (!ESTADOS_VALIDOS.includes(nuevoEstado)) {
    return { ok: false, error: "Estado inválido" };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("visitas")
    .update({ estado: nuevoEstado } as any)
    .eq("id", id);

  if (error) {
    console.error("cambiarEstadoVisita error:", error);
    return { ok: false, error: "No se pudo cambiar el estado" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}

export async function reagendarVisita(
  id: string,
  fecha: string,
  hora: string,
): Promise<Resultado> {
  if (!fecha || !hora) {
    return { ok: false, error: "Faltan fecha u hora" };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("visitas")
    .update({
      fecha_agendada: combinarFechaYHora(fecha, hora),
      estado: "agendada",
    } as any)
    .eq("id", id);

  if (error) {
    console.error("reagendarVisita error:", error);
    return { ok: false, error: "No se pudo reagendar" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}

export async function editarNotasVisita(
  id: string,
  notas: string,
): Promise<Resultado> {
  const supabase = createClient();
  const { error } = await supabase
    .from("visitas")
    .update({ notas: notas.trim() || null } as any)
    .eq("id", id);

  if (error) {
    console.error("editarNotasVisita error:", error);
    return { ok: false, error: "No se pudieron guardar las notas" };
  }

  revalidatePath("/agenda");
  return { ok: true };
}
