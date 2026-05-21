import { createClient } from "@/lib/supabase/server";
import {
  inicioDeSemana,
  finDeSemana,
  fechaLocalDeTimestamp,
  horaLocalDeTimestamp,
} from "@/lib/fechas";
import type { RolUsuario } from "@/lib/auth/current-user";

export type Kpi = {
  label: string;
  valor: number;
  hint?: string;
};

// Construye un timestamptz local a las 00:00 / 24:00 para usar en range queries
// contra `fecha_agendada` (timestamptz · una sola columna en nuestro schema).
function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}
function finDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function obtenerKpis(rol: RolUsuario, usuarioId: string): Promise<Kpi[]> {
  const supabase = createClient();

  const hoy = new Date();
  const hoyIni = inicioDelDia(hoy).toISOString();
  const hoyFin = finDelDia(hoy).toISOString();
  const semIni = inicioDeSemana(hoy).toISOString();
  const semFin = finDeSemana(hoy).toISOString();
  const mesIni = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  const mañana = new Date(hoy);
  mañana.setDate(mañana.getDate() + 1);
  const mañIni = inicioDelDia(mañana).toISOString();
  const mañFin = finDelDia(mañana).toISOString();
  const hace7 = new Date(hoy);
  hace7.setDate(hace7.getDate() - 7);
  const hace7ISO = hace7.toISOString();

  if (rol === "socia_titular") {
    const [publicadas, visitasSemana, leadsDelMes, ofertasActivas] = await Promise.all([
      supabase.from("propiedades").select("id", { count: "exact", head: true })
        .in("estado", ["publicada", "con_visitas", "con_oferta"]),
      supabase.from("visitas").select("id", { count: "exact", head: true })
        .gte("fecha_agendada", semIni).lte("fecha_agendada", semFin),
      supabase.from("leads").select("id", { count: "exact", head: true })
        .gte("creado_en", mesIni),
      supabase.from("propiedades").select("id", { count: "exact", head: true })
        .eq("estado", "con_oferta"),
    ]);
    return [
      { label: "Propiedades publicadas", valor: publicadas.count ?? 0 },
      { label: "Visitas esta semana",    valor: visitasSemana.count ?? 0 },
      { label: "Leads del mes",          valor: leadsDelMes.count ?? 0 },
      { label: "Ofertas activas",        valor: ofertasActivas.count ?? 0 },
    ];
  }

  if (rol === "socio_operativo") {
    const [misVisitasHoy, misVisitasSemana, propiedadesNuevas, visitasAConfirmar] = await Promise.all([
      supabase.from("visitas").select("id", { count: "exact", head: true })
        .eq("responsable_id", usuarioId)
        .gte("fecha_agendada", hoyIni).lte("fecha_agendada", hoyFin),
      supabase.from("visitas").select("id", { count: "exact", head: true })
        .eq("responsable_id", usuarioId)
        .gte("fecha_agendada", semIni).lte("fecha_agendada", semFin),
      supabase.from("propiedades").select("id", { count: "exact", head: true })
        .gte("creado_en", hace7ISO),
      supabase.from("visitas").select("id", { count: "exact", head: true })
        .eq("estado", "agendada")
        .gte("fecha_agendada", hoyIni),
    ]);
    return [
      { label: "Mis visitas hoy",    valor: misVisitasHoy.count ?? 0 },
      { label: "Mis visitas semana", valor: misVisitasSemana.count ?? 0 },
      { label: "Propiedades nuevas", valor: propiedadesNuevas.count ?? 0, hint: "últimos 7 días" },
      { label: "Visitas a confirmar",valor: visitasAConfirmar.count ?? 0 },
    ];
  }

  // administrativa
  const [visitasConfirmarHoy, visitasMañana, leadsSinContactar, totalReportes] = await Promise.all([
    supabase.from("visitas").select("id", { count: "exact", head: true })
      .eq("estado", "agendada")
      .gte("fecha_agendada", hoyIni).lte("fecha_agendada", hoyFin),
    supabase.from("visitas").select("id", { count: "exact", head: true })
      .gte("fecha_agendada", mañIni).lte("fecha_agendada", mañFin),
    supabase.from("leads").select("id", { count: "exact", head: true })
      .eq("estado", "nuevo"),
    supabase.from("reportes_mensuales").select("id", { count: "exact", head: true }),
  ]);
  return [
    { label: "Confirmar hoy",       valor: visitasConfirmarHoy.count ?? 0 },
    { label: "Visitas mañana",      valor: visitasMañana.count ?? 0 },
    { label: "Leads sin contactar", valor: leadsSinContactar.count ?? 0 },
    { label: "Reportes activos",    valor: totalReportes.count ?? 0 },
  ];
}

// ─── Mini-listas para los módulos del tablero ────────────────────────────

export type VisitaCompacta = {
  id: string;
  fecha_iso: string; // YYYY-MM-DD local
  hora_str: string;  // HH:MM local
  estado: string;
  propiedad: { id: string; direccion: string } | null;
  lead: { id: string; nombre: string } | null;
};

export async function listarProximasVisitas(): Promise<VisitaCompacta[]> {
  const supabase = createClient();
  const desde = new Date();
  desde.setHours(0, 0, 0, 0);
  const { data } = await (supabase
    .from("visitas")
    .select(`
      id, fecha_agendada, estado,
      propiedad:propiedades ( id, direccion ),
      lead:leads ( id, nombre )
    `)
    .gte("fecha_agendada", desde.toISOString())
    .in("estado", ["agendada", "confirmada"])
    .order("fecha_agendada", { ascending: true })
    .limit(5) as any);

  return ((data ?? []) as any[]).map((v) => ({
    id: v.id,
    fecha_iso: fechaLocalDeTimestamp(v.fecha_agendada),
    hora_str: horaLocalDeTimestamp(v.fecha_agendada),
    estado: v.estado,
    propiedad: v.propiedad,
    lead: v.lead,
  }));
}

export type LeadCompacto = {
  id: string;
  nombre: string;
  telefono: string | null;
  estado: string;
  canal_origen: string | null;
  creado_en: string;
};

export async function listarLeadsRecientes(): Promise<LeadCompacto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("leads")
    .select("id, nombre, telefono, estado, canal_origen, creado_en")
    .order("creado_en", { ascending: false })
    .limit(5);

  return (data ?? []) as LeadCompacto[];
}
