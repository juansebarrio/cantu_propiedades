import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Mark } from "@/components/brand/Mark";
import { Wordmark } from "@/components/brand/Wordmark";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { DemoLoginButtons } from "./demo-login-buttons";

const ERRORES_LOGIN: Record<string, string> = {
  "Invalid login credentials": "Email o contraseña incorrectos.",
  "Email not confirmed": "Tenés que confirmar tu email antes de entrar.",
  "Too many requests":
    "Demasiados intentos. Esperá unos minutos y volvé a probar.",
};

function traducirError(mensaje: string): string {
  return ERRORES_LOGIN[mensaje] ?? "No pudimos iniciar tu sesión. Probá de nuevo.";
}

// Solo permitimos paths internos. Bloquea `//evil.com` y `http://...`.
function rutaInternaSegura(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return "/tablero";
  return next;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const next = rutaInternaSegura(String(formData.get("next") ?? "/tablero"));

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    redirect(next);
  }

  const errorTraducido = searchParams.error
    ? traducirError(searchParams.error)
    : null;
  const nextSafe = rutaInternaSegura(searchParams.next ?? "/tablero");

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12 flex flex-col items-center gap-4">
          <Mark size={56} color="var(--ink-900)" />
          <Wordmark size={56} color="var(--ink-900)" />
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-ink-500">
            Propiedades · Coghlan
          </span>
        </div>

        <div className="rounded-md border border-ink-100 bg-white p-7">
          <h1 className="mb-1 font-display text-2xl tracking-tight text-ink-900">
            Iniciar sesión
          </h1>
          <p className="mb-6 text-[13px] text-ink-500">
            Ingresá con el email y contraseña que te dieron.
          </p>

          <form action={login} className="flex flex-col gap-4">
            {errorTraducido && (
              <div className="rounded-sm bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
                {errorTraducido}
              </div>
            )}

            <Field label="Email" required>
              <Input
                name="email"
                type="email"
                placeholder="martin@cantu.local"
                autoComplete="email"
                required
                autoFocus
              />
            </Field>

            <Field label="Contraseña" required>
              <Input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </Field>

            <input type="hidden" name="next" value={nextSafe} />

            <Button type="submit" className="mt-2 w-full">
              Entrar
            </Button>
          </form>

        </div>

        {/* Separador */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-cream-300" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
            o probá la demo
          </span>
          <div className="h-px flex-1 bg-cream-300" />
        </div>

        {/* Botones de demo */}
        <DemoLoginButtons />

        {/* Disclaimer */}
        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-widest text-ink-400">
          Datos ficticios · caso simulado por confidencialidad
        </p>

        <div className="mt-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-400">
            JS80 · Estudio de soluciones digitales
          </p>
        </div>
      </div>
    </main>
  );
}
