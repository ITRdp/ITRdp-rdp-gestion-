const ENTITY: Record<string, string> = {
  matter: "Asunto",
  task: "Tarea",
  actuacion: "Actuación",
  event: "Evento",
  document: "Documento",
  time_entry: "Tiempo",
  client: "Cliente",
};

const ACTION: Record<string, string> = {
  created: "creado",
  updated: "actualizado",
  deleted: "eliminado",
  soft_deleted: "archivado",
  status_changed: "cambio de estado",
  assigned: "asignado",
  completed: "completado",
  started: "iniciado",
  stopped: "cerrado",
  document_added: "documento agregado",
  document_removed: "documento archivado",
  time_logged: "tiempo registrado",
  actuacion_added: "actuación",
  note: "nota",
};

export function entityLabel(type: string | null | undefined): string {
  if (!type) return "Registro";
  return ENTITY[type] ?? type;
}

export function actionLabel(action: string | null | undefined): string {
  if (!action) return "cambio";
  return ACTION[action] ?? action;
}

export function activityKindLabel(
  entityType: string | null | undefined,
  action: string | null | undefined,
): string {
  return `${entityLabel(entityType)} · ${actionLabel(action)}`;
}

export function actorDisplayName(
  name: string | null | undefined,
  actorId: string | null | undefined,
): string {
  if (name) return name;
  if (!actorId) return "Cambio administrativo";
  return "Miembro";
}
