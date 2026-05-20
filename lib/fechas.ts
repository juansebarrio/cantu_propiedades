// Utilities para manejar fechas en español rioplatense.
// Sin dependencias — Date nativo + arrays de nombres.

const DIAS_LARGO = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function inicioDeSemana(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  const dia = d.getDay();
  const offset = dia === 0 ? -6 : 1 - dia;
  d.setDate(d.getDate() + offset);
  return d;
}

export function finDeSemana(fecha: Date): Date {
  const inicio = inicioDeSemana(fecha);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 6);
  fin.setHours(23, 59, 59, 999);
  return fin;
}

export function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha);
  d.setDate(d.getDate() + dias);
  return d;
}

export function semanaSiguiente(fecha: Date): Date {
  return sumarDias(inicioDeSemana(fecha), 7);
}

export function semanaAnterior(fecha: Date): Date {
  return sumarDias(inicioDeSemana(fecha), -7);
}

export function esHoy(fecha: Date): boolean {
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

/** "Lunes 18" */
export function formatearDiaCorto(fecha: Date): string {
  const dia = DIAS_LARGO[fecha.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.getDate()}`;
}

/** "Lunes 18 de mayo" */
export function formatearDiaLargo(fecha: Date): string {
  const dia = DIAS_LARGO[fecha.getDay()];
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

/** "18 al 24 de mayo" */
export function formatearRangoSemana(inicio: Date, fin: Date): string {
  const dIni = inicio.getDate();
  const dFin = fin.getDate();
  const mIni = MESES[inicio.getMonth()];
  const mFin = MESES[fin.getMonth()];
  if (mIni === mFin) {
    return `${dIni} al ${dFin} de ${mFin}`;
  }
  return `${dIni} de ${mIni} al ${dFin} de ${mFin}`;
}

export function parsearFechaISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatearFechaISO(fecha: Date): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function diasDeSemana(fecha: Date): Date[] {
  const inicio = inicioDeSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => sumarDias(inicio, i));
}

/* ──────────────────────────────────────────────────────────────
 * Helpers para `fecha_agendada` (timestamptz · una sola columna)
 * Convierten entre el storage timestamptz de la DB y la visualización
 * splitteada en fecha + hora que la UI necesita.
 * ────────────────────────────────────────────────────────────── */

/** "2026-05-20T13:00:00.000Z" → "2026-05-20" en hora local. */
export function fechaLocalDeTimestamp(timestamp: string): string {
  return formatearFechaISO(new Date(timestamp));
}

/** "2026-05-20T13:00:00.000Z" → "10:00" en hora local. */
export function horaLocalDeTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "2026-05-20" + "10:00" → ISO timestamp UTC interpretando el input como local. */
export function combinarFechaYHora(fecha: string, hora: string): string {
  return new Date(`${fecha}T${hora}:00`).toISOString();
}
