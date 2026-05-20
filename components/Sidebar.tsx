import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
} from "lucide-react";

const items = [
  { href: "/tablero", label: "Tablero", icon: LayoutDashboard, disabled: true },
  { href: "/propiedades", label: "Propiedades", icon: Building2, disabled: false },
  { href: "/leads", label: "Leads", icon: Users, disabled: true },
  { href: "/agenda", label: "Agenda", icon: Calendar, disabled: true },
  { href: "/reportes", label: "Reportes", icon: FileText, disabled: true },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-line bg-white">
      <div className="flex h-16 items-center border-b border-line px-6">
        <span className="font-display text-xl font-semibold text-ink">
          Cantú
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.disabled) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/30"
                title="Próximamente"
              >
                <Icon size={16} />
                {item.label}
              </span>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-ink/70 hover:bg-line/30 hover:text-ink"
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4 text-xs text-ink/40">
        JS80 · v0.1
      </div>
    </aside>
  );
}
