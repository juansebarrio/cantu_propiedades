import type { UsuarioActual } from "@/lib/auth/current-user";
import { TopbarBreadcrumb } from "@/components/TopbarBreadcrumb";
import { UserPill } from "@/components/UserPill";
import { Search } from "lucide-react";

export function Topbar({ usuario }: { usuario: UsuarioActual }) {
  return (
    <header className="flex items-center justify-between border-b border-cream-200 px-9 py-[18px]">
      <TopbarBreadcrumb />

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          disabled
          title="Próximamente"
          className="flex cursor-not-allowed items-center gap-2 p-1.5 text-[13px] text-ink-500"
        >
          <Search size={16} strokeWidth={1.5} />
          <span>Buscar</span>
          <kbd className="rounded-xs bg-cream-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-600">
            ⌘K
          </kbd>
        </button>

        <div className="h-[18px] w-px bg-cream-300" />

        <UserPill usuario={usuario} />
      </div>
    </header>
  );
}
