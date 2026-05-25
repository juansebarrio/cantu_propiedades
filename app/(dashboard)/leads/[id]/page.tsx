import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUsuarioActual,
  puedeVerNotasInternas,
} from "@/lib/auth/current-user";
import {
  obtenerLead,
  leadsConMismoTelefono,
} from "@/lib/supabase/queries/leads";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
} from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";

function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatearFechaHora(fecha: string | null): string {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diasDesde(fecha: string): number {
  const d = new Date(fecha);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function LeadDetalle({
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

  const duplicados = await leadsConMismoTelefono(lead.id, lead.telefono);
  const verNotas = puedeVerNotasInternas(usuario.rol);
  const esReferidoZulma = lead.canal_origen === "referido_zulma";
  const dias = diasDesde(lead.creado_en);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/leads"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Volver a leads
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-cream-200 pb-6 sm:mb-10 sm:gap-6 sm:pb-8">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone={tonoParaEstado(lead.estado)}>
              {lead.estado.replace(/_/g, " ")}
            </Badge>
            {esReferidoZulma && (
              <Badge tone="plum">Referido por Zulma</Badge>
            )}
          </div>
          <h1 className="font-display text-3xl tracking-tight text-ink-900 sm:text-5xl">
            {lead.nombre}
          </h1>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            Lead · Cargado hace {dias} {dias === 1 ? "día" : "días"} · Vía{" "}
            {lead.canal_origen.replace(/_/g, " ")}
          </p>
        </div>
        <Link href={`/leads/${lead.id}/editar`}>
          <Button variant="secondary" size="sm">
            <Pencil size={14} strokeWidth={1.5} />
            Editar
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal · 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {duplicados.length > 0 && (
            <Card className="border-brick-200 bg-brick-50/50">
              <CardHeader>
                <CardSubtitle className="text-brick-700">
                  Otros leads con este teléfono
                </CardSubtitle>
              </CardHeader>
              <p className="mb-3 text-sm text-ink-700">
                Atención: este teléfono aparece en {duplicados.length}{" "}
                {duplicados.length === 1 ? "lead" : "leads"} más. Es muy
                probable que sea la misma persona.
              </p>
              <ul className="flex flex-col divide-y divide-brick-100">
                {duplicados.map((d: any) => (
                  <li key={d.id}>
                    <Link
                      href={`/leads/${d.id}`}
                      className="-mx-3 flex items-center justify-between gap-3 rounded-sm px-3 py-2 transition-colors hover:bg-brick-50"
                    >
                      <div>
                        <div className="font-display text-base text-ink-900">
                          {d.nombre}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                          {d.propiedad?.direccion ?? "Consulta general"} · Vía{" "}
                          {d.canal_origen.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Badge tone={tonoParaEstado(d.estado)}>
                        {d.estado.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Propiedad de interés</CardTitle>
            </CardHeader>
            {lead.propiedad ? (
              <Link
                href={`/propiedades/${lead.propiedad.id}`}
                className="group flex items-start justify-between gap-4 transition-colors"
              >
                <div>
                  <div className="font-display text-lg text-ink-900 group-hover:text-brick-600">
                    {lead.propiedad.direccion}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    {lead.propiedad.tipo} · {lead.propiedad.operacion}
                  </div>
                  <div className="mt-2">
                    <Badge tone={tonoParaEstado(lead.propiedad.estado)}>
                      {lead.propiedad.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                {lead.propiedad.precio_actual && (
                  <div className="text-right">
                    <div className="num font-display text-xl tracking-tight text-ink-900">
                      {lead.propiedad.moneda?.toUpperCase()}{" "}
                      {new Intl.NumberFormat("es-AR").format(
                        lead.propiedad.precio_actual,
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ) : (
              <p className="text-sm italic text-ink-500">
                Sin propiedad asignada · Es una búsqueda general.
              </p>
            )}

            {!lead.propiedad && lead.criterio_busqueda && (
              <div className="mt-4 rounded-sm border border-cream-200 bg-cream-100 p-3">
                <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Criterio
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-ink-700">
                  {JSON.stringify(lead.criterio_busqueda, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {esReferidoZulma && lead.referido_por && (
            <Card className="border-plum-50 bg-plum-50/30">
              <CardHeader>
                <CardSubtitle className="text-plum-500">
                  Referido por Zulma
                </CardSubtitle>
              </CardHeader>
              <p className="font-display text-lg italic leading-snug text-ink-900">
                Lo refirió{" "}
                <span className="not-italic">
                  {lead.referido_por.nombre}
                </span>
                {lead.referido_por.telefono && (
                  <span className="font-mono text-sm not-italic text-ink-500">
                    {" "}
                    · {lead.referido_por.telefono}
                  </span>
                )}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Historial de consultas</CardTitle>
                <CardSubtitle className="mt-1">
                  Por qué propiedades preguntó este lead
                </CardSubtitle>
              </div>
            </CardHeader>
            {(lead.consultas?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                Sin consultas previas registradas.
              </p>
            ) : (
              <ul className="space-y-4">
                {lead.consultas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() -
                      new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="border-l-2 border-cream-300 pl-4"
                    >
                      <Link
                        href={`/propiedades/${c.propiedad?.id}`}
                        className="font-display text-base text-ink-900 hover:text-brick-600"
                      >
                        {c.propiedad?.direccion ?? "Propiedad sin asignar"}
                      </Link>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                        {formatearFechaHora(c.fecha)} · Vía{" "}
                        {c.canal_origen.replace(/_/g, " ")}
                      </div>
                      {c.notas && (
                        <p className="mt-1 font-display text-base italic text-ink-700">
                          &ldquo;{c.notas}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visitas</CardTitle>
            </CardHeader>
            {(lead.visitas?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                Sin visitas registradas.
              </p>
            ) : (
              <ul className="space-y-5">
                {lead.visitas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha_agendada).getTime() -
                      new Date(a.fecha_agendada).getTime(),
                  )
                  .map((v: any) => (
                    <li key={v.id} className="border-l-2 border-cream-300 pl-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-display text-base text-ink-900">
                          {v.propiedad?.direccion ?? "—"}
                        </div>
                        <Badge tone={tonoParaEstado(v.estado)}>
                          {v.estado.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                        {formatearFechaHora(v.fecha_agendada)} · Con{" "}
                        {v.responsable?.nombre ?? "—"}
                      </div>
                      {v.devolucion_prospecto && (
                        <p className="mt-2 font-display text-base italic leading-snug text-ink-700">
                          &ldquo;{v.devolucion_prospecto}&rdquo;
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comunicaciones</CardTitle>
            </CardHeader>
            {(lead.comunicaciones?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                Sin comunicaciones registradas.
              </p>
            ) : (
              <ul className="space-y-4">
                {lead.comunicaciones
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() -
                      new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="border-l-2 border-cream-300 pl-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                          {c.tipo.replace(/_/g, " ")}
                        </span>
                        <span className="font-mono text-[10px] tracking-widest text-ink-400">
                          {formatearFechaHora(c.fecha)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-800">
                        {c.contenido}
                      </p>
                      {c.registrada_por?.nombre && (
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-400">
                          Registrado por {c.registrada_por.nombre}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {verNotas && lead.notas_internas && (
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Notas internas</CardTitle>
                  <CardSubtitle className="mt-1">
                    Solo visible para socios
                  </CardSubtitle>
                </div>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                {lead.notas_internas}
              </p>
            </Card>
          )}
        </div>

        {/* Aside · 1/3 */}
        <aside className="space-y-6">
          {lead.proxima_accion && (
            <Card className="border-brick-100 bg-brick-50/40">
              <CardHeader>
                <CardSubtitle className="text-brick-700">
                  Próxima acción
                </CardSubtitle>
              </CardHeader>
              <p className="font-display text-base text-ink-900">
                {lead.proxima_accion}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                {formatearFechaHora(lead.fecha_proxima_accion)}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Teléfono
                </dt>
                <dd className="mt-0.5 font-mono text-ink-700">
                  {lead.telefono ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Email
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {lead.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Responsable
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {lead.responsable?.nombre ?? (
                    <span className="italic text-ink-400">Sin asignar</span>
                  )}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <div className="flex flex-col gap-2">
              <Link href={`/agenda?nueva=1&lead=${lead.id}`}>
                <Button variant="accent" className="w-full">
                  Agendar visita
                </Button>
              </Link>
              <Link href={`/leads/${lead.id}/editar`}>
                <Button variant="secondary" className="w-full">
                  <Pencil size={14} strokeWidth={1.5} />
                  Editar lead
                </Button>
              </Link>
              <Button variant="ghost" disabled title="Próximamente">
                WhatsApp
              </Button>
              <Button variant="ghost" disabled title="Próximamente">
                Enviar email
              </Button>
              <Button variant="danger" disabled title="Próximamente">
                Archivar
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trazabilidad</CardTitle>
            </CardHeader>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Creación
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {formatearFecha(lead.creado_en)}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Última actualización
                </dt>
                <dd className="mt-0.5 text-ink-700">
                  {formatearFechaHora(lead.actualizado_en)}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </div>
  );
}
