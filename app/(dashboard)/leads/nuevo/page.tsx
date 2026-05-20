import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import {
  listarPropiedadesParaLead,
  listarDuenosParaReferencia,
  listarSociosActivos,
} from "@/lib/supabase/queries/leads";
import { LeadFormNuevo } from "@/components/lead/LeadFormNuevo";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default async function NuevoLeadPage() {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const [propiedades, duenos, socios] = await Promise.all([
    listarPropiedadesParaLead(),
    listarDuenosParaReferencia(),
    listarSociosActivos(),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Volver a leads
      </Link>

      <header className="mb-8 border-b border-cream-200 pb-6">
        <h1 className="font-display text-4xl tracking-tight text-ink-900">
          Nuevo lead
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          Cargá los datos del contacto · El sistema chequea duplicados al
          ingresar el teléfono
        </p>
      </header>

      <Card className="p-8 lg:p-10">
        <LeadFormNuevo
          propiedades={propiedades}
          duenos={duenos}
          socios={socios as any}
        />
      </Card>
    </div>
  );
}
