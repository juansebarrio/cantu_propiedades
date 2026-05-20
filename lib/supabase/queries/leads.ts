import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/auth/current-user";
import { puedeVerNotasInternas } from "@/lib/auth/current-user";

const COLUMNAS_LEAD_BASE =
  "id, nombre, telefono, email, propiedad_id, canal_origen, referido_por_dueno_id, estado, responsable_id, proxima_accion, fecha_proxima_accion, criterio_busqueda, creado_en, actualizado_en";

function columnasLead(rol: RolUsuario): string {
  const cols = [COLUMNAS_LEAD_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  return cols.join(", ");
}

export type FiltrosLeads = {
  busqueda?: string;
  estado?: string;
  canal_origen?: string;
  responsable_id?: string;
};

export async function listarLeads(rol: RolUsuario, filtros: FiltrosLeads = {}) {
  const supabase = createClient();

  let query = supabase
    .from("leads")
    .select(
      `
      ${columnasLead(rol)},
      propiedad:propiedades(id, direccion),
      responsable:usuarios!leads_responsable_id_fkey(id, nombre),
      referido_por:duenos(id, nombre)
    `,
    )
    .order("creado_en", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.canal_origen) query = query.eq("canal_origen", filtros.canal_origen);
  if (filtros.responsable_id)
    query = query.eq("responsable_id", filtros.responsable_id);
  if (filtros.busqueda) {
    query = query.or(
      `nombre.ilike.%${filtros.busqueda}%,telefono.ilike.%${filtros.busqueda}%`,
    );
  }

  // Cast a `any`: el parser de tipos de @supabase/supabase-js no soporta
  // este nivel de joins. Mismo patrón que en queries/propiedades.ts.
  const { data, error } = await (query as any);
  if (error) throw error;
  return data ?? [];
}

export async function obtenerLead(id: string, rol: RolUsuario) {
  const supabase = createClient();
  const { data, error } = await (supabase
    .from("leads")
    .select(
      `
      ${columnasLead(rol)},
      propiedad:propiedades(id, direccion, tipo, operacion, precio_actual, moneda, estado),
      responsable:usuarios!leads_responsable_id_fkey(id, nombre),
      referido_por:duenos(id, nombre, telefono),
      consultas:consultas_lead(
        id, fecha, canal_origen, notas,
        propiedad:propiedades(id, direccion, tipo)
      ),
      visitas(
        id, fecha_agendada, estado, devolucion_prospecto,
        propiedad:propiedades(id, direccion),
        responsable:usuarios!visitas_responsable_id_fkey(nombre)
      ),
      comunicaciones(id, tipo, contenido, fecha, registrada_por:usuarios(nombre))
    `,
    )
    .eq("id", id)
    .single() as any);

  if (error) throw error;
  return data;
}

export async function leadsConMismoTelefono(
  leadId: string,
  telefono: string | null,
) {
  if (!telefono) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, nombre, propiedad:propiedades(direccion), canal_origen, estado, creado_en",
    )
    .eq("telefono", telefono)
    .neq("id", leadId)
    .order("creado_en", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function listarSociosActivos() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, rol")
    .in("rol", ["socia_titular", "socio_operativo"])
    .eq("activo", true)
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

export async function verificarTelefonoDuplicado(telefono: string) {
  if (!telefono || telefono.trim().length < 6) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(
      `
      id, nombre, telefono, email, estado, canal_origen, creado_en,
      propiedad:propiedades(id, direccion)
    `,
    )
    .eq("telefono", telefono.trim())
    .order("creado_en", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listarPropiedadesParaLead() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("propiedades")
    .select("id, direccion, tipo, operacion, estado")
    .not("estado", "in", "(cerrada,archivada)")
    .order("direccion");
  if (error) throw error;
  return data ?? [];
}

export async function listarDuenosParaReferencia() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("duenos")
    .select("id, nombre")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}
