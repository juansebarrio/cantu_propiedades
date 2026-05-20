import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Tone =
  | "neutral"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "blue"
  | "violet";

const tones: Record<Tone, string> = {
  neutral: "bg-line/40 text-ink/70",
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  violet: "bg-violet-100 text-violet-800",
};

type Props = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function tonoParaEstado(estado: string): Tone {
  const map: Record<string, Tone> = {
    captada: "neutral",
    publicada: "green",
    con_visitas: "blue",
    con_oferta: "orange",
    reservada: "violet",
    cerrada: "neutral",
    pausada: "yellow",
    archivada: "neutral",
  };
  return map[estado] ?? "neutral";
}
