import { clsx } from "clsx";
import { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLLabelElement> & {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

export function Field({
  label,
  hint,
  required,
  error,
  children,
  className,
  ...props
}: Props) {
  return (
    <label
      className={clsx("flex flex-col gap-1.5", className)}
      {...(props as any)}
    >
      <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
        {label}
        {required && <span className="text-brick-600">*</span>}
      </span>
      {children}
      {error ? (
        <span className="text-[11px] text-brick-600">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-ink-400">{hint}</span>
      ) : null}
    </label>
  );
}
