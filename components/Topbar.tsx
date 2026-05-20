import Link from "next/link";
import type { UsuarioActual } from "@/lib/auth/current-user";
import { LogOut } from "lucide-react";

const rolLabel: Record<string, string> = {
  socia_titular: "Socia titular",
  socio_operativo: "Socio operativo",
  administrativa: "Administrativa",
};

export function Topbar({ usuario }: { usuario: UsuarioActual }) {
  return (
    <header className="flex h-16 items-center justify-end gap-4 border-b border-line bg-white px-8">
      <div className="text-right">
        <div className="text-sm font-medium text-ink">{usuario.nombre}</div>
        <div className="text-xs text-ink/50">{rolLabel[usuario.rol]}</div>
      </div>
      <Link
        href="/logout"
        className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-ink/70 hover:bg-line/30"
        title="Cerrar sesión"
      >
        <LogOut size={14} />
        Salir
      </Link>
    </header>
  );
}
