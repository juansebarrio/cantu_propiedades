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
        className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Volver a la ficha
      </Link>

      <header className="mb-8 border-b border-cream-200 pb-6">
        <h1 className="font-display text-4xl tracking-tight text-ink-900">
          Editar lead
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          {lead.nombre} · {lead.telefono ?? "Sin teléfono"}
        </p>
      </header>

      <Card className="p-8 lg:p-10">
        <LeadFormEditar
          lead={lead}
          socios={socios as any}
          puedeEditarNotas={verNotas}
        />
      </Card>
    </div>
  );
}
