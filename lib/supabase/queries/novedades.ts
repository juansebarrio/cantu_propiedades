import { createClient } from "@/lib/supabase/server";

export type NovedadConAutor = {
  id: string;
  contenido: string;
  autor_id: string;
  vista_por: string[];
  creado_en: string;
  autor: {
    id: string;
    nombre: string;
    rol: string;
  };
};

export async function listarNovedades(): Promise<NovedadConAutor[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("novedades")
    .select(
      `
      id, contenido, autor_id, vista_por, creado_en,
      autor:usuarios ( id, nombre, rol )
    `,
    )
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("listarNovedades error:", error);
    return [];
  }

  return (data ?? []) as unknown as NovedadConAutor[];
}
