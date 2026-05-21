import { clsx } from "clsx";
import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  label: string;
  valor: number | string;
  hint?: string;
};

export function KpiCard({ label, valor, hint, className, ...props }: Props) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-2 rounded-md border border-ink-100 bg-white px-5 py-4",
        className,
      )}
      {...props}
    >
      <div className="num font-display text-4xl leading-none tabular-nums text-ink-900">
        {valor}
      </div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {label}
      </div>
      {hint && (
        <div className="font-mono text-[10px] tracking-tight text-ink-400">
          {hint}
        </div>
      )}
    </div>
  );
}
