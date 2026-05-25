import type { UsuarioActual } from "@/lib/auth/current-user";
import { TopbarBreadcrumb } from "@/components/TopbarBreadcrumb";
import { UserPill } from "@/components/UserPill";
import { MobileNav } from "@/components/MobileNav";
import { Search } from "lucide-react";

export function Topbar({ usuario }: { usuario: UsuarioActual }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-cream-200 px-4 py-3 sm:px-9 sm:py-[18px]">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav />
        <TopbarBreadcrumb />
      </div>

      <div className="flex items-center gap-3.5">
        <button
          type="button"
          disabled
          title="Próximamente"
          className="hidden cursor-not-allowed items-center gap-2 p-1.5 text-[13px] text-ink-500 md:flex"
        >
          <Search size={16} strokeWidth={1.5} />
          <span>Buscar</span>
          <kbd className="rounded-xs bg-cream-200 px-1.5 py-0.5 font-mono text-[10px] text-ink-600">
            ⌘K
          </kbd>
        </button>

        <div className="hidden h-[18px] w-px bg-cream-300 md:block" />

        <UserPill usuario={usuario} />
      </div>
    </header>
  );
}
