import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      "w-full rounded-sm border border-ink-200 bg-white px-3 py-2.5",
      "font-sans text-sm text-ink-900",
      "placeholder:text-ink-400",
      "focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "aria-[invalid=true]:border-brick-500 aria-[invalid=true]:ring-[3px] aria-[invalid=true]:ring-brick-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
