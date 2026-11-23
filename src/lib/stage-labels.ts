import { MATTER_STAGES, MATTER_STATUSES, stagesForType } from "@/lib/catalogs";

const STAGE_LABELS = new Map<string, string>(
  MATTER_STAGES.map((s) => [s.value, s.label]),
);
const STATUS_LABELS = new Map<string, string>(
  MATTER_STATUSES.map((s) => [s.value, s.label]),
);

export function stageKeyLabel(
  key: string | null | undefined,
  matterType?: string | null,
): string {
  if (!key) return "—";
  if (matterType) {
    const hit = stagesForType(matterType).find((s) => s.value === key);
    if (hit) return hit.label;
  }
  return STAGE_LABELS.get(key) ?? key;
}

export function statusKeyLabel(key: string | null | undefined): string {
  if (!key) return "—";
  return STATUS_LABELS.get(key) ?? key;
}

/**
 * Humaniza resúmenes de activity_log que aún traen claves
 * (`etapa ingreso → solicitud` → `etapa Ingreso → Solicitud`).
 */
export function humanizeActivitySummary(
  summary: string | null | undefined,
  matterType?: string | null,
): string {
  if (!summary) return "";
  let out = summary;

  out = out.replace(
    /\(etapa\s+([a-z0-9_]+)\s*→\s*([a-z0-9_]+)\)/gi,
    (_m, from: string, to: string) =>
      `(etapa ${stageKeyLabel(from, matterType)} → ${stageKeyLabel(to, matterType)})`,
  );

  out = out.replace(
    /\(estado\s+([a-z0-9_]+)\s*→\s*([a-z0-9_]+)\)/gi,
    (_m, from: string, to: string) =>
      `(estado ${statusKeyLabel(from)} → ${statusKeyLabel(to)})`,
  );

  return out;
}
