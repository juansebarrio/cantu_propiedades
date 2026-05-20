import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type RolUsuario = Database["public"]["Enums"]["rol_usuario"];

export type UsuarioActual = {
  id: string;
  nombre: string;
  rol: RolUsuario;
  email: string;
};

export async function getUsuarioActual(): Promise<UsuarioActual | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("usuarios")
    .select("id, nombre, rol, email")
    .eq("id", user.id)
    .eq("activo", true)
    .single();

  return perfil ?? null;
}

export function puedeVerAcuerdoEspecial(rol: RolUsuario): boolean {
  return rol === "socia_titular";
}

export function puedeVerNotasInternas(rol: RolUsuario): boolean {
  return rol === "socia_titular" || rol === "socio_operativo";
}

export function puedeBorrar(rol: RolUsuario): boolean {
  return rol === "socia_titular";
}
