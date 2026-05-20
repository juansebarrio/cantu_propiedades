import { clsx } from "clsx";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink",
      "placeholder:text-ink/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
