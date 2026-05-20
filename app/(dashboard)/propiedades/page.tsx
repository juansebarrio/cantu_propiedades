import Link from "next/link";
import { getUsuarioActual } from "@/lib/auth/current-user";
import { listarPropiedades } from "@/lib/supabase/queries/propiedades";
import { Card } from "@/components/ui/Card";
import { Badge, tonoParaEstado } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
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

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Propiedades
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {propiedades.length}{" "}
            {propiedades.length === 1 ? "propiedad" : "propiedades"} en cartera
          </p>
        </div>
        <Button disabled title="Próximamente">
          <Plus size={16} />
          Nueva propiedad
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
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
                placeholder="Dirección..."
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
              {estados.map((e) => (
                <option key={e} value={e}>
                  {e.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Tipo
            </label>
            <Select name="tipo" defaultValue={searchParams.tipo ?? ""}>
              <option value="">Todos</option>
              {tiposPropiedad.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wide text-ink/50">
              Operación
            </label>
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
          </div>

          <div className="flex gap-2">
            <Button type="submit" variant="primary">
              Filtrar
            </Button>
            <Link href="/propiedades">
              <Button type="button" variant="ghost">
                Limpiar
              </Button>
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {propiedades.length === 0 ? (
          <div className="px-6 py-12 text-center text-ink/50">
            No hay propiedades que coincidan con los filtros.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-line/20 text-xs uppercase tracking-wide text-ink/50">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Dirección</th>
                <th className="px-6 py-3 text-left font-medium">Tipo</th>
                <th className="px-6 py-3 text-left font-medium">Operación</th>
                <th className="px-6 py-3 text-left font-medium">Estado</th>
                <th className="px-6 py-3 text-right font-medium">Precio</th>
                <th className="px-6 py-3 text-left font-medium">Dueño</th>
                <th className="px-6 py-3 text-right font-medium">Días</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {propiedades.map((p: any) => (
                <tr key={p.id} className="hover:bg-line/10">
                  <td className="px-6 py-4">
                    <Link
                      href={`/propiedades/${p.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {p.direccion}
                    </Link>
                  </td>
                  <td className="px-6 py-4 capitalize text-ink/70">{p.tipo}</td>
                  <td className="px-6 py-4 capitalize text-ink/70">
                    {p.operacion}
                  </td>
                  <td className="px-6 py-4">
                    <Badge tone={tonoParaEstado(p.estado)}>
                      {p.estado.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-ink">
                    {formatearPrecio(p.precio_actual, p.moneda)}
                  </td>
                  <td className="px-6 py-4 text-ink/70">
                    {p.dueno?.nombre ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-right text-ink/60">
                    {diasDesde(p.fecha_captacion)}
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
