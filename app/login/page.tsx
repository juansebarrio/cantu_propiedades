import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const next = String(formData.get("next") ?? "/test-db");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
    redirect(next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form action={login} className="w-full max-w-sm space-y-4">
        <h1 className="font-display text-3xl">Login</h1>

        {searchParams.error && (
          <p className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <input
          name="email"
          type="email"
          placeholder="email"
          autoComplete="email"
          required
          className="w-full rounded border border-line bg-white px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="password"
          autoComplete="current-password"
          required
          className="w-full rounded border border-line bg-white px-3 py-2"
        />
        <input type="hidden" name="next" value={searchParams.next ?? "/test-db"} />

        <button
          type="submit"
          className="w-full rounded bg-ink px-3 py-2 text-paper hover:opacity-90"
        >
          Entrar
        </button>

        <div className="space-y-1 pt-4 text-xs text-ink/50">
          <p className="font-semibold">Usuarios de prueba (seed):</p>
          <p>zulma@cantu.local · zulma123 · socia titular</p>
          <p>martin@cantu.local · martin123 · socio operativo</p>
          <p>carolina@cantu.local · carolina123 · administrativa</p>
        </div>
      </form>
    </main>
  );
}
