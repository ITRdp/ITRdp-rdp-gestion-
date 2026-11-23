export type MemberRole = "admin" | "abogado" | "paralegal";
export type PersonType = "natural" | "juridica";
export type DocumentType = "NIT" | "CC" | "CE" | "PAS" | "PPT" | "OTRO";
export type MatterStatus = "abierto" | "en_pausa" | "cerrado" | "archivado";
export type MatterArea =
  | "civil"
  | "laboral"
  | "comercial"
  | "penal"
  | "familia"
  | "administrativo"
  | "tributario"
  | "otros";
export type MatterStage =
  | "ingreso"
  | "analisis"
  | "actuacion"
  | "audiencia"
  | "alegatos"
  | "fallo"
  | "ejecucion"
  | "cierre";
export type MatterPriority = "baja" | "media" | "alta" | "urgente";
export type TaskStatus = "pendiente" | "completada" | "cancelada";
export type TeamRoleInMatter =
  | "responsable"
  | "colaborador"
  | "paralegal"
  | "observador";

export type Member = {
  id: string;
  email: string;
  full_name: string;
  role: MemberRole;
  enabled: boolean;
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

export type Task = {
  id: string;
  matter_id: string;
  actuacion_id: string | null;
  assignee_id: string;
  description: string;
  follow_up_date: string;
  status: TaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string;
  created_at: string;
};
