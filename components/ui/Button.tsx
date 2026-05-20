import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variants: Record<Variant, string> = {
  primary: "bg-ink-900 text-cream-50 border border-ink-900 hover:bg-ink-800",
  accent: "bg-brick-500 text-cream-50 border border-brick-500 hover:bg-brick-600",
  secondary:
    "bg-transparent text-ink-900 border border-ink-200 hover:bg-cream-100",
  ghost:
    "bg-transparent text-ink-900 border border-transparent hover:bg-cream-100",
  danger:
    "bg-transparent text-brick-700 border border-brick-200 hover:bg-brick-50",
};

const sizes: Record<Size, string> = {
  sm: "h-[30px] px-3 text-xs gap-1.5",
  md: "h-[38px] px-4 text-sm gap-2",
  lg: "h-[46px] px-5 text-[15px] gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-sm font-medium tracking-tight",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "focus:outline-none focus:ring-2 focus:ring-ink-900/10",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = "Button";
