import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
  color?: string;
};

export function Mark({
  size = 96,
  color,
  className,
  style,
  ...props
}: Props) {
  return (
    <span
      role="img"
      aria-label="Logo Cantú Propiedades"
      className={clsx("inline-flex items-center justify-center", className)}
      style={{
        width: size * 1.08,
        height: size,
        lineHeight: 1,
        ...style,
      }}
      {...props}
    >
      <span
        className="font-display"
        style={{
          fontSize: size * 0.96,
          lineHeight: 1,
          letterSpacing: "-0.16em",
          color: color ?? "currentColor",
          paddingRight: size * 0.04,
        }}
      >
        ZC
      </span>
    </span>
  );
}
