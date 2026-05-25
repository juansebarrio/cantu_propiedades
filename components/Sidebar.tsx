import { Mark } from "@/components/brand/Mark";
import { SidebarNav } from "@/components/SidebarNav";

export function Sidebar() {
  return (
    <aside className="hidden w-[232px] shrink-0 flex-col border-r border-cream-200 bg-cream-50 px-[18px] py-7 md:flex">
      <div className="mb-7 flex items-center gap-3.5 px-2">
        <Mark size={30} color="var(--ink-900)" />
        <div className="h-[22px] w-px bg-cream-300" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
          Propiedades
        </span>
      </div>

      <SidebarNav />

      <div className="mt-auto px-2">
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400">
          v0.1 · Coghlan
        </div>
      </div>
    </aside>
  );
}
