/**
 * Días hábiles Colombia: excluye sábados, domingos y filas de non_business_days.
 * Zona: fechas como YYYY-MM-DD (calendario civil, sin TZ).
 */

export type NonBusinessDay = { day: string; name?: string };

function parseISODate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y!, m! - 1, d!, 12, 0, 0, 0);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWeekend(iso: string): boolean {
  const dow = parseISODate(iso).getDay();
  return dow === 0 || dow === 6;
}

export function isBusinessDay(
  iso: string,
  holidays: Iterable<string> | Set<string>,
): boolean {
  if (isWeekend(iso)) return false;
  const set = holidays instanceof Set ? holidays : new Set(holidays);
  return !set.has(iso.slice(0, 10));
}

export function holidaySet(
  rows: NonBusinessDay[] | string[],
): Set<string> {
  const set = new Set<string>();
  for (const r of rows) {
    set.add(typeof r === "string" ? r.slice(0, 10) : r.day.slice(0, 10));
  }
  return set;
}

/** Suma N días hábiles a partir de `from` (no cuenta el día de origen si offset>0). */
export function addBusinessDays(
  fromISO: string,
  offset: number,
  holidays: Set<string>,
): string {
  const d = parseISODate(fromISO);
  let remaining = Math.abs(offset);
  const dir = offset >= 0 ? 1 : -1;
  while (remaining > 0) {
    d.setDate(d.getDate() + dir);
    const iso = toISODate(d);
    if (isBusinessDay(iso, holidays)) remaining -= 1;
  }
  return toISODate(d);
}

/** Días hábiles entre dos fechas (excluye start, incluye end si hábil). Negativo si end < start. */
export function businessDaysBetween(
  startISO: string,
  endISO: string,
  holidays: Set<string>,
): number {
  const start = startISO.slice(0, 10);
  const end = endISO.slice(0, 10);
  if (start === end) return 0;
  const forward = end > start;
  const d = parseISODate(start);
  const target = parseISODate(end);
  let count = 0;
  const dir = forward ? 1 : -1;
  while (toISODate(d) !== end) {
    d.setDate(d.getDate() + dir);
    const iso = toISODate(d);
    if (isBusinessDay(iso, holidays)) count += dir;
    // safety
    if (Math.abs(count) > 5000) break;
    if (forward && d > target && iso !== end) break;
  }
  return count;
}

/** Días hábiles restantes hasta deadline desde hoy (negativo = vencido). */
export function businessDaysUntil(
  deadlineISO: string,
  todayISO: string,
  holidays: Set<string>,
): number {
  return businessDaysBetween(todayISO, deadlineISO.slice(0, 10), holidays);
}
