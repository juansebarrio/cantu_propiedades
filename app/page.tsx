import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { Mark } from "@/components/brand/Mark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Button } from "@/components/ui/Button";

export default async function Home() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/tablero");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="w-full max-w-xl text-center">
        <div className="mb-10 flex flex-col items-center gap-5">
          <Mark size={72} color="var(--ink-900)" />
          <Wordmark size={80} color="var(--ink-900)" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-500">
            Propiedades · Coghlan
          </span>
        </div>

        <p className="mx-auto mb-10 max-w-md font-display text-2xl italic leading-snug text-ink-700">
          Casas de Coghlan, con criterio y oficio.
        </p>

        <Link href="/login">
          <Button size="lg">Iniciar sesión</Button>
        </Link>

        <p className="mt-16 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
          JS80 · Estudio de soluciones digitales
        </p>
      </div>
    </main>
  );
}
