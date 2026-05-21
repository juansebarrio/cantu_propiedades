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
    // Delete + reseed corren en una sola transacción dentro de la función
    // SQL. Si seed_demo_data() no existe o falla, el DELETE se revierte
    // y la base queda con los datos previos (no como antes, que el
    // delete iba aparte y dejaba la base vacía si el seed fallaba).
    const { error } = await supabase.rpc("reset_and_seed_demo_data");
    if (error) {
      throw new Error(`reset_and_seed_demo_data() falló: ${error.message}`);
    }
    stats["reset_and_seed"] = "ok";

    // Verificación de counts post-reseed
    const tablasVerificar = ["duenos", "propiedades", "leads", "visitas"];
    for (const t of tablasVerificar) {
      const { count, error: countError } = await supabase
        .from(t)
        .select("*", { count: "exact", head: true });
      if (!countError) stats[`count_${t}`] = count ?? 0;
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
