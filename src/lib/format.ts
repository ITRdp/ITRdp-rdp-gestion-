/** Formato de fechas/horas en zona Colombia (Bogotá). */

export const APP_TIME_ZONE = "America/Bogota";
export const APP_LOCALE = "es-CO";

const dateFmt = new Intl.DateTimeFormat(APP_LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: APP_TIME_ZONE,
});

const dateTimeFmt = new Intl.DateTimeFormat(APP_LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

const isoDateParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return dateTimeFmt.format(d);
}

/** Fecha civil de “hoy” en America/Bogota (YYYY-MM-DD). */
export function todayISO(): string {
  return isoDateParts.format(new Date());
}

/** Inicio de semana (lunes) en Bogotá como YYYY-MM-DD. */
export function startOfWeekISO(ref?: Date): string {
  const iso = ref
    ? isoDateParts.format(ref)
    : todayISO();
  const [y, m, d] = iso.split("-").map(Number);
  // mediodía UTC aproximado para evitar DST edge; usamos partes locales Bogotá
  const asUtcNoon = new Date(Date.UTC(y!, m! - 1, d!, 17, 0, 0)); // ~12 Bogotá
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIME_ZONE,
    weekday: "short",
  }).format(asUtcNoon);
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const offset = map[weekday] ?? 0;
  const monday = new Date(asUtcNoon);
  monday.setUTCDate(monday.getUTCDate() - offset);
  return isoDateParts.format(monday);
}
