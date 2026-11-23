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

/** Tipo de trámite / procedimiento (define etapas). Liquidación es etapa de insolvencia. */
export const MATTER_PROCEDURE_TYPES = [
  { value: "judicial", label: "Judicial" },
  { value: "arbitral", label: "Arbitral" },
  { value: "administrativo", label: "Administrativo" },
  { value: "insolvencia", label: "Insolvencia" },
  { value: "extrajudicial", label: "Extrajudicial / negociación" },
  { value: "contractual", label: "Contractual" },
  { value: "consultoria", label: "Consultoría" },
] as const;

/** Etapas por tipo — espejo del seed SQL matter_stage_defs. */
export const MATTER_STAGES_BY_TYPE: Record<
  string,
  { value: string; label: string }[]
> = {
  judicial: [
    { value: "ingreso", label: "Ingreso" },
    { value: "demanda", label: "Demanda / radicación" },
    { value: "contestacion", label: "Contestación" },
    { value: "pruebas", label: "Pruebas" },
    { value: "audiencia", label: "Audiencia" },
    { value: "alegatos", label: "Alegatos" },
    { value: "fallo", label: "Fallo" },
    { value: "ejecucion", label: "Ejecución" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  arbitral: [
    { value: "ingreso", label: "Ingreso" },
    { value: "demanda", label: "Demanda arbitral" },
    { value: "contestacion", label: "Contestación" },
    { value: "pruebas", label: "Pruebas" },
    { value: "audiencia", label: "Audiencia" },
    { value: "alegatos", label: "Alegatos" },
    { value: "laudo", label: "Laudo" },
    { value: "ejecucion", label: "Ejecución" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  administrativo: [
    { value: "ingreso", label: "Ingreso" },
    { value: "peticion", label: "Petición / recurso" },
    { value: "pruebas", label: "Pruebas" },
    { value: "audiencia", label: "Audiencia" },
    { value: "decision", label: "Decisión" },
    { value: "ejecucion", label: "Ejecución" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  insolvencia: [
    { value: "ingreso", label: "Ingreso" },
    { value: "analisis", label: "Análisis" },
    { value: "reorganizacion", label: "Reorganización" },
    { value: "liquidacion", label: "Liquidación" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  extrajudicial: [
    { value: "ingreso", label: "Ingreso" },
    { value: "negociacion", label: "Negociación" },
    { value: "acuerdo", label: "Acuerdo" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  contractual: [
    { value: "ingreso", label: "Ingreso" },
    { value: "redaccion", label: "Redacción" },
    { value: "revision", label: "Revisión" },
    { value: "firma", label: "Firma" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  consultoria: [
    { value: "ingreso", label: "Ingreso" },
    { value: "analisis", label: "Análisis" },
    { value: "entrega", label: "Entrega" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
};

/** Unión de claves de etapa (labels; preferir stagesForType). */
export const MATTER_STAGES = Object.values(MATTER_STAGES_BY_TYPE)
  .flat()
  .filter(
    (s, i, arr) => arr.findIndex((x) => x.value === s.value) === i,
  ) as { value: string; label: string }[];

export function stagesForType(matterType: string | null | undefined) {
  if (!matterType) return MATTER_STAGES_BY_TYPE.consultoria;
  return (
    MATTER_STAGES_BY_TYPE[matterType] ?? MATTER_STAGES_BY_TYPE.consultoria
  );
}

/** @deprecated Usar MATTER_PROCEDURE_TYPES. */
export const MATTER_TYPES_BY_AREA: Record<
  string,
  { value: string; label: string }[]
> = Object.fromEntries(
  MATTER_AREAS.map((a) => [a.value, [...MATTER_PROCEDURE_TYPES]]),
);

export const FEE_MODALITIES = [
  { value: "fijo", label: "Honorarios fijos" },
  { value: "por_etapa", label: "Por etapa" },
  { value: "cuota_litis", label: "Cuota litis" },
  { value: "por_horas", label: "Por horas" },
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
