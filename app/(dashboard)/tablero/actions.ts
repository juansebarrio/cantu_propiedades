"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioActual } from "@/lib/auth/current-user";

type Resultado = { ok: true } | { ok: false; error: string };

export async function crearNovedad(contenido: string): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "No autenticado" };

  const limpio = contenido.trim();
  if (!limpio) return { ok: false, error: "El contenido no puede estar vacío" };
  if (limpio.length > 280)
    return { ok: false, error: "Máximo 280 caracteres" };

  const supabase = createClient();
  // El autor es quien la crea Y ya la vio (no se muestra "Nueva" a sí mismo)
  const { error } = await supabase.from("novedades").insert({
    contenido: limpio,
    autor_id: usuario.id,
    vista_por: [usuario.id],
  } as any);

  if (error) {
    console.error("crearNovedad error:", error);
    return { ok: false, error: "No se pudo crear la novedad" };
  }

  revalidatePath("/tablero");
  return { ok: true };
}

export async function marcarNovedadesComoVistas(): Promise<Resultado> {
  const usuario = await getUsuarioActual();
  if (!usuario) return { ok: false, error: "No autenticado" };

  const supabase = createClient();

  // Buscar las novedades que NO contienen al usuario en vista_por
  const { data: noVistas, error: selError } = await supabase
    .from("novedades")
    .select("id, vista_por")
    .not("vista_por", "cs", `{${usuario.id}}`);

  if (selError) {
    console.error("marcarNovedadesComoVistas select error:", selError);
    return { ok: false, error: "No se pudieron marcar como vistas" };
  }

  for (const nov of (noVistas ?? []) as Array<{
    id: string;
    vista_por: string[] | null;
  }>) {
    const nuevoArray = [...(nov.vista_por ?? []), usuario.id];
    const { error: updError } = await supabase
      .from("novedades")
      .update({ vista_por: nuevoArray } as any)
      .eq("id", nov.id);
    if (updError) {
      console.error("marcarNovedadesComoVistas update error:", updError);
      // continuar con las demás
    }
  }

  revalidatePath("/tablero");
  return { ok: true };
}
