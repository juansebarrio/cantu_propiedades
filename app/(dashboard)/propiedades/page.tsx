import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarPropiedades } from "@/lib/supabase/queries/propiedades";
import { Card } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Plus, Search } from "lucide-react";

const tiposPropiedad = [
  "depto",
  "casa",
  "ph",
  "local",
  "oficina",
  "cochera",
  "terreno",
];
const operaciones = ["alquiler", "venta", "temporada"];
const estados = [
  "captada",
  "publicada",
  "con_visitas",
  "con_oferta",
  "reservada",
  "cerrada",
  "pausada",
  "archivada",
];

type SearchParams = {
  q?: string;
  estado?: string;
  tipo?: string;
  operacion?: string;
};

function formatearPrecio(precio: number | null, moneda: string): string {
  if (precio === null) return "—";
  const formato = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
  return `${moneda.toUpperCase()} ${formato.format(precio)}`;
}

function diasDesde(fecha: string): number {
  const d = new Date(fecha);
  const ahora = new Date();
  return Math.floor((ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const usuario = await getUsuarioActual();
  if (!usuario) return null;

  const propiedades = await listarPropiedades(usuario.rol, {
    busqueda: searchParams.q,
    estado: searchParams.estado,
    tipo: searchParams.tipo,
    operacion: searchParams.operacion,
  });

  const publicadas = propiedades.filter(
    (p: any) => p.estado === "publicada",
  ).length;

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex items-end justify-between gap-6 border-b border-cream-200 pb-6">
        <div>
          <h1 className="font-display text-4xl tracking-tight text-ink-900">
            Propiedades
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-500">
            {propiedades.length}{" "}
            {propiedades.length === 1 ? "propiedad" : "propiedades"} ·{" "}
            {publicadas} {publicadas === 1 ? "publicada" : "publicadas"}
          </p>
        </div>
        <Button variant="accent" disabled title="Próximamente">
          <Plus size={16} strokeWidth={1.5} />
          Nueva propiedad
        </Button>
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
                placeholder="Dirección..."
                defaultValue={searchParams.q ?? ""}
                className="pl-9"
              />
            </div>
          </Field>

          <Field label="Estado">
            <Select name="estado" defaultValue={searchParams.estado ?? ""}>
              <option value="">Todos</option>
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Tipo">
            <Select name="tipo" defaultValue={searchParams.tipo ?? ""}>
              <option value="">Todos</option>
              {tiposPropiedad.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Operación">
            <Select
              name="operacion"
              defaultValue={searchParams.operacion ?? ""}
            >
              <option value="">Todas</option>
              {operaciones.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end gap-2 lg:col-span-4 lg:justify-end">
            <Link href="/propiedades">
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

      {propiedades.length === 0 ? (
        <Card>
          <p className="text-center font-display text-lg italic text-ink-500">
            No hay propiedades que coincidan con los filtros.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/propiedades">
              <Button variant="ghost">Limpiar filtros</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-ink-200">
                  <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Propiedad
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 md:table-cell">
                    Operación
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Estado
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-ink-500">
                    Precio
                  </th>
                  <th className="hidden px-4 py-3 text-left font-mono text-[10px] uppercase tracking-widest text-ink-500 lg:table-cell">
                    Dueño
                  </th>
                  <th className="hidden whitespace-nowrap px-4 py-3 text-right font-mono text-[10px] uppercase tracking-widest text-ink-500 xl:table-cell">
                    Días
                  </th>
                </tr>
              </thead>
              <tbody>
                {propiedades.map((p: any) => (
                  <tr
                    key={p.id}
                    className="border-b border-cream-200 transition-colors last:border-0 hover:bg-cream-100"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/propiedades/${p.id}`}
                        className="block hover:text-brick-600"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-[17px] text-ink-900">
                            {p.direccion}
                          </span>
                          {p.confidencial && (
                            <Badge tone="brick" dot={false}>
                              Confidencial
                            </Badge>
                          )}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-500">
                          {p.tipo}
                        </div>
                      </Link>
                    </td>
                    <td className="hidden whitespace-nowrap px-4 py-4 text-sm capitalize text-ink-700 md:table-cell">
                      {p.operacion}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <Badge tone={tonoParaEstado(p.estado)}>
                        {p.estado.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="num whitespace-nowrap px-4 py-4 text-right font-display text-base text-ink-900">
                      {formatearPrecio(p.precio_actual, p.moneda)}
                    </td>
                    <td className="hidden px-4 py-4 text-sm text-ink-700 lg:table-cell">
                      {p.dueno?.nombre ?? "—"}
                    </td>
                    <td className="num hidden whitespace-nowrap px-4 py-4 text-right font-mono text-sm text-ink-500 xl:table-cell">
                      {diasDesde(p.fecha_captacion)}
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
