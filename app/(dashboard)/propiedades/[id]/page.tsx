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
import { ArrowLeft } from "lucide-react";

function formatearMonto(precio: number | null): string {
  if (precio === null) return "—";
  return new Intl.NumberFormat("es-AR").format(precio);
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function diasDesde(fecha: string): number {
  const d = new Date(fecha);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
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
  const dias = diasDesde(propiedad.fecha_captacion);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/propiedades"
        className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Volver a propiedades
      </Link>

      <header className="mb-10 border-b border-cream-200 pb-8">
        <div className="mb-3 flex items-center gap-2">
          <Badge tone={tonoParaEstado(propiedad.estado)}>
            {propiedad.estado.replace(/_/g, " ")}
          </Badge>
          {propiedad.confidencial && verAcuerdo && (
            <Badge tone="brick">Confidencial</Badge>
          )}
        </div>
        <h1 className="font-display text-5xl tracking-tight text-ink-900">
          {propiedad.direccion}
        </h1>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
          Propiedad · {propiedad.tipo} · {propiedad.operacion} · Captada hace{" "}
          {dias} {dias === 1 ? "día" : "días"}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna principal · 2/3 */}
        <div className="space-y-6 lg:col-span-2">
          {propiedad.descripcion_comercial && (
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <p className="text-sm leading-relaxed text-ink-700">
                {propiedad.descripcion_comercial}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Visitas y devoluciones</CardTitle>
            </CardHeader>
            {(propiedad.visitas?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                Sin visitas registradas todavía.
              </p>
            ) : (
              <ul className="space-y-5">
                {propiedad.visitas.map((v: any) => (
                  <li key={v.id} className="border-l-2 border-cream-300 pl-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-display text-base text-ink-900">
                        {v.lead?.nombre ?? "Prospecto sin nombre"}
                      </div>
                      <Badge tone={tonoParaEstado(v.estado)}>
                        {v.estado.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                      {formatearFecha(v.fecha_agendada)} · Responsable{" "}
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
              <CardTitle>Leads asociados</CardTitle>
            </CardHeader>
            {(propiedad.leads?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                Sin leads asociados.
              </p>
            ) : (
              <ul className="divide-y divide-cream-200">
                {propiedad.leads.map((l: any) => (
                  <li key={l.id}>
                    <Link
                      href={`/leads/${l.id}`}
                      className="flex items-center justify-between py-3 transition-colors hover:bg-cream-100"
                    >
                      <div>
                        <div className="font-display text-base text-ink-900">
                          {l.nombre}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                          {l.telefono ?? "Sin teléfono"} · Vía{" "}
                          {l.canal_origen.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Badge tone={tonoParaEstado(l.estado)}>
                        {l.estado.replace(/_/g, " ")}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {verNotas && propiedad.notas_internas && (
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
                {propiedad.notas_internas}
              </p>
            </Card>
          )}
        </div>

        {/* Aside · 1/3 */}
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardSubtitle>Precio publicado</CardSubtitle>
            </CardHeader>
            <div className="num font-display text-3xl tracking-tight text-ink-900">
              {propiedad.moneda?.toUpperCase()}{" "}
              {formatearMonto(propiedad.precio_actual)}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-500">
              Captada · {formatearFecha(propiedad.fecha_captacion)}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dueño</CardTitle>
            </CardHeader>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Nombre
                </dt>
                <dd className="mt-0.5 font-display text-lg text-ink-900">
                  {dueno?.nombre ?? "—"}
                </dd>
              </div>
              {dueno?.email && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-ink-700">{dueno.email}</dd>
                </div>
              )}
              {dueno?.telefono && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Teléfono
                  </dt>
                  <dd className="mt-0.5 font-mono text-ink-700">
                    {dueno.telefono}
                  </dd>
                </div>
              )}
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Canal preferido
                </dt>
                <dd className="mt-0.5 capitalize text-ink-700">
                  {dueno?.canal_preferido?.replace(/_/g, " ") ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                  Frecuencia reporte
                </dt>
                <dd className="mt-0.5 capitalize text-ink-700">
                  {dueno?.frecuencia_reporte?.replace(/_/g, " ") ?? "—"}
                </dd>
              </div>
              {verNotas && dueno?.notas_internas && (
                <div>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Notas
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-ink-700">
                    {dueno.notas_internas}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {verAcuerdo && dueno?.acuerdo_especial && (
            <Card className="border-plum-50 bg-plum-50/30">
              <CardHeader>
                <CardSubtitle className="text-plum-500">
                  Acuerdo especial
                </CardSubtitle>
              </CardHeader>
              <p className="font-display text-lg italic leading-snug text-ink-900">
                {dueno.acuerdo_especial}
              </p>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Portales</CardTitle>
            </CardHeader>
            {(propiedad.portales?.length ?? 0) === 0 ? (
              <p className="text-sm italic text-ink-500">
                No publicada en portales todavía.
              </p>
            ) : (
              <ul className="space-y-2.5 text-sm">
                {propiedad.portales.map((p: any) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="capitalize text-ink-700">
                      {p.portal.replace(/_/g, " ")}
                    </span>
                    <Badge
                      tone={
                        p.estado_en_portal === "publicada" ? "green" : "slate"
                      }
                    >
                      {p.estado_en_portal.replace(/_/g, " ")}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
