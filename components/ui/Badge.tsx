import { clsx } from "clsx";
import { HTMLAttributes } from "react";

type Tone =
  | "slate"
  | "amber"
  | "plum"
  | "brick"
  | "cream"
  | "green"
  | "ink";

const tones: Record<Tone, { bg: string; fg: string }> = {
  slate: { bg: "bg-slate-50", fg: "text-slate-500" },
  amber: { bg: "bg-amber-50", fg: "text-amber-500" },
  plum: { bg: "bg-plum-50", fg: "text-plum-500" },
  brick: { bg: "bg-brick-50", fg: "text-brick-700" },
  cream: { bg: "bg-cream-200", fg: "text-ink-700" },
  green: { bg: "bg-green-50", fg: "text-green-500" },
  ink: { bg: "bg-ink-800", fg: "text-cream-100" },
};

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
};

export function Badge({
  tone = "slate",
  dot = true,
  className,
  children,
  ...props
}: Props) {
  const t = tones[tone];

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
        "whitespace-nowrap text-[11px] font-medium tracking-tight",
        t.bg,
        t.fg,
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className="h-[5px] w-[5px] rounded-full opacity-50"
          style={{ background: "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}

export function tonoParaEstado(estado: string): Tone {
  const map: Record<string, Tone> = {
    // Propiedades
    captada: "cream",
    publicada: "green",
    con_visitas: "slate",
    con_oferta: "brick",
    reservada: "plum",
    cerrada: "ink",
    pausada: "amber",
    archivada: "slate",
    // Leads
    nuevo: "slate",
    contactado: "amber",
    con_visita: "plum",
    sin_interes: "slate",
    cerrado_exitoso: "green",
    // Visitas
    agendada: "slate",
    confirmada: "plum",
    realizada: "green",
    cancelada: "slate",
    no_asistio: "amber",
  };
  return map[estado] ?? "slate";
}
