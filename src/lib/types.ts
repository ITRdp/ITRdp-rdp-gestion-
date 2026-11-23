export type MemberRole = "admin" | "abogado" | "paralegal";
export type PersonType = "natural" | "juridica";
export type DocumentType = "NIT" | "CC" | "CE" | "PAS" | "PPT" | "OTRO";
export type MatterStatus = "abierto" | "en_pausa" | "cerrado" | "archivado";
export type MatterArea =
  | "responsabilidad_seguros"
  | "empresa"
  | "consumidor"
  | "insolvencia"
  | "comercial"
  | "tributario"
  | "societario"
  | "otro";
/** Clave de etapa (validada por FK a matter_stage_defs). */
export type MatterStage = string;

export type MatterProcedureType =
  | "judicial"
  | "arbitral"
  | "administrativo"
  | "insolvencia"
  | "extrajudicial"
  | "contractual"
  | "consultoria";

export type MatterStageDef = {
  id: string;
  matter_type: MatterProcedureType;
  stage_key: string;
  label: string;
  sort_order: number;
  enabled: boolean;
};
export type MatterPriority = "baja" | "media" | "alta" | "urgente";
export type TaskStatus = "pendiente" | "en_curso" | "completada" | "cancelada";
export type TaskPriority = "baja" | "media" | "alta" | "urgente";
export type TeamRoleInMatter =
  | "responsable"
  | "colaborador"
  | "paralegal"
  | "observador";
export type EventType =
  | "audiencia"
  | "reunion"
  | "plazo"
  | "interno"
  | "otro";

export type Member = {
  id: string;
  email: string;
  full_name: string;
  role: MemberRole;
  enabled: boolean;
  email_daily_digest?: boolean;
  notify_in_app?: boolean;
  must_change_password?: boolean;
  created_at: string;
};

export type NotificationKind =
  | "info"
  | "task_assigned"
  | "task_comment"
  | "matter_assigned"
  | "system";

export type AppNotification = {
  id: string;
  member_id: string;
  title: string;
  body: string | null;
  href: string | null;
  kind: NotificationKind;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type Client = {
  id: string;
  name: string;
  person_type: PersonType;
  document_type: DocumentType;
  document_number: string | null;
  document_dv: string | null;
  legal_name: string | null;
  city: string | null;
  department: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ClientContact = {
  id: string;
  client_id: string;
  full_name: string;
  role_title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_primary: boolean;
  created_at: string;
};

export type Matter = {
  id: string;
  code: string;
  client_id: string;
  title: string;
  description: string | null;
  area: MatterArea;
  matter_type: string;
  stage: MatterStage;
  status: MatterStatus;
  priority: MatterPriority;
  responsible_lawyer_id: string;
  counterparts: string | null;
  radicado: string | null;
  court_name: string | null;
  city: string | null;
  amount_cop: number | null;
  fees_cop: number | null;
  opened_at: string | null;
  closed_at: string | null;
  procedural_deadline: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MatterTeamMember = {
  id: string;
  matter_id: string;
  member_id: string;
  role_in_matter: TeamRoleInMatter;
  created_at: string;
};

export type Actuacion = {
  id: string;
  matter_id: string;
  author_id: string;
  description: string;
  onedrive_url: string | null;
  created_at: string;
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type Task = {
  id: string;
  matter_id: string;
  actuacion_id: string | null;
  assignee_id: string;
  description: string;
  follow_up_date: string;
  due_business_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  checklist: ChecklistItem[];
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at?: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentioned_member_ids: string[];
  created_at: string;
};

export type TaskTemplate = {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  checklist: ChecklistItem[];
  default_follow_up_offset_days: number;
  area: string | null;
  created_by: string;
  created_at: string;
};

export type CalendarEvent = {
  id: string;
  matter_id: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  location: string | null;
  event_type: EventType;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type NonBusinessDay = {
  id: string;
  day: string;
  name: string;
  kind: "festivo_nacional" | "festivo_religioso" | "puente" | "otro";
  notes: string | null;
  created_at: string;
};

export type ActivityLogEntry = {
  id: string;
  matter_id: string | null;
  client_id: string | null;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  summary: string;
  meta: Record<string, unknown>;
  created_at: string;
};

export type DocumentSource = "storage" | "onedrive" | "enlace";

export type MatterDocument = {
  id: string;
  matter_id: string;
  title: string;
  description: string | null;
  source: DocumentSource;
  storage_path: string | null;
  onedrive_url: string | null;
  file_name: string | null;
  mime_type: string | null;
  file_size: number | null;
  uploaded_by: string;
  created_at: string;
  deleted_at: string | null;
};

export type TimeEntry = {
  id: string;
  matter_id: string;
  member_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  created_at: string;
  updated_at: string;
};
