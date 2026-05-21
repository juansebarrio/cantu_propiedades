"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NuevaNovedadModal } from "./NuevaNovedadModal";
import { NovedadItem } from "./NovedadItem";
import { marcarNovedadesComoVistas } from "./actions";
import type { NovedadConAutor } from "@/lib/supabase/queries/novedades";

type Props = {
  novedades: NovedadConAutor[];
  usuarioId: string;
};

export function NovedadesModule({ novedades, usuarioId }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Auto-marcar como vistas al montar (después de 2s para que el dot brick
  // sea visible un momento).
  useEffect(() => {
    const hayNuevas = novedades.some((n) => !n.vista_por.includes(usuarioId));
    if (!hayNuevas) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        await marcarNovedadesComoVistas();
        router.refresh();
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [novedades, usuarioId, router]);

  return (
    <>
      <section className="rounded-md border border-ink-100 bg-white">
        <header className="flex items-center justify-between gap-4 border-b border-cream-200 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <MessageSquare
              size={16}
              strokeWidth={1.5}
              className="text-ink-500"
            />
            <h2 className="font-display text-lg tracking-tight text-ink-900">
              Novedades del equipo
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setModalAbierto(true)}
          >
            <Plus size={14} strokeWidth={1.5} />
            Nueva
          </Button>
        </header>

        {novedades.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-400">
              Sin novedades · sé el primero en dejar una
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-cream-200">
            {novedades.map((n) => (
              <NovedadItem key={n.id} novedad={n} usuarioId={usuarioId} />
            ))}
          </ul>
        )}
      </section>

      <NuevaNovedadModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </>
  );
}
