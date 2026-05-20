import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth/current-user";

export default async function Home() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/propiedades");

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-xl text-center">
        <p className="mb-4 text-xs uppercase tracking-widest text-ink/50">
          JS80 · Estudio de soluciones digitales
        </p>
        <h1 className="font-display text-5xl font-semibold leading-tight text-ink">
          Cantú Propiedades
        </h1>
        <p className="mt-6 text-lg italic text-ink/70">Tablero operativo.</p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink/85"
        >
          Iniciar sesión
        </Link>
        <p className="mt-12 text-sm text-ink/40">
          De la idea al negocio funcionando.
        </p>
      </div>
    </main>
  );
}
