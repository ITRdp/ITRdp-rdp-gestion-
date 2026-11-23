/** Catálogos Fase 2 — editables vía código; documentados en docs/fase2-catalogos.md */

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

export const MATTER_AREAS = [
  { value: "civil", label: "Civil" },
  { value: "laboral", label: "Laboral" },
  { value: "comercial", label: "Comercial" },
  { value: "penal", label: "Penal" },
  { value: "familia", label: "Familia" },
  { value: "administrativo", label: "Administrativo" },
  { value: "tributario", label: "Tributario" },
  { value: "otros", label: "Otros" },
] as const;

/** Tipos de asunto por área (catálogo razonable; ampliar según práctica del despacho). */
export const MATTER_TYPES_BY_AREA: Record<string, { value: string; label: string }[]> = {
  civil: [
    { value: "contractual", label: "Contractual" },
    { value: "responsabilidad", label: "Responsabilidad civil" },
    { value: "propiedad", label: "Propiedad / posesión" },
    { value: "general", label: "General" },
  ],
  laboral: [
    { value: "despido", label: "Despido / liquidación" },
    { value: "tutela_laboral", label: "Tutela laboral" },
    { value: "seguridad_social", label: "Seguridad social" },
    { value: "general", label: "General" },
  ],
  comercial: [
    { value: "societario", label: "Societario" },
    { value: "mercantil", label: "Mercantil / contratos" },
    { value: "insolvenicia", label: "Insolvencia" },
    { value: "general", label: "General" },
  ],
  penal: [
    { value: "defensa", label: "Defensa" },
    { value: "victima", label: "Representación víctima" },
    { value: "general", label: "General" },
  ],
  familia: [
    { value: "alimentos", label: "Alimentos" },
    { value: "divorcio", label: "Divorcio / cesación" },
    { value: "custodia", label: "Custodia / visitas" },
    { value: "general", label: "General" },
  ],
  administrativo: [
    { value: "nulidad", label: "Nulidad / restablecimiento" },
    { value: "contratacion", label: "Contratación estatal" },
    { value: "general", label: "General" },
  ],
  tributario: [
    { value: "fiscalizacion", label: "Fiscalización" },
    { value: "devolucion", label: "Devolución / compensación" },
    { value: "general", label: "General" },
  ],
  otros: [{ value: "general", label: "General" }],
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

export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined,
): string {
  if (!value) return "—";
  return list.find((x) => x.value === value)?.label ?? value;
}
