import { clsx } from "clsx";
import { SelectHTMLAttributes, forwardRef } from "react";

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={clsx(
      "rounded-md border border-line bg-white px-3 py-2 text-sm text-ink",
      "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
      className,
    )}
    {...props}
  />
));
Select.displayName = "Select";
