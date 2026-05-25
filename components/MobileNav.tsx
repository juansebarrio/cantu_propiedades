"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Mark } from "@/components/brand/Mark";
import { SidebarNav } from "@/components/SidebarNav";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="-ml-1 flex h-9 w-9 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-cream-100 hover:text-ink-900 md:hidden"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            onClick={() => setOpen(false)}
            aria-hidden
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[260px] max-w-[82vw] flex-col border-r border-cream-200 bg-cream-50 px-[18px] py-5 shadow-lg">
            <div className="mb-6 flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-3">
                <Mark size={28} color="var(--ink-900)" />
                <div className="h-[20px] w-px bg-cream-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-500">
                  Propiedades
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center rounded-sm text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            </div>

            <SidebarNav />

            <div className="mt-auto px-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-400">
                v0.1 · Coghlan
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
