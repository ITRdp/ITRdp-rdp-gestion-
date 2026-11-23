import type { ActivityLogEntry } from "@/lib/types";
import {
  actionLabel,
  activityKindLabel,
  actorDisplayName,
  entityLabel,
} from "@/lib/activity-labels";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

export function ActivityTimeline({
  entries,
  actorNames,
}: {
  entries: ActivityLogEntry[];
  actorNames: Record<string, string>;
}) {
  if (!entries.length) {
    return (
      <EmptyState
        title="Sin actividad registrada"
        description="Los cambios en el asunto, tareas, eventos, documentos y tiempo aparecerán aquí."
      />
    );
  }

  return (
    <ol className="relative grid gap-0 border-l border-[var(--line)] pl-5">
      {entries.map((e) => (
        <li key={e.id} className="relative pb-5">
          <span
            className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--wine-700)] ring-2 ring-[var(--surface)]"
            aria-hidden
          />
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium text-[var(--ink)]">
              {activityKindLabel(e.entity_type, e.action)}
            </p>
            <time className="tabular-nums text-xs text-[var(--muted)]">
              {formatDateTime(e.created_at)}
            </time>
          </div>
          <p className="mt-0.5 text-sm text-[var(--ink)]">{e.summary}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {actorDisplayName(
              e.actor_id ? actorNames[e.actor_id] : null,
              e.actor_id,
            )}
            <span className="sr-only">
              {entityLabel(e.entity_type)} {actionLabel(e.action)}
            </span>
          </p>
        </li>
      ))}
    </ol>
  );
}
