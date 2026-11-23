-- Prelanzamiento — matter_types / matter_stages editables + gestiones_adicionales
-- Aplicar después de 20261123120000_fix_festivos_areas_protect.sql

-- ---------------------------------------------------------------------------
-- Catálogo de etapas por tipo de asunto
-- ---------------------------------------------------------------------------

create table if not exists public.matter_stage_defs (
  id uuid primary key default gen_random_uuid(),
  matter_type text not null
    check (matter_type in (
      'judicial', 'arbitral', 'administrativo', 'insolvencia_liquidacion',
      'extrajudicial', 'contractual', 'consultoria'
    )),
  stage_key text not null,
  label text not null,
  sort_order int not null,
  enabled boolean not null default true,
  unique (matter_type, stage_key)
);

create index if not exists matter_stage_defs_type_idx
  on public.matter_stage_defs (matter_type, sort_order);

alter table public.matter_stage_defs enable row level security;

drop policy if exists matter_stage_defs_select on public.matter_stage_defs;
create policy matter_stage_defs_select
  on public.matter_stage_defs for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists matter_stage_defs_admin on public.matter_stage_defs;
create policy matter_stage_defs_admin
  on public.matter_stage_defs for all
  to authenticated
  using (public.is_admin_member())
  with check (public.is_admin_member());

-- Seed etapas (Gestiones adicionales antes de Cierre; saltables desde etapas previas en UI)
insert into public.matter_stage_defs (matter_type, stage_key, label, sort_order) values
  -- Judicial
  ('judicial', 'ingreso', 'Ingreso', 10),
  ('judicial', 'analisis', 'Análisis', 20),
  ('judicial', 'actuacion', 'Actuación', 30),
  ('judicial', 'audiencia', 'Audiencia', 40),
  ('judicial', 'alegatos', 'Alegatos', 50),
  ('judicial', 'fallo', 'Fallo', 60),
  ('judicial', 'ejecucion', 'Ejecución', 70),
  ('judicial', 'gestiones_adicionales', 'Gestiones adicionales', 80),
  ('judicial', 'cierre', 'Cierre', 90),
  -- Arbitral
  ('arbitral', 'ingreso', 'Ingreso', 10),
  ('arbitral', 'analisis', 'Análisis', 20),
  ('arbitral', 'actuacion', 'Actuación', 30),
  ('arbitral', 'audiencia', 'Audiencia', 40),
  ('arbitral', 'alegatos', 'Alegatos', 50),
  ('arbitral', 'fallo', 'Laudo', 60),
  ('arbitral', 'ejecucion', 'Ejecución', 70),
  ('arbitral', 'gestiones_adicionales', 'Gestiones adicionales', 80),
  ('arbitral', 'cierre', 'Cierre', 90),
  -- Administrativo
  ('administrativo', 'ingreso', 'Ingreso', 10),
  ('administrativo', 'analisis', 'Análisis', 20),
  ('administrativo', 'actuacion', 'Actuación', 30),
  ('administrativo', 'audiencia', 'Audiencia / audiencia pública', 40),
  ('administrativo', 'fallo', 'Decisión', 50),
  ('administrativo', 'ejecucion', 'Ejecución', 60),
  ('administrativo', 'gestiones_adicionales', 'Gestiones adicionales', 70),
  ('administrativo', 'cierre', 'Cierre', 80),
  -- Insolvencia + Liquidación
  ('insolvencia_liquidacion', 'ingreso', 'Ingreso', 10),
  ('insolvencia_liquidacion', 'analisis', 'Análisis', 20),
  ('insolvencia_liquidacion', 'actuacion', 'Actuación', 30),
  ('insolvencia_liquidacion', 'audiencia', 'Audiencia / junta', 40),
  ('insolvencia_liquidacion', 'fallo', 'Decisión / acuerdo', 50),
  ('insolvencia_liquidacion', 'ejecucion', 'Liquidación / ejecución', 60),
  ('insolvencia_liquidacion', 'gestiones_adicionales', 'Gestiones adicionales', 70),
  ('insolvencia_liquidacion', 'cierre', 'Cierre', 80),
  -- Extrajudicial
  ('extrajudicial', 'ingreso', 'Ingreso', 10),
  ('extrajudicial', 'analisis', 'Análisis', 20),
  ('extrajudicial', 'actuacion', 'Negociación / gestión', 30),
  ('extrajudicial', 'gestiones_adicionales', 'Gestiones adicionales', 40),
  ('extrajudicial', 'cierre', 'Cierre', 50),
  -- Contractual
  ('contractual', 'ingreso', 'Ingreso', 10),
  ('contractual', 'analisis', 'Análisis', 20),
  ('contractual', 'actuacion', 'Redacción / gestión', 30),
  ('contractual', 'gestiones_adicionales', 'Gestiones adicionales', 40),
  ('contractual', 'cierre', 'Cierre', 50),
  -- Consultoría
  ('consultoria', 'ingreso', 'Ingreso', 10),
  ('consultoria', 'analisis', 'Análisis', 20),
  ('consultoria', 'actuacion', 'Entrega / asesoría', 30),
  ('consultoria', 'gestiones_adicionales', 'Gestiones adicionales', 40),
  ('consultoria', 'cierre', 'Cierre', 50)
on conflict (matter_type, stage_key) do nothing;

-- Ampliar stages permitidos en matters
alter table public.matters drop constraint if exists matters_stage_check;
alter table public.matters
  add constraint matters_stage_check check (
    stage in (
      'ingreso', 'analisis', 'actuacion', 'audiencia', 'alegatos',
      'fallo', 'ejecucion', 'gestiones_adicionales', 'cierre'
    )
  );

-- members: forzar cambio de contraseña en primer ingreso
alter table public.members
  add column if not exists must_change_password boolean not null default false;

comment on column public.members.must_change_password is
  'True cuando el admin crea el usuario con clave temporal; el miembro debe cambiarla.';

-- Vacancia colectiva (rangos) en non_business_days notes + kind
-- (sin cambio de schema: kind 'otro' + notes "vacancia:YYYY-MM-DD..YYYY-MM-DD" soportado en UI)
