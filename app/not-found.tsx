import Link from "next/link";
import { Mark } from "@/components/brand/Mark";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-10 flex flex-col items-center gap-4">
          <Mark size={48} color="var(--ink-900)" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-500">
            Propiedades · Coghlan
          </span>
        </div>

        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-ink-400">
          Error 404
        </div>
        <h1 className="mb-3 font-display text-4xl tracking-tight text-ink-900">
          Esta página no existe
        </h1>
        <p className="mb-8 text-[15px] leading-relaxed text-ink-500">
          La URL que ingresaste no corresponde a ninguna pantalla del tablero.
          Puede ser un link viejo o un error de tipeo.
        </p>

        <Link href="/tablero">
          <Button size="lg">Volver al tablero</Button>
        </Link>
      </div>
    </main>
  );
}
