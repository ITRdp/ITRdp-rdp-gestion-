-- Etapas acordadas (mapa exacto del usuario)
-- Aplicar DESPUÉS de 20261123140000_prelanzamiento_stages.sql
-- NO edita 140000: upsert seed, disable extras (no DELETE), remap asuntos.

-- ---------------------------------------------------------------------------
-- 1) Upsert seed exacto (enabled = true)
-- ---------------------------------------------------------------------------

insert into public.matter_stage_defs (matter_type, stage_key, label, sort_order, enabled) values
  -- Judicial
  ('judicial', 'estudio', 'Estudio', 10, true),
  ('judicial', 'demanda_radicada', 'Demanda radicada', 20, true),
  ('judicial', 'admision', 'Admisión', 30, true),
  ('judicial', 'notificacion', 'Notificación', 40, true),
  ('judicial', 'contestacion_excepciones', 'Contestación / excepciones', 50, true),
  ('judicial', 'audiencia_inicial', 'Audiencia inicial', 60, true),
  ('judicial', 'instruccion_juzgamiento', 'Instrucción y juzgamiento', 70, true),
  ('judicial', 'sentencia', 'Sentencia', 80, true),
  ('judicial', 'recursos_2a_instancia', 'Recursos / 2ª instancia', 90, true),
  ('judicial', 'ejecucion', 'Ejecución', 100, true),
  ('judicial', 'gestiones_adicionales', 'Gestiones adicionales', 110, true),
  ('judicial', 'cierre', 'Cierre', 120, true),
  -- Arbitral
  ('arbitral', 'estudio', 'Estudio', 10, true),
  ('arbitral', 'convocatoria', 'Convocatoria', 20, true),
  ('arbitral', 'integracion_tribunal', 'Integración del tribunal', 30, true),
  ('arbitral', 'instalacion', 'Instalación', 40, true),
  ('arbitral', 'primera_audiencia_tramite', 'Primera audiencia de trámite', 50, true),
  ('arbitral', 'pruebas', 'Pruebas', 60, true),
  ('arbitral', 'alegatos', 'Alegatos', 70, true),
  ('arbitral', 'laudo', 'Laudo', 80, true),
  ('arbitral', 'anulacion', 'Anulación', 90, true),
  ('arbitral', 'gestiones_adicionales', 'Gestiones adicionales', 100, true),
  ('arbitral', 'cierre', 'Cierre', 110, true),
  -- Administrativo
  ('administrativo', 'estudio', 'Estudio', 10, true),
  ('administrativo', 'radicacion', 'Radicación', 20, true),
  ('administrativo', 'tramite', 'Trámite', 30, true),
  ('administrativo', 'decision', 'Decisión', 40, true),
  ('administrativo', 'recursos', 'Recursos', 50, true),
  ('administrativo', 'control_judicial', 'Control judicial', 60, true),
  ('administrativo', 'gestiones_adicionales', 'Gestiones adicionales', 70, true),
  ('administrativo', 'cierre', 'Cierre', 80, true),
  -- Insolvencia Ley 1116
  ('insolvencia', 'estudio', 'Estudio', 10, true),
  ('insolvencia', 'solicitud', 'Solicitud', 20, true),
  ('insolvencia', 'admision', 'Admisión', 30, true),
  ('insolvencia', 'calificacion_graduacion_creditos', 'Calificación y graduación de créditos', 40, true),
  ('insolvencia', 'objeciones', 'Objeciones', 50, true),
  ('insolvencia', 'acuerdo_confirmacion', 'Acuerdo / confirmación', 60, true),
  ('insolvencia', 'ejecucion_acuerdo', 'Ejecución del acuerdo', 70, true),
  ('insolvencia', 'liquidacion', 'Liquidación', 80, true),
  ('insolvencia', 'gestiones_adicionales', 'Gestiones adicionales', 90, true),
  ('insolvencia', 'cierre', 'Cierre', 100, true),
  -- Extrajudicial
  ('extrajudicial', 'estudio', 'Estudio', 10, true),
  ('extrajudicial', 'requerimiento', 'Requerimiento', 20, true),
  ('extrajudicial', 'negociacion', 'Negociación', 30, true),
  ('extrajudicial', 'acuerdo', 'Acuerdo', 40, true),
  ('extrajudicial', 'gestiones_adicionales', 'Gestiones adicionales', 50, true),
  ('extrajudicial', 'cierre', 'Cierre', 60, true),
  -- Contractual
  ('contractual', 'solicitud', 'Solicitud', 10, true),
  ('contractual', 'redaccion_revision', 'Redacción / revisión', 20, true),
  ('contractual', 'negociacion', 'Negociación', 30, true),
  ('contractual', 'firma', 'Firma', 40, true),
  ('contractual', 'gestiones_adicionales', 'Gestiones adicionales', 50, true),
  ('contractual', 'cierre', 'Cierre', 60, true),
  -- Consultoría
  ('consultoria', 'solicitud', 'Solicitud', 10, true),
  ('consultoria', 'analisis', 'Análisis', 20, true),
  ('consultoria', 'entrega_concepto', 'Entrega del concepto', 30, true),
  ('consultoria', 'gestiones_adicionales', 'Gestiones adicionales', 40, true),
  ('consultoria', 'cierre', 'Cierre', 50, true)
on conflict (matter_type, stage_key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  enabled = true;

-- ---------------------------------------------------------------------------
-- 2) Disable extras del mismo tipo (no DELETE: FK desde matters)
-- ---------------------------------------------------------------------------

update public.matter_stage_defs d
set enabled = false
where d.matter_type in (
  'judicial', 'arbitral', 'administrativo', 'insolvencia',
  'extrajudicial', 'contractual', 'consultoria'
)
and not exists (
  select 1
  from (
    values
      ('judicial', 'estudio'),
      ('judicial', 'demanda_radicada'),
      ('judicial', 'admision'),
      ('judicial', 'notificacion'),
      ('judicial', 'contestacion_excepciones'),
      ('judicial', 'audiencia_inicial'),
      ('judicial', 'instruccion_juzgamiento'),
      ('judicial', 'sentencia'),
      ('judicial', 'recursos_2a_instancia'),
      ('judicial', 'ejecucion'),
      ('judicial', 'gestiones_adicionales'),
      ('judicial', 'cierre'),
      ('arbitral', 'estudio'),
      ('arbitral', 'convocatoria'),
      ('arbitral', 'integracion_tribunal'),
      ('arbitral', 'instalacion'),
      ('arbitral', 'primera_audiencia_tramite'),
      ('arbitral', 'pruebas'),
      ('arbitral', 'alegatos'),
      ('arbitral', 'laudo'),
      ('arbitral', 'anulacion'),
      ('arbitral', 'gestiones_adicionales'),
      ('arbitral', 'cierre'),
      ('administrativo', 'estudio'),
      ('administrativo', 'radicacion'),
      ('administrativo', 'tramite'),
      ('administrativo', 'decision'),
      ('administrativo', 'recursos'),
      ('administrativo', 'control_judicial'),
      ('administrativo', 'gestiones_adicionales'),
      ('administrativo', 'cierre'),
      ('insolvencia', 'estudio'),
      ('insolvencia', 'solicitud'),
      ('insolvencia', 'admision'),
      ('insolvencia', 'calificacion_graduacion_creditos'),
      ('insolvencia', 'objeciones'),
      ('insolvencia', 'acuerdo_confirmacion'),
      ('insolvencia', 'ejecucion_acuerdo'),
      ('insolvencia', 'liquidacion'),
      ('insolvencia', 'gestiones_adicionales'),
      ('insolvencia', 'cierre'),
      ('extrajudicial', 'estudio'),
      ('extrajudicial', 'requerimiento'),
      ('extrajudicial', 'negociacion'),
      ('extrajudicial', 'acuerdo'),
      ('extrajudicial', 'gestiones_adicionales'),
      ('extrajudicial', 'cierre'),
      ('contractual', 'solicitud'),
      ('contractual', 'redaccion_revision'),
      ('contractual', 'negociacion'),
      ('contractual', 'firma'),
      ('contractual', 'gestiones_adicionales'),
      ('contractual', 'cierre'),
      ('consultoria', 'solicitud'),
      ('consultoria', 'analisis'),
      ('consultoria', 'entrega_concepto'),
      ('consultoria', 'gestiones_adicionales'),
      ('consultoria', 'cierre')
  ) as keep(matter_type, stage_key)
  where keep.matter_type = d.matter_type
    and keep.stage_key = d.stage_key
);

-- ---------------------------------------------------------------------------
-- 3) Remap asuntos en etapas disabled
-- Heurística:
--   a) alias legacy → stage_key canónico del tipo (si existe y enabled)
--   b) si no, etapa enabled con sort_order más cercano al de la etapa actual
--   c) si no, primera etapa enabled del tipo (sort_order asc)
-- ---------------------------------------------------------------------------

with aliases(matter_type, from_key, to_key) as (
  values
    -- comunes
    ('judicial', 'ingreso', 'estudio'),
    ('judicial', 'analisis', 'estudio'),
    ('judicial', 'demanda', 'demanda_radicada'),
    ('judicial', 'contestacion', 'contestacion_excepciones'),
    ('judicial', 'audiencia', 'audiencia_inicial'),
    ('judicial', 'pruebas', 'instruccion_juzgamiento'),
    ('judicial', 'actuacion', 'instruccion_juzgamiento'),
    ('judicial', 'alegatos', 'instruccion_juzgamiento'),
    ('judicial', 'fallo', 'sentencia'),
    ('judicial', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('judicial', 'cierre', 'cierre'),
    ('judicial', 'ejecucion', 'ejecucion'),

    ('arbitral', 'ingreso', 'estudio'),
    ('arbitral', 'analisis', 'estudio'),
    ('arbitral', 'demanda', 'convocatoria'),
    ('arbitral', 'contestacion', 'primera_audiencia_tramite'),
    ('arbitral', 'audiencia', 'primera_audiencia_tramite'),
    ('arbitral', 'actuacion', 'pruebas'),
    ('arbitral', 'fallo', 'laudo'),
    ('arbitral', 'ejecucion', 'anulacion'),
    ('arbitral', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('arbitral', 'cierre', 'cierre'),

    ('administrativo', 'ingreso', 'estudio'),
    ('administrativo', 'analisis', 'estudio'),
    ('administrativo', 'peticion', 'radicacion'),
    ('administrativo', 'pruebas', 'tramite'),
    ('administrativo', 'actuacion', 'tramite'),
    ('administrativo', 'audiencia', 'tramite'),
    ('administrativo', 'fallo', 'decision'),
    ('administrativo', 'ejecucion', 'control_judicial'),
    ('administrativo', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('administrativo', 'cierre', 'cierre'),

    ('insolvencia', 'ingreso', 'estudio'),
    ('insolvencia', 'analisis', 'estudio'),
    ('insolvencia', 'reorganizacion', 'acuerdo_confirmacion'),
    ('insolvencia', 'actuacion', 'solicitud'),
    ('insolvencia', 'ejecucion', 'ejecucion_acuerdo'),
    ('insolvencia', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('insolvencia', 'cierre', 'cierre'),
    ('insolvencia', 'liquidacion', 'liquidacion'),

    ('extrajudicial', 'ingreso', 'estudio'),
    ('extrajudicial', 'analisis', 'estudio'),
    ('extrajudicial', 'actuacion', 'requerimiento'),
    ('extrajudicial', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('extrajudicial', 'cierre', 'cierre'),
    ('extrajudicial', 'negociacion', 'negociacion'),
    ('extrajudicial', 'acuerdo', 'acuerdo'),

    ('contractual', 'ingreso', 'solicitud'),
    ('contractual', 'estudio', 'solicitud'),
    ('contractual', 'analisis', 'redaccion_revision'),
    ('contractual', 'redaccion', 'redaccion_revision'),
    ('contractual', 'revision', 'redaccion_revision'),
    ('contractual', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('contractual', 'cierre', 'cierre'),
    ('contractual', 'firma', 'firma'),
    ('contractual', 'negociacion', 'negociacion'),

    ('consultoria', 'ingreso', 'solicitud'),
    ('consultoria', 'estudio', 'solicitud'),
    ('consultoria', 'entrega', 'entrega_concepto'),
    ('consultoria', 'actuacion', 'analisis'),
    ('consultoria', 'gestiones_adicionales', 'gestiones_adicionales'),
    ('consultoria', 'cierre', 'cierre'),
    ('consultoria', 'analisis', 'analisis')
),
targets as (
  select
    m.id as matter_id,
    coalesce(
      -- a) alias → etapa enabled
      (
        select a.to_key
        from aliases a
        join public.matter_stage_defs d
          on d.matter_type = a.matter_type
         and d.stage_key = a.to_key
         and d.enabled
        where a.matter_type = m.matter_type
          and a.from_key = m.stage
        limit 1
      ),
      -- b) misma clave si ya está enabled
      (
        select d.stage_key
        from public.matter_stage_defs d
        where d.matter_type = m.matter_type
          and d.stage_key = m.stage
          and d.enabled
        limit 1
      ),
      -- c) sort_order más cercano a la etapa actual (aunque disabled)
      (
        select d2.stage_key
        from public.matter_stage_defs cur
        join public.matter_stage_defs d2
          on d2.matter_type = cur.matter_type
         and d2.enabled
        where cur.matter_type = m.matter_type
          and cur.stage_key = m.stage
        order by abs(d2.sort_order - cur.sort_order), d2.sort_order
        limit 1
      ),
      -- d) primera enabled del tipo
      (
        select d.stage_key
        from public.matter_stage_defs d
        where d.matter_type = m.matter_type
          and d.enabled
        order by d.sort_order
        limit 1
      )
    ) as new_stage
  from public.matters m
  where m.deleted_at is null
    and exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = m.matter_type
        and d.stage_key = m.stage
        and not d.enabled
    )
)
update public.matters m
set stage = t.new_stage
from targets t
where m.id = t.matter_id
  and t.new_stage is not null
  and m.stage is distinct from t.new_stage;

-- Asuntos cuya etapa no existe en defs (caso raro): primera enabled
update public.matters m
set stage = (
  select d.stage_key
  from public.matter_stage_defs d
  where d.matter_type = m.matter_type
    and d.enabled
  order by d.sort_order
  limit 1
)
where m.deleted_at is null
  and not exists (
    select 1
    from public.matter_stage_defs d
    where d.matter_type = m.matter_type
      and d.stage_key = m.stage
  );

comment on table public.matter_stage_defs is
  'Etapas acordadas por tipo (mapa usuario). Gestiones adicionales antes de Cierre; saltables. Extras disabled, no borrados.';
