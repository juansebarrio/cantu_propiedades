import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLSpanElement> & {
  size?: number;
  color?: string;
};

export function Wordmark({
  size = 96,
  color,
  className,
  style,
  ...props
}: Props) {
  return (
    <span
      className={clsx("font-display", className)}
      style={{
        fontSize: size,
        lineHeight: 0.9,
        letterSpacing: "-0.01em",
        color: color ?? "currentColor",
        fontFeatureSettings: '"liga" 1',
        ...style,
      }}
      {...props}
    >
      Cantú
    </span>
  );
}
