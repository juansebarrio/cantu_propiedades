import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getUsuarioActual,
  puedeVerAcuerdoEspecial,
  puedeVerNotasInternas,
} from "@/lib/auth/current-user";
import { obtenerPropiedad } from "@/lib/supabase/queries/propiedades";
import {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
} from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { ArrowLeft, Lock } from "lucide-react";

function formatearPrecio(precio: number | null, moneda: string): string {
  if (precio === null) return "—";
  return `${moneda.toUpperCase()} ${new Intl.NumberFormat("es-AR").format(precio)}`;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PropiedadDetalle({
  params,
}: {
  params: { id: string };
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  let propiedad;
  try {
    propiedad = await obtenerPropiedad(params.id, usuario.rol);
  } catch {
    notFound();
  }
  if (!propiedad) notFound();

  const dueno = propiedad.dueno as any;
  const verNotas = puedeVerNotasInternas(usuario.rol);
  const verAcuerdo = puedeVerAcuerdoEspecial(usuario.rol);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/propiedades"
        className="mb-4 inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"
      >
        <ArrowLeft size={14} />
        Volver a propiedades
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tonoParaEstado(propiedad.estado)}>
              {propiedad.estado.replace("_", " ")}
            </Badge>
            {propiedad.confidencial && verAcuerdo && (
              <Badge tone="violet">
                <Lock size={10} className="mr-1" />
                Confidencial
              </Badge>
            )}
          </div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {propiedad.direccion}
          </h1>
          <p className="mt-1 capitalize text-ink/60">
            {propiedad.tipo} · {propiedad.operacion} · captada{" "}
            {formatearFecha(propiedad.fecha_captacion)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wide text-ink/50">
            Precio
          </div>
          <div className="font-display text-2xl font-semibold text-ink">
            {formatearPrecio(propiedad.precio_actual, propiedad.moneda)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {propiedad.descripcion_comercial && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <p className="text-sm leading-relaxed text-ink/70">
                {propiedad.descripcion_comercial}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Visitas y devoluciones</CardTitle>
            </CardHeader>
            {(propiedad.visitas?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">
                Sin visitas registradas todavía.
              </p>
            ) : (
              <ul className="space-y-4">
                {propiedad.visitas.map((v: any) => (
                  <li key={v.id} className="border-l-2 border-line pl-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-ink">
                        {v.lead?.nombre ?? "Prospecto sin nombre"}
                      </div>
                      <Badge
                        tone={tonoParaEstado(
                          v.estado === "realizada" ? "publicada" : "captada",
                        )}
                      >
                        {v.estado}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-ink/50">
                      {formatearFecha(v.fecha_agendada)} · responsable:{" "}
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
              <CardTitle>Leads asociados</CardTitle>
            </CardHeader>
            {(propiedad.leads?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">Sin leads asociados.</p>
            ) : (
              <ul className="divide-y divide-line">
                {propiedad.leads.map((l: any) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {l.nombre}
                      </div>
                      <div className="text-xs text-ink/50">
                        {l.telefono ?? "sin teléfono"} · vía{" "}
                        {l.canal_origen.replace("_", " ")}
                      </div>
                    </div>
                    <Badge tone="neutral">{l.estado.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {verNotas && propiedad.notas_internas && (
            <Card>
              <CardHeader>
                <CardTitle>Notas internas</CardTitle>
                <CardSubtitle>Solo visible para socios</CardSubtitle>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
                {propiedad.notas_internas}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dueño</CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Nombre
                </div>
                <div className="text-ink">{dueno?.nombre ?? "—"}</div>
              </div>
              {dueno?.email && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">
                    Email
                  </div>
                  <div className="text-ink/70">{dueno.email}</div>
                </div>
              )}
              {dueno?.telefono && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">
                    Teléfono
                  </div>
                  <div className="text-ink/70">{dueno.telefono}</div>
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Canal preferido
                </div>
                <div className="capitalize text-ink/70">
                  {dueno?.canal_preferido?.replace("_", " ")}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-ink/50">
                  Frecuencia reporte
                </div>
                <div className="capitalize text-ink/70">
                  {dueno?.frecuencia_reporte?.replace("_", " ")}
                </div>
              </div>
              {verNotas && dueno?.notas_internas && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink/50">
                    Notas
                  </div>
                  <div className="whitespace-pre-wrap text-ink/70">
                    {dueno.notas_internas}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {verAcuerdo && dueno?.acuerdo_especial && (
            <Card className="border-violet-200 bg-violet-50/30">
              <CardHeader>
                <CardTitle className="text-violet-900">
                  Acuerdo especial
                </CardTitle>
                <CardSubtitle className="text-violet-700">
                  <Lock size={10} className="mr-1 inline" />
                  Solo visible para vos
                </CardSubtitle>
              </CardHeader>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-900">
                {dueno.acuerdo_especial}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Portales</CardTitle>
            </CardHeader>
            {(propiedad.portales?.length ?? 0) === 0 ? (
              <p className="text-sm text-ink/50">
                No publicada en portales todavía.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {propiedad.portales.map((p: any) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize text-ink/70">
                      {p.portal.replace("_", " ")}
                    </span>
                    <Badge
                      tone={
                        p.estado_en_portal === "publicada" ? "green" : "neutral"
                      }
                    >
                      {p.estado_en_portal.replace("_", " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
