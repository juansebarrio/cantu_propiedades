"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  FileText,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
};

const items: NavItem[] = [
  { href: "/tablero", label: "Tablero", icon: LayoutDashboard, disabled: true },
  { href: "/propiedades", label: "Propiedades", icon: Building2 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar, disabled: true },
  { href: "/reportes", label: "Reportes", icon: FileText, disabled: true },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          !item.disabled &&
          (pathname === item.href || pathname.startsWith(`${item.href}/`));

        if (item.disabled) {
          return (
            <span
              key={item.href}
              title="Próximamente"
              className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2.5 text-sm text-ink-300"
            >
              <Icon size={18} strokeWidth={1.5} />
              <span>{item.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-cream-200 font-medium text-ink-900"
                : "text-ink-500 hover:bg-cream-100 hover:text-ink-900",
            )}
          >
            <Icon size={18} strokeWidth={1.5} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
