import { businessDaysUntil } from "@/lib/business-days";

export type SemaforoLevel = "verde" | "amarillo" | "rojo" | "neutro";

export type SemaforoResult = {
  level: SemaforoLevel;
  label: string;
  days: number | null;
  className: string;
};

/**
 * Semáforo por días hábiles hasta la fecha:
 * - verde: > 5
 * - amarillo: 2–5
 * - rojo: ≤ 1 o vencido
 */
export function semaforoForDeadline(
  deadlineISO: string | null | undefined,
  todayISO: string,
  holidays: Set<string>,
): SemaforoResult {
  if (!deadlineISO) {
    return {
      level: "neutro",
      label: "Sin fecha",
      days: null,
      className: "badge",
    };
  }
  const days = businessDaysUntil(deadlineISO, todayISO, holidays);
  if (days < 0) {
    return {
      level: "rojo",
      label: `Vencido (${Math.abs(days)} háb.)`,
      days,
      className: "badge badge-semaforo-rojo",
    };
  }
  if (days <= 1) {
    return {
      level: "rojo",
      label: days === 0 ? "Vence hoy" : "1 hábil",
      days,
      className: "badge badge-semaforo-rojo",
    };
  }
  if (days <= 5) {
    return {
      level: "amarillo",
      label: `${days} hábiles`,
      days,
      className: "badge badge-semaforo-amarillo",
    };
  }
  return {
    level: "verde",
    label: `${days} hábiles`,
    days,
    className: "badge badge-semaforo-verde",
  };
}
