import { FileText } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="mx-auto max-w-2xl py-16">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-ink-700">
          <FileText size={28} strokeWidth={1.5} />
        </div>
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.32em] text-ink-400">
          Próximamente
        </div>
        <h1 className="mb-3 font-display text-3xl tracking-tight text-ink-900">
          Reportes
        </h1>
        <p className="max-w-md text-[15px] leading-relaxed text-ink-500">
          Acá vas a poder generar y descargar los informes mensuales para dueños,
          con detalle de visitas, consultas y estado de cada propiedad.
        </p>
        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-ink-400">
          El primer envío automático arranca el día 1 del mes próximo
        </p>
      </div>
    </div>
  );
}
