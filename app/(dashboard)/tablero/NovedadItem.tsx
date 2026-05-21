import type { NovedadConAutor } from "@/lib/supabase/queries/novedades";

const rolLabel: Record<string, string> = {
  socia_titular: "Socia titular",
  socio_operativo: "Socio operativo",
  administrativa: "Administrativa",
};

function tiempoRelativo(iso: string): string {
  const ahora = new Date();
  const fecha = new Date(iso);
  const diffMs = ahora.getTime() - fecha.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "hace un momento";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHs = Math.floor(diffMin / 60);
  if (diffHs < 24) return `hace ${diffHs}${diffHs === 1 ? " hora" : " horas"}`;
  const diffDias = Math.floor(diffHs / 24);
  if (diffDias === 1) return "ayer";
  if (diffDias < 7) return `hace ${diffDias} días`;
  return fecha.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function NovedadItem({
  novedad,
  usuarioId,
}: {
  novedad: NovedadConAutor;
  usuarioId: string;
}) {
  const yoLaVi = novedad.vista_por.includes(usuarioId);
  const esMia = novedad.autor_id === usuarioId;
  const otrosQueLaVieron = novedad.vista_por.filter(
    (id) => id !== novedad.autor_id,
  );
  const inicial = novedad.autor.nombre.trim().charAt(0).toUpperCase();
  const primerNombre = novedad.autor.nombre.split(" ")[0];

  return (
    <li className="relative px-5 py-4">
      {!yoLaVi && !esMia && (
        <span
          className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brick-500"
          aria-label="No leída"
        />
      )}

      <div className="flex gap-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 font-display text-base text-ink-900">
          {inicial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium text-ink-900">
              {primerNombre}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
              {rolLabel[novedad.autor.rol] ?? novedad.autor.rol}
            </span>
            <span className="font-mono text-[10px] text-ink-400">·</span>
            <span className="font-mono text-[10px] text-ink-500">
              {tiempoRelativo(novedad.creado_en)}
            </span>
            {!yoLaVi && !esMia && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-brick-600">
                Nueva
              </span>
            )}
          </div>

          <p className="text-sm leading-snug text-ink-800">
            {novedad.contenido}
          </p>

          {otrosQueLaVieron.length > 0 && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-400">
              Vista por {otrosQueLaVieron.length}
              {otrosQueLaVieron.length === 1 ? " persona" : " personas"}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}
