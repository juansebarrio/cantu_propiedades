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
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, AlertCircle, ExternalLink } from "lucide-react";

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

function tonoParaEstadoLead(estado: string): any {
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

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/leads"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a leads
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tonoParaEstadoLead(lead.estado)}>
              {lead.estado.replace(/_/g, " ")}
            </Badge>
            <span className="text-xs capitalize text-ink/50">
              vía {lead.canal_origen.replace(/_/g, " ")}
            </span>
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {lead.nombre}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {lead.telefono ?? "sin teléfono"} · {lead.email ?? "sin email"} ·
            ingresó {formatearFecha(lead.creado_en)}
          </p>
        </div>
      </div>

      {duplicados.length > 0 && (
        <Card className="mb-6 border-orange-200 bg-orange-50/40">
          <div className="flex items-start gap-3">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-orange-600"
            />
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-orange-900">
                Otros leads con este teléfono
              </h3>
              <p className="mt-1 text-sm text-orange-800/80">
                Este número apareció en {duplicados.length}{" "}
                {duplicados.length === 1
                  ? "consulta previa"
                  : "consultas previas"}
                . Es muy probable que sea la misma persona.
              </p>
              <ul className="mt-3 divide-y divide-orange-200/60">
                {duplicados.map((d: any) => (
                  <li key={d.id} className="py-2">
                    <Link
                      href={`/leads/${d.id}`}
                      className="group flex items-center justify-between"
                    >
                      <div className="text-sm">
                        <span className="font-medium text-orange-900 group-hover:underline">
                          {d.nombre}
                        </span>
                        <span className="ml-2 text-orange-800/70">
                          {d.propiedad?.direccion ?? "consulta general"} · vía{" "}
                          {d.canal_origen.replace(/_/g, " ")}
                        </span>
                      </div>
                      <ExternalLink size={12} className="text-orange-600" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Propiedad de interés</CardTitle>
            </CardHeader>
            {lead.propiedad ? (
              <Link
                href={`/propiedades/${lead.propiedad.id}`}
                className="group flex items-start justify-between gap-4"
              >
                <div>
                  <div className="font-medium text-ink group-hover:text-accent">
                    {lead.propiedad.direccion}
                  </div>
                  <div className="mt-1 text-sm capitalize text-ink/60">
                    {lead.propiedad.tipo} · {lead.propiedad.operacion} ·{" "}
                    <Badge tone="neutral">
                      {lead.propiedad.estado.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </div>
                {lead.propiedad.precio_actual && (
                  <div className="text-right text-sm font-medium text-ink">
                    {lead.propiedad.moneda?.toUpperCase()}{" "}
                    {new Intl.NumberFormat("es-AR").format(
                      lead.propiedad.precio_actual,
                    )}
                  </div>
                )}
              </Link>
            ) : (
              <p className="text-sm text-ink/50">
                Sin propiedad asignada · es una búsqueda general.
              </p>
            )}

            {!lead.propiedad && lead.criterio_busqueda && (
              <div className="mt-4 rounded-md bg-line/20 p-3 text-sm">
                <div className="mb-2 text-xs uppercase tracking-wide text-ink/50">
                  Criterio
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-ink/70">
                  {JSON.stringify(lead.criterio_busqueda, null, 2)}
                </pre>
              </div>
            )}
          </Card>

          {lead.referido_por && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="text-violet-900">
                  Referido personal
                </CardTitle>
                <CardSubtitle className="text-violet-700">
                  Este lead llegó por recomendación
                </CardSubtitle>
              </CardHeader>
              <p className="text-sm text-violet-900">
                Lo refirió{" "}
                <span className="font-semibold">
                  {lead.referido_por.nombre}
                </span>
                {lead.referido_por.telefono && (
                  <span className="text-violet-800/70">
                    {" "}
                    · {lead.referido_por.telefono}
                  </span>
                )}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Historial de consultas</CardTitle>
              <CardSubtitle>
                Por qué propiedades preguntó este lead
              </CardSubtitle>
            </CardHeader>
            {(lead.consultas?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">
                Sin consultas previas registradas.
              </p>
            ) : (
              <ul className="space-y-3">
                {lead.consultas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() -
                      new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="flex items-start justify-between border-l-2 border-line pl-4"
                    >
                      <div>
                        <Link
                          href={`/propiedades/${c.propiedad?.id}`}
                          className="text-sm font-medium text-ink hover:text-accent"
                        >
                          {c.propiedad?.direccion ?? "Propiedad sin asignar"}
                        </Link>
                        <div className="text-xs text-ink/50">
                          {formatearFechaHora(c.fecha)} · vía{" "}
                          {c.canal_origen.replace(/_/g, " ")}
                        </div>
                        {c.notas && (
                          <p className="mt-1 text-sm italic text-ink/60">
                            &ldquo;{c.notas}&rdquo;
                          </p>
                        )}
                      </div>
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
              <p className="text-sm text-ink/50">
                Sin visitas registradas.
              </p>
            ) : (
              <ul className="space-y-4">
                {lead.visitas
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha_agendada).getTime() -
                      new Date(a.fecha_agendada).getTime(),
                  )
                  .map((v: any) => (
                    <li key={v.id} className="border-l-2 border-line pl-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-ink">
                          {v.propiedad?.direccion ?? "—"}
                        </div>
                        <Badge tone="neutral">
                          {v.estado.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-ink/50">
                        {formatearFechaHora(v.fecha_agendada)} · con{" "}
                        {v.responsable?.nombre ?? "—"}
                      </div>
                      {v.devolucion_prospecto && (
                        <p className="mt-2 text-sm italic text-ink/70">
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
              <p className="text-sm text-ink/50">
                Sin comunicaciones registradas.
              </p>
            ) : (
              <ul className="space-y-3">
                {lead.comunicaciones
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.fecha).getTime() -
                      new Date(a.fecha).getTime(),
                  )
                  .map((c: any) => (
                    <li
                      key={c.id}
                      className="border-l-2 border-line pl-4 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs capitalize text-ink/50">
                          {c.tipo.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-ink/40">
                          {formatearFechaHora(c.fecha)}
                        </span>
                      </div>
                      <p className="mt-1 text-ink/80">{c.contenido}</p>
                      {c.registrada_por?.nombre && (
                        <p className="mt-1 text-xs text-ink/40">
                          registrado por {c.registrada_por.nombre}
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
                <CardTitle>Notas internas</CardTitle>
                <CardSubtitle>Solo visible para socios</CardSubtitle>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
                {lead.notas_internas}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {lead.proxima_accion && (
            <Card className="border-accent/30 bg-accent/5">
              <CardHeader>
                <CardTitle>Próxima acción</CardTitle>
                <CardSubtitle>
                  {formatearFechaHora(lead.fecha_proxima_accion)}
                </CardSubtitle>
              </CardHeader>
              <p className="text-sm text-ink/80">{lead.proxima_accion}</p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <div className="text-sm">
              {lead.responsable ? (
                <span className="font-medium text-ink">
                  {lead.responsable.nombre}
                </span>
              ) : (
                <span className="text-ink/50">Sin asignar</span>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datos</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Canal de origen
                </div>
                <div className="capitalize text-ink/70">
                  {lead.canal_origen.replace(/_/g, " ")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Última actualización
                </div>
                <div className="text-ink/70">
                  {formatearFechaHora(lead.actualizado_en)}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Creación
                </div>
                <div className="text-ink/70">
                  {formatearFechaHora(lead.creado_en)}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
