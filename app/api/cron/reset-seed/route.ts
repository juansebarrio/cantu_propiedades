import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente admin con service_role. Pasa por encima de RLS.
// NUNCA exponer este cliente en código que corra en el browser.
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

// Orden inverso de dependencia · primero las hijas, después las padres.
// Names match el schema real (no `consultas`, sino `consultas_lead`; etc).
const TABLAS_A_LIMPIAR = [
  "visitas", // RESTRICT a leads + propiedades · debe ir primero
  "comunicaciones", // cascade desde leads/duenos
  "consultas_lead", // cascade desde leads/propiedades
  "reportes_mensuales", // cascade desde propiedades/duenos
  "portales_propiedad", // cascade desde propiedades
  "leads", // ya sin dependientes
  "propiedades", // depende de duenos
  "duenos", // raíz operativa
] as const;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const supabase = getAdminClient();
  const empezo = Date.now();
  const stats: Record<string, number | string> = {};

  try {
    // PASO 1 · Vaciar tablas operativas
    for (const tabla of TABLAS_A_LIMPIAR) {
      const { error } = await supabase
        .from(tabla)
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        throw new Error(`Error vaciando ${tabla}: ${error.message}`);
      }
      stats[`delete_${tabla}`] = "ok";
    }

    // PASO 2 · Resembrar via función SQL
    const { error: seedError } = await supabase.rpc("seed_demo_data");
    if (seedError) {
      throw new Error(`seed_demo_data() falló: ${seedError.message}`);
    }
    stats["seed_demo_data"] = "ok";

    // PASO 3 · Verificación de counts
    const tablasVerificar = ["duenos", "propiedades", "leads", "visitas"];
    for (const t of tablasVerificar) {
      const { count, error } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (!error) stats[`count_${t}`] = count ?? 0;
    }

    const duracionMs = Date.now() - empezo;
    return NextResponse.json({
      ok: true,
      duracionMs,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cron/reset-seed] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
        statsParciales: stats,
      },
      { status: 500 },
    );
  }
}
