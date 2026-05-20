import { createClient } from "@/lib/supabase/server";
import type { RolUsuario } from "@/lib/auth/current-user";
import {
  puedeVerAcuerdoEspecial,
  puedeVerNotasInternas,
} from "@/lib/auth/current-user";

const COLUMNAS_DUENO_BASE =
  "id, nombre, email, telefono, canal_preferido, frecuencia_reporte, en_grupo_whatsapp, confidencial";

function columnasDueno(rol: RolUsuario): string {
  const cols = [COLUMNAS_DUENO_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  if (puedeVerAcuerdoEspecial(rol)) cols.push("acuerdo_especial");
  return cols.join(", ");
}

const COLUMNAS_PROPIEDAD_BASE =
  "id, direccion, tipo, operacion, estado, precio_actual, moneda, fecha_captacion, confidencial, descripcion_comercial, fotos";

function columnasPropiedad(rol: RolUsuario): string {
  const cols = [COLUMNAS_PROPIEDAD_BASE];
  if (puedeVerNotasInternas(rol)) cols.push("notas_internas");
  return cols.join(", ");
}

export type FiltrosPropiedades = {
  busqueda?: string;
  estado?: string;
  tipo?: string;
  operacion?: string;
};

export async function listarPropiedades(
  rol: RolUsuario,
  filtros: FiltrosPropiedades = {},
) {
  const supabase = createClient();

  let query = supabase
    .from("propiedades")
    .select(
      `
      ${columnasPropiedad(rol)},
      dueno:duenos(id, nombre)
    `,
    )
    .order("fecha_captacion", { ascending: false });

  if (filtros.estado) query = query.eq("estado", filtros.estado);
  if (filtros.tipo) query = query.eq("tipo", filtros.tipo);
  if (filtros.operacion) query = query.eq("operacion", filtros.operacion);
  if (filtros.busqueda) query = query.ilike("direccion", `%${filtros.busqueda}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function obtenerPropiedad(id: string, rol: RolUsuario) {
  const supabase = createClient();
  // Cast a `any` para sortear el parser de tipos de @supabase/supabase-js,
  // que no acepta este nivel de joins anidados con hint de FK.
  // Los pages consumen el resultado tratando los campos relacionados como any.
  const { data, error } = await (supabase
    .from("propiedades")
    .select(
      `
      ${columnasPropiedad(rol)},
      dueno:duenos(${columnasDueno(rol)}),
      portales:portales_propiedad(*),
      visitas(
        id, fecha_agendada, estado, devolucion_prospecto,
        lead:leads(id, nombre, telefono),
        responsable:usuarios!visitas_responsable_id_fkey(nombre)
      ),
      leads(id, nombre, telefono, estado, canal_origen, creado_en)
    `,
    )
    .eq("id", id)
    .single() as any);

  if (error) throw error;
  return data;
}
