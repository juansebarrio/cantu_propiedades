import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUsuarioActual,
  puedeVerNotasInternas,
} from "@/lib/auth/current-user";
import { obtenerLead, listarSociosActivos } from "@/lib/supabase/queries/leads";
import { LeadFormEditar } from "@/components/lead/LeadFormEditar";
import { Card } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default async function EditarLeadPage({
  params,
}: {
  params: { id: string };
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  let lead: any;
  try {
    lead = await obtenerLead(params.id, usuario.rol);
  } catch {
    notFound();
  }
  if (!lead) notFound();

  const socios = await listarSociosActivos();
  const verNotas = puedeVerNotasInternas(usuario.rol);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href={`/leads/${params.id}`}
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a la ficha
      </Link>

      <h1 className="font-display text-3xl font-semibold text-ink">
        Editar lead
      </h1>
      <p className="mb-6 mt-1 text-sm text-ink/60">
        {lead.nombre} · {lead.telefono ?? "sin teléfono"}
      </p>

      <Card>
        <LeadFormEditar
          lead={lead}
          socios={socios as any}
          puedeEditarNotas={verNotas}
        />
      </Card>
    </div>
  );
}
