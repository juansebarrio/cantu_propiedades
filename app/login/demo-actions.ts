"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Credenciales hardcoded de los 3 usuarios del seed.
// Como esto vive en el servidor (Server Action), las credenciales no se exponen al cliente.
const DEMO_USERS = {
  zulma: { email: "zulma@cantu.local", password: "zulma123" },
  martin: { email: "martin@cantu.local", password: "martin123" },
  carolina: { email: "carolina@cantu.local", password: "carolina123" },
} as const;

type DemoUser = keyof typeof DEMO_USERS;

export async function iniciarSesionDemo(usuario: DemoUser) {
  if (!(usuario in DEMO_USERS)) {
    return { ok: false as const, error: "Usuario de demo inválido" };
  }

  const credentials = DEMO_USERS[usuario];
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword(credentials);

  if (error) {
    console.error("iniciarSesionDemo error:", error);
    return {
      ok: false as const,
      error: "No se pudo iniciar la sesión de demo",
    };
  }

  redirect("/tablero");
}
