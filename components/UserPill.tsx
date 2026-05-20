import Link from "next/link";
import { LogOut } from "lucide-react";
import type { UsuarioActual } from "@/lib/auth/current-user";

const rolLabel: Record<string, string> = {
  socia_titular: "Socia titular",
  socio_operativo: "Socio operativo",
  administrativa: "Administrativa",
};

export function UserPill({ usuario }: { usuario: UsuarioActual }) {
  const inicial = usuario.nombre.trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200 font-display text-base text-ink-900"
        aria-label={`Avatar de ${usuario.nombre}`}
      >
        {inicial}
      </div>

      <div className="leading-tight">
        <div className="text-[13px] font-medium text-ink-900">
          {usuario.nombre}
        </div>
        <div className="text-[11px] text-ink-500">
          {rolLabel[usuario.rol]}
        </div>
      </div>

      <Link
        href="/logout"
        title="Cerrar sesión"
        className="ml-1 flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
      >
        <LogOut size={14} strokeWidth={1.5} />
      </Link>
    </div>
  );
}
