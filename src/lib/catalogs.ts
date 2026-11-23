/** Catálogos de dominio — documentados en docs/fase2-catalogos.md y fase5 */

export const MEMBER_ROLES = [
  { value: "admin", label: "Administrador" },
  { value: "abogado", label: "Abogado" },
  { value: "paralegal", label: "Paralegal" },
] as const;

export const PERSON_TYPES = [
  { value: "natural", label: "Persona natural" },
  { value: "juridica", label: "Persona jurídica" },
] as const;

export const DOCUMENT_TYPES = [
  { value: "NIT", label: "NIT" },
  { value: "CC", label: "Cédula de ciudadanía" },
  { value: "CE", label: "Cédula de extranjería" },
  { value: "PAS", label: "Pasaporte" },
  { value: "PPT", label: "PPT" },
  { value: "OTRO", label: "Otro" },
] as const;

/** Áreas alineadas a la firma (prioridad) + comercial/tributario/societario/otro. */
export const MATTER_AREAS = [
  { value: "responsabilidad_seguros", label: "Responsabilidad & seguros" },
  { value: "empresa", label: "Empresa" },
  { value: "consumidor", label: "Consumidor" },
  { value: "insolvencia", label: "Insolvencia" },
  { value: "comercial", label: "Comercial" },
  { value: "tributario", label: "Tributario" },
  { value: "societario", label: "Societario" },
  { value: "otro", label: "Otro" },
] as const;

/** Tipos de asunto por área (ampliar según práctica del despacho). */
export const MATTER_TYPES_BY_AREA: Record<
  string,
  { value: string; label: string }[]
> = {
  responsabilidad_seguros: [
    { value: "rc_extracontractual", label: "RC extracontractual" },
    { value: "seguros", label: "Seguros / reclamación" },
    { value: "productos", label: "Productos defectuosos" },
    { value: "general", label: "General" },
  ],
  empresa: [
    { value: "contratos", label: "Contratos empresariales" },
    { value: "laboral_empresa", label: "Laboral empresarial" },
    { value: "cumplimiento", label: "Cumplimiento / compliance" },
    { value: "general", label: "General" },
  ],
  consumidor: [
    { value: "proteccion", label: "Protección al consumidor" },
    { value: "garantias", label: "Garantías" },
    { value: "publicidad", label: "Publicidad engañosa" },
    { value: "general", label: "General" },
  ],
  insolvencia: [
    { value: "reorganizacion", label: "Reorganización" },
    { value: "liquidacion", label: "Liquidación" },
    { value: "acreedores", label: "Acreedores" },
    { value: "general", label: "General" },
  ],
  comercial: [
    { value: "mercantil", label: "Mercantil / contratos" },
    { value: "competencia", label: "Competencia" },
    { value: "general", label: "General" },
  ],
  tributario: [
    { value: "fiscalizacion", label: "Fiscalización" },
    { value: "devolucion", label: "Devolución / compensación" },
    { value: "general", label: "General" },
  ],
  societario: [
    { value: "constitucion", label: "Constitución / reformas" },
    { value: "gobierno", label: "Gobierno corporativo" },
    { value: "conflictos", label: "Conflictos societarios" },
    { value: "general", label: "General" },
  ],
  otro: [{ value: "general", label: "General" }],
};

export const MATTER_STAGES = [
  { value: "ingreso", label: "Ingreso" },
  { value: "analisis", label: "Análisis" },
  { value: "actuacion", label: "Actuación" },
  { value: "audiencia", label: "Audiencia" },
  { value: "alegatos", label: "Alegatos" },
  { value: "fallo", label: "Fallo" },
  { value: "ejecucion", label: "Ejecución" },
  { value: "cierre", label: "Cierre" },
] as const;

export const MATTER_STATUSES = [
  { value: "abierto", label: "Abierto" },
  { value: "en_pausa", label: "En pausa" },
  { value: "cerrado", label: "Cerrado" },
  { value: "archivado", label: "Archivado" },
] as const;

export const MATTER_PRIORITIES = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export const TEAM_ROLES = [
  { value: "responsable", label: "Responsable" },
  { value: "colaborador", label: "Colaborador" },
  { value: "paralegal", label: "Paralegal" },
  { value: "observador", label: "Observador" },
] as const;

export const TASK_STATUSES = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_curso", label: "En curso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export const TASK_PRIORITIES = MATTER_PRIORITIES;

export const EVENT_TYPES = [
  { value: "audiencia", label: "Audiencia" },
  { value: "reunion", label: "Reunión" },
  { value: "plazo", label: "Plazo" },
  { value: "interno", label: "Interno" },
  { value: "otro", label: "Otro" },
] as const;

export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}
