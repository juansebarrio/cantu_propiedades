import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarLeads, listarSociosActivos } from "@/lib/supabase/queries/leads";
import { Card } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
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

  const nuevos = leads.filter((l: any) => l.estado === "nuevo").length;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex items-end justify-between gap-6 border-b border-cream-200 pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            Leads
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            {leads.length} {leads.length === 1 ? "lead" : "leads"} ·{" "}
            {nuevos} {nuevos === 1 ? "sin contactar" : "sin contactar"}
          </p>
        </div>
        <Link href="/leads/nuevo">
          <Button variant="accent">
            <Plus size={16} strokeWidth={1.5} />
            Nuevo lead
          </Button>
        </Link>
      </header>

      <Card className="mb-6">
        <form className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar">
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.5}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <Input
                name="q"
                placeholder="Nombre o teléfono..."
                defaultValue={searchParams.q ?? ""}
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Estado">
            <Select name="estado" defaultValue={searchParams.estado ?? ""}>
              <option value="">Todos</option>
              {estadosLead.map((e) => (
                <option key={e} value={e}>
                  {e.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Canal">
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
          </Field>

          <Field label="Responsable">
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
          </Field>

          <div className="flex items-end gap-2 lg:col-span-4 lg:justify-end">
            <Link href="/leads">
              <Button type="button" variant="ghost">
                Limpiar filtros
              </Button>
            </Link>
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
          </div>
        </form>
      </Card>

      {leads.length === 0 ? (
        <Card>
          <p className="text-center font-display text-lg italic text-ink-500">
            No hay leads que coincidan con los filtros.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/leads">
              <Button variant="ghost">Limpiar filtros</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Lead
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 md:table-cell">
                    Teléfono
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 md:table-cell">
                    Propiedad
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 xl:table-cell">
                    Origen
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Estado
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 lg:table-cell">
                    Responsable
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 lg:table-cell">
                    Próxima acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l: any) => (
                  <tr
                    key={l.id}
                    className="border-b border-cream-200 transition-colors last:border-0 hover:bg-cream-100"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/leads/${l.id}`}
                        className="block hover:text-brick-600"
                      >
                        <div className="font-display text-[17px] text-ink-900">
                          {l.nombre}
                        </div>
                        {l.email && (
                          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                            {l.email}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 font-mono text-sm text-ink-700 md:table-cell">
                      {l.telefono ?? "—"}
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-ink-700 md:table-cell">
                      {l.propiedad?.direccion ?? (
                        <span className="italic text-ink-400">general</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-4 xl:table-cell">
                      {l.canal_origen === "referido_zulma" ? (
                        <Badge tone="plum">Referido por Zulma</Badge>
                      ) : (
                        <Badge tone="slate" dot={false}>
                          {l.canal_origen.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Badge tone={tonoParaEstado(l.estado)}>
                        {l.estado.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-sm text-ink-700 lg:table-cell">
                      {l.responsable?.nombre ?? "—"}
                    </td>
                    <td className="hidden px-4 py-4 lg:table-cell">
                      {l.proxima_accion ? (
                        <>
                          <div className="text-sm text-ink-700">
                            {l.proxima_accion}
                          </div>
                          <div className="whitespace-nowrap font-mono text-[10px] uppercase tracking-widest text-ink-500">
                            {formatearFecha(l.fecha_proxima_accion)}
                          </div>
                        </>
                      ) : (
                        <span className="text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
