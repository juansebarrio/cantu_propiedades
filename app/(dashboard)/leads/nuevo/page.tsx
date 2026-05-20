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
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a leads
      </Link>

      <h1 className="font-display text-3xl font-semibold text-ink">
        Nuevo lead
      </h1>
      <p className="mb-6 mt-1 text-sm text-ink/60">
        Cargá los datos. Al ingresar el teléfono, el sistema chequea si ya
        consultó antes.
      </p>

      <Card>
        <LeadFormNuevo
          propiedades={propiedades}
          duenos={duenos}
          socios={socios as any}
        />
      </Card>
    </div>
  );
}
