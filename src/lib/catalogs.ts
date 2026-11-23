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
  { value: "insolvencia", label: "Insolvencia Ley 1116" },
  { value: "extrajudicial", label: "Extrajudicial / negociación" },
  { value: "contractual", label: "Contractual" },
  { value: "consultoria", label: "Consultoría" },
] as const;

/** Etapas por tipo — espejo de 20261123150000_etapas_acordadas.sql */
export const MATTER_STAGES_BY_TYPE: Record<
  string,
  { value: string; label: string }[]
> = {
  judicial: [
    { value: "estudio", label: "Estudio" },
    { value: "demanda_radicada", label: "Demanda radicada" },
    { value: "admision", label: "Admisión" },
    { value: "notificacion", label: "Notificación" },
    { value: "contestacion_excepciones", label: "Contestación / excepciones" },
    { value: "audiencia_inicial", label: "Audiencia inicial" },
    { value: "instruccion_juzgamiento", label: "Instrucción y juzgamiento" },
    { value: "sentencia", label: "Sentencia" },
    { value: "recursos_2a_instancia", label: "Recursos / 2ª instancia" },
    { value: "ejecucion", label: "Ejecución" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  arbitral: [
    { value: "estudio", label: "Estudio" },
    { value: "convocatoria", label: "Convocatoria" },
    { value: "integracion_tribunal", label: "Integración del tribunal" },
    { value: "instalacion", label: "Instalación" },
    { value: "primera_audiencia_tramite", label: "Primera audiencia de trámite" },
    { value: "pruebas", label: "Pruebas" },
    { value: "alegatos", label: "Alegatos" },
    { value: "laudo", label: "Laudo" },
    { value: "anulacion", label: "Anulación" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  administrativo: [
    { value: "estudio", label: "Estudio" },
    { value: "radicacion", label: "Radicación" },
    { value: "tramite", label: "Trámite" },
    { value: "decision", label: "Decisión" },
    { value: "recursos", label: "Recursos" },
    { value: "control_judicial", label: "Control judicial" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  insolvencia: [
    { value: "estudio", label: "Estudio" },
    { value: "solicitud", label: "Solicitud" },
    { value: "admision", label: "Admisión" },
    {
      value: "calificacion_graduacion_creditos",
      label: "Calificación y graduación de créditos",
    },
    { value: "objeciones", label: "Objeciones" },
    { value: "acuerdo_confirmacion", label: "Acuerdo / confirmación" },
    { value: "ejecucion_acuerdo", label: "Ejecución del acuerdo" },
    { value: "liquidacion", label: "Liquidación" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  extrajudicial: [
    { value: "estudio", label: "Estudio" },
    { value: "requerimiento", label: "Requerimiento" },
    { value: "negociacion", label: "Negociación" },
    { value: "acuerdo", label: "Acuerdo" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  contractual: [
    { value: "solicitud", label: "Solicitud" },
    { value: "redaccion_revision", label: "Redacción / revisión" },
    { value: "negociacion", label: "Negociación" },
    { value: "firma", label: "Firma" },
    { value: "gestiones_adicionales", label: "Gestiones adicionales" },
    { value: "cierre", label: "Cierre" },
  ],
  consultoria: [
    { value: "solicitud", label: "Solicitud" },
    { value: "analisis", label: "Análisis" },
    { value: "entrega_concepto", label: "Entrega del concepto" },
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
