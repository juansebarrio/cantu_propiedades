"use client";

import { useState, useTransition } from "react";
import { iniciarSesionDemo } from "./demo-actions";
import { Loader2 } from "lucide-react";

type DemoUser = "martin" | "carolina";

const USERS: Array<{
  id: DemoUser;
  nombre: string;
  rol: string;
  inicial: string;
}> = [
  { id: "martin", nombre: "Martín Larrea", rol: "Socio operativo", inicial: "M" },
  { id: "carolina", nombre: "Carolina Méndez", rol: "Administrativa", inicial: "C" },
];

export function DemoLoginButtons() {
  const [isPending, startTransition] = useTransition();
  const [pendingUser, setPendingUser] = useState<DemoUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick(usuario: DemoUser) {
    setError(null);
    setPendingUser(usuario);
    startTransition(async () => {
      const r = await iniciarSesionDemo(usuario);
      // Si llegamos acá es porque la action no redirigió (= falló)
      if (r && !r.ok) {
        setError(r.error);
        setPendingUser(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {USERS.map((u) => {
        const loading = isPending && pendingUser === u.id;
        const disabled = isPending && pendingUser !== u.id;

        return (
          <button
            key={u.id}
            type="button"
            onClick={() => handleClick(u.id)}
            disabled={disabled || loading}
            className="flex items-center gap-3.5 rounded-sm border border-ink-200 bg-white px-4 py-3 text-left transition-colors hover:bg-cream-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-200 font-display text-lg text-ink-900">
              {loading ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
              ) : (
                u.inicial
              )}
            </div>

            <div className="flex-1 leading-tight">
              <div className="text-sm font-medium text-ink-900">{u.nombre}</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {u.rol}
              </div>
            </div>
          </button>
        );
      })}

      {error && (
        <div className="rounded-sm border border-brick-200 bg-brick-50 px-3 py-2 text-[13px] text-brick-700">
          {error}
        </div>
      )}
    </div>
  );
}
