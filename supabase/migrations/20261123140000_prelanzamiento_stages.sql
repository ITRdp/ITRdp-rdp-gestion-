-- Prelanzamiento — matter_stage_defs + FK (matter_type, stage)
-- Aplicar DESPUÉS de 20261123120000_fix_festivos_areas_protect.sql
-- Aún no aplicada en prod/dev: seguro reescribir in-place.
--
-- Tipos: judicial | arbitral | administrativo | insolvencia | extrajudicial | contractual | consultoria
-- Liquidación es etapa de insolvencia (no un tipo).
-- Gestiones adicionales antes de Cierre en todos los tipos.
-- En pausa = matters.status, no etapa.

-- ---------------------------------------------------------------------------
-- Catálogo matter_stage_defs
-- ---------------------------------------------------------------------------

create table if not exists public.matter_stage_defs (
  id uuid primary key default gen_random_uuid(),
  matter_type text not null,
  stage_key text not null,
  label text not null,
  sort_order int not null,
  enabled boolean not null default true,
  unique (matter_type, stage_key)
);

-- Por si existía un borrador con check antiguo (insolvencia_liquidacion):
-- quitar check → borrar filas legacy → añadir check nuevo (si no, ADD falla).
alter table public.matter_stage_defs drop constraint if exists matter_stage_defs_matter_type_check;

delete from public.matter_stage_defs
where matter_type = 'insolvencia_liquidacion';

do $$
begin
  alter table public.matter_stage_defs
    add constraint matter_stage_defs_matter_type_check check (
      matter_type in (
        'judicial', 'arbitral', 'administrativo', 'insolvencia',
        'extrajudicial', 'contractual', 'consultoria'
      )
    );
exception
  when duplicate_object then null;
end $$;

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

-- Seed exacto (upsert labels/orden)
insert into public.matter_stage_defs (matter_type, stage_key, label, sort_order) values
  -- Judicial
  ('judicial', 'ingreso', 'Ingreso', 10),
  ('judicial', 'demanda', 'Demanda / radicación', 20),
  ('judicial', 'contestacion', 'Contestación', 30),
  ('judicial', 'pruebas', 'Pruebas', 40),
  ('judicial', 'audiencia', 'Audiencia', 50),
  ('judicial', 'alegatos', 'Alegatos', 60),
  ('judicial', 'fallo', 'Fallo', 70),
  ('judicial', 'ejecucion', 'Ejecución', 80),
  ('judicial', 'gestiones_adicionales', 'Gestiones adicionales', 90),
  ('judicial', 'cierre', 'Cierre', 100),
  -- Arbitral
  ('arbitral', 'ingreso', 'Ingreso', 10),
  ('arbitral', 'demanda', 'Demanda arbitral', 20),
  ('arbitral', 'contestacion', 'Contestación', 30),
  ('arbitral', 'pruebas', 'Pruebas', 40),
  ('arbitral', 'audiencia', 'Audiencia', 50),
  ('arbitral', 'alegatos', 'Alegatos', 60),
  ('arbitral', 'laudo', 'Laudo', 70),
  ('arbitral', 'ejecucion', 'Ejecución', 80),
  ('arbitral', 'gestiones_adicionales', 'Gestiones adicionales', 90),
  ('arbitral', 'cierre', 'Cierre', 100),
  -- Administrativo
  ('administrativo', 'ingreso', 'Ingreso', 10),
  ('administrativo', 'peticion', 'Petición / recurso', 20),
  ('administrativo', 'pruebas', 'Pruebas', 30),
  ('administrativo', 'audiencia', 'Audiencia', 40),
  ('administrativo', 'decision', 'Decisión', 50),
  ('administrativo', 'ejecucion', 'Ejecución', 60),
  ('administrativo', 'gestiones_adicionales', 'Gestiones adicionales', 70),
  ('administrativo', 'cierre', 'Cierre', 80),
  -- Insolvencia (Liquidación = etapa)
  ('insolvencia', 'ingreso', 'Ingreso', 10),
  ('insolvencia', 'analisis', 'Análisis', 20),
  ('insolvencia', 'reorganizacion', 'Reorganización', 30),
  ('insolvencia', 'liquidacion', 'Liquidación', 40),
  ('insolvencia', 'gestiones_adicionales', 'Gestiones adicionales', 50),
  ('insolvencia', 'cierre', 'Cierre', 60),
  -- Extrajudicial
  ('extrajudicial', 'ingreso', 'Ingreso', 10),
  ('extrajudicial', 'negociacion', 'Negociación', 20),
  ('extrajudicial', 'acuerdo', 'Acuerdo', 30),
  ('extrajudicial', 'gestiones_adicionales', 'Gestiones adicionales', 40),
  ('extrajudicial', 'cierre', 'Cierre', 50),
  -- Contractual
  ('contractual', 'ingreso', 'Ingreso', 10),
  ('contractual', 'redaccion', 'Redacción', 20),
  ('contractual', 'revision', 'Revisión', 30),
  ('contractual', 'firma', 'Firma', 40),
  ('contractual', 'gestiones_adicionales', 'Gestiones adicionales', 50),
  ('contractual', 'cierre', 'Cierre', 60),
  -- Consultoría
  ('consultoria', 'ingreso', 'Ingreso', 10),
  ('consultoria', 'analisis', 'Análisis', 20),
  ('consultoria', 'entrega', 'Entrega', 30),
  ('consultoria', 'gestiones_adicionales', 'Gestiones adicionales', 40),
  ('consultoria', 'cierre', 'Cierre', 50)
on conflict (matter_type, stage_key) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- matters.matter_type → 7 valores; stage sin check fijo; FK compuesta
-- ---------------------------------------------------------------------------

-- Quitar check fijo de etapa (si existía)
alter table public.matters drop constraint if exists matters_stage_check;

-- Remap tipos legacy → catálogo firma
update public.matters
set matter_type = case
  when matter_type in (
    'judicial', 'arbitral', 'administrativo', 'insolvencia',
    'extrajudicial', 'contractual', 'consultoria'
  ) then matter_type
  when matter_type in ('insolvencia_liquidacion', 'insolvenicia') then 'insolvencia'
  when matter_type in ('general', 'mercantil', 'societario', 'competencia') then 'consultoria'
  when matter_type is null or matter_type = '' then 'consultoria'
  else 'consultoria'
end;

-- Remap etapas legacy → primera etapa válida del tipo (ingreso) si no existe en defs
update public.matters m
set stage = coalesce(
  (
    select d.stage_key
    from public.matter_stage_defs d
    where d.matter_type = m.matter_type
      and d.stage_key = m.stage
      and d.enabled
    limit 1
  ),
  (
    select d.stage_key
    from public.matter_stage_defs d
    where d.matter_type = m.matter_type
      and d.enabled
    order by d.sort_order
    limit 1
  ),
  'ingreso'
);

-- Check de tipo
alter table public.matters drop constraint if exists matters_matter_type_check;
alter table public.matters
  add constraint matters_matter_type_check check (
    matter_type in (
      'judicial', 'arbitral', 'administrativo', 'insolvencia',
      'extrajudicial', 'contractual', 'consultoria'
    )
  );

alter table public.matters
  alter column matter_type set default 'consultoria';

alter table public.matters
  alter column stage set default 'ingreso';

-- FK compuesta: solo etapas definidas para ese tipo
alter table public.matters drop constraint if exists matters_type_stage_fkey;
alter table public.matters
  add constraint matters_type_stage_fkey
  foreign key (matter_type, stage)
  references public.matter_stage_defs (matter_type, stage_key);

-- members: forzar cambio de contraseña en primer ingreso
alter table public.members
  add column if not exists must_change_password boolean not null default false;

comment on column public.members.must_change_password is
  'True cuando el admin crea el usuario con clave temporal; el miembro debe cambiarla.';

comment on table public.matter_stage_defs is
  'Etapas por tipo de asunto. Gestiones adicionales antes de Cierre; saltables en UI. En pausa es status.';
