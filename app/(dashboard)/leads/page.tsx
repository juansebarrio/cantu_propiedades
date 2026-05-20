import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarLeads, listarSociosActivos } from "@/lib/supabase/queries/leads";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Plus, Search } from "lucide-react";

const estadosLead = [
  "nuevo",
  "contactado",
  "con_visita",
  "con_oferta",
  "sin_interes",
  "cerrado_exitoso",
  "archivado",
];

const canales = [
  "whatsapp_oficina",
  "whatsapp_zulma",
  "whatsapp_martin",
  "mail",
  "formulario_web",
  "zonaprop",
  "argenprop",
  "mercadolibre",
  "soloduenos",
  "fb_marketplace",
  "referido_zulma",
  "wsp_inmobiliarias_coghlan",
  "otro",
];

type SearchParams = {
  q?: string;
  estado?: string;
  canal_origen?: string;
  responsable_id?: string;
};

function tonoParaEstadoLead(estado: string) {
  const map: Record<string, any> = {
    nuevo: "blue",
    contactado: "yellow",
    con_visita: "violet",
    con_oferta: "orange",
    sin_interes: "neutral",
    cerrado_exitoso: "green",
    archivado: "neutral",
  };
  return map[estado] ?? "neutral";
}

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const [leads, socios] = await Promise.all([
    listarLeads(usuario.rol, {
      busqueda: searchParams.q,
      estado: searchParams.estado,
      canal_origen: searchParams.canal_origen,
      responsable_id: searchParams.responsable_id,
    }),
    listarSociosActivos(),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink/60">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} en seguimiento
          </p>
        </div>
        <Link href="/leads/nuevo">
          <Button>
            <Plus size={16} />
            Nuevo lead
          </Button>
        </Link>
      </div>

      <Card className="mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Buscar
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <Input
                name="q"
                placeholder="Nombre o teléfono..."
                defaultValue={searchParams.q ?? ""}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Estado
            </label>
            <Select name="estado" defaultValue={searchParams.estado ?? ""}>
              <option value="">Todos</option>
              {estadosLead.map((e) => (
                <option key={e} value={e}>
                  {e.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Canal
            </label>
            <Select
              name="canal_origen"
              defaultValue={searchParams.canal_origen ?? ""}
            >
              <option value="">Todos</option>
              {canales.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Responsable
            </label>
            <Select
              name="responsable_id"
              defaultValue={searchParams.responsable_id ?? ""}
            >
              <option value="">Todos</option>
              {socios.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
            <Link href="/leads">
              <Button type="button" variant="ghost">
                Limpiar
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {leads.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/50">
            No hay leads que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Nombre</th>
                <th className="px-6 py-3 text-left font-medium">Teléfono</th>
                <th className="px-6 py-3 text-left font-medium">Propiedad</th>
                <th className="px-6 py-3 text-left font-medium">Canal</th>
                <th className="px-6 py-3 text-left font-medium">Estado</th>
                <th className="px-6 py-3 text-left font-medium">Responsable</th>
                <th className="px-6 py-3 text-left font-medium">
                  Próxima acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {leads.map((l: any) => (
                <tr key={l.id} className="hover:bg-line/10">
                  <td className="px-6 py-4">
                    <Link
                      href={`/leads/${l.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {l.nombre}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-ink/70">
                    {l.telefono ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-ink/70">
                    {l.propiedad?.direccion ?? (
                      <span className="italic text-ink/40">general</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs capitalize text-ink/60">
                      {l.canal_origen.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={tonoParaEstadoLead(l.estado)}>
                      {l.estado.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-ink/70">
                    {l.responsable?.nombre ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-ink/60">
                    {l.proxima_accion ? (
                      <>
                        <div className="text-xs">{l.proxima_accion}</div>
                        <div className="text-xs text-ink/40">
                          {formatearFecha(l.fecha_proxima_accion)}
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
