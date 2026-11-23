import type { ActivityLogEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { EmptyState } from "@/components/EmptyState";

const ACTION_LABEL: Record<string, string> = {
  created: "Creación",
  updated: "Actualización",
  deleted: "Eliminación",
  soft_deleted: "Archivado",
  status_changed: "Cambio de estado",
  assigned: "Asignación",
  completed: "Completado",
  document_added: "Documento",
  document_removed: "Documento archivado",
  time_logged: "Tiempo",
  started: "Inicio",
  stopped: "Cierre",
  actuacion_added: "Actuación",
  note: "Nota",
};

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
              {ACTION_LABEL[e.action] ?? e.action}
              <span className="ml-2 font-normal text-[var(--muted)]">
                · {e.entity_type}
              </span>
            </p>
            <time className="text-xs text-[var(--muted)]">
              {formatDateTime(e.created_at)}
            </time>
          </div>
          <p className="mt-0.5 text-sm text-[var(--ink)]">{e.summary}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {e.actor_id
              ? actorNames[e.actor_id] ?? "Miembro"
              : "Sistema"}
          </p>
        </li>
      ))}
    </ol>
  );
}
