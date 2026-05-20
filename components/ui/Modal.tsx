"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
};

const widthClasses: Record<NonNullable<Props["maxWidth"]>, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "md",
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    d.addEventListener("cancel", handleCancel);
    return () => d.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={clsx(
        "w-full rounded-md border border-ink-100 bg-white p-0",
        "backdrop:bg-ink-900/40 backdrop:backdrop-blur-[2px]",
        widthClasses[maxWidth],
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-4">
        <div>
          <h2 className="font-display text-xl tracking-tight text-ink-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-sm p-1 text-ink-500 transition-colors hover:bg-cream-100 hover:text-ink-900"
        >
          <X size={18} strokeWidth={1.5} />
        </button>
      </div>

      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
