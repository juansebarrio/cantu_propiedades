import { createClient } from "@/lib/supabase/server";

export type EstadoVisita =
  | "agendada"
  | "confirmada"
  | "realizada"
  | "cancelada"
  | "no_asistio";

// Adaptación al schema real:
// - fecha_agendada (timestamptz) reemplaza el par fecha+hora
// - responsable (no agente) — FK con hint visitas_responsable_id_fkey
// - propiedades no tiene `barrio`, solo `direccion`
export type VisitaConRelaciones = {
  id: string;
  fecha_agendada: string;
  estado: EstadoVisita;
  notas: string | null;
  creado_en: string;
  actualizado_en: string;

  propiedad: {
    id: string;
    direccion: string;
  } | null;

  lead: {
    id: string;
    nombre: string;
    telefono: string | null;
  } | null;

  responsable: {
    id: string;
    nombre: string;
  } | null;
};

const SELECT_VISITA = `
  id, fecha_agendada, estado, notas, creado_en, actualizado_en,
  propiedad:propiedades ( id, direccion ),
  lead:leads ( id, nombre, telefono ),
  responsable:usuarios!visitas_responsable_id_fkey ( id, nombre )
`;

export async function listarVisitasEnRango(
  desde: Date,
  hasta: Date,
): Promise<VisitaConRelaciones[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("visitas")
    .select(SELECT_VISITA)
    .gte("fecha_agendada", desde.toISOString())
    .lte("fecha_agendada", hasta.toISOString())
    .order("fecha_agendada", { ascending: true });

  if (error) {
    console.error("listarVisitasEnRango error:", error);
    throw new Error("No se pudieron cargar las visitas");
  }

  return (data ?? []) as unknown as VisitaConRelaciones[];
}

export async function obtenerVisita(
  id: string,
): Promise<VisitaConRelaciones | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("visitas")
    .select(SELECT_VISITA)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("obtenerVisita error:", error);
    return null;
  }

  return data as unknown as VisitaConRelaciones | null;
}

export async function listarPropiedadesActivasParaSelect() {
  const supabase = createClient();
  const { data } = await supabase
    .from("propiedades")
    .select("id, direccion, estado")
    .in("estado", ["captada", "publicada", "con_visitas", "con_oferta"])
    .order("direccion", { ascending: true });
  return data ?? [];
}

export async function listarLeadsActivosParaSelect() {
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, nombre, telefono, estado")
    .in("estado", ["nuevo", "contactado", "con_visita"])
    .order("nombre", { ascending: true });
  return data ?? [];
}

export async function listarUsuariosParaSelect() {
  const supabase = createClient();
  const { data } = await supabase
    .from("usuarios")
    .select("id, nombre, rol")
    .eq("activo", true)
    .order("nombre", { ascending: true });
  return data ?? [];
}
