export type MemberRole = "admin" | "abogado" | "paralegal";
export type MatterStatus = "abierto" | "cerrado" | "archivado";
export type TaskStatus = "pendiente" | "completada" | "cancelada";

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
  nif: string | null;
  email: string | null;
  phone: string | null;
  created_by: string;
  created_at: string;
};

export type Matter = {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  responsible_lawyer_id: string;
  procedural_deadline: string | null;
  status: MatterStatus;
  created_by: string;
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
