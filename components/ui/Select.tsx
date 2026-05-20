import { clsx } from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={clsx(
        "w-full appearance-none rounded-sm border border-ink-200 bg-white",
        "px-3 py-2.5 pr-9 font-sans text-sm text-ink-900",
        "focus:border-ink-900 focus:outline-none focus:ring-[3px] focus:ring-ink-900/8",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      strokeWidth={1.5}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
    />
  </div>
));
Select.displayName = "Select";
