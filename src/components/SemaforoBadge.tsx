import { semaforoForDeadline } from "@/lib/semaforo";

export function SemaforoBadge({
  deadline,
  today,
  holidays,
  prefix,
}: {
  deadline: string | null | undefined;
  today: string;
  holidays: Set<string>;
  prefix?: string;
}) {
  const s = semaforoForDeadline(deadline, today, holidays);
  return (
    <span className={s.className} title={deadline ?? undefined}>
      {prefix ? `${prefix} ` : ""}
      {s.label}
    </span>
  );
}
