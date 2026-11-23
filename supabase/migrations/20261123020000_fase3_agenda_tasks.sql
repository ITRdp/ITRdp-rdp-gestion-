-- Fase 3 — Agenda, días no hábiles CO, tareas ampliadas
-- Aplicar DESPUÉS de 20261123010000_fase2_clients_matters.sql
-- Seed de festivos 2026–2027: VALIDAR con el despacho antes de producción.

-- ---------------------------------------------------------------------------
-- non_business_days (festivos / no hábiles editables)
-- ---------------------------------------------------------------------------

create table if not exists public.non_business_days (
  id uuid primary key default gen_random_uuid(),
  day date not null unique,
  name text not null,
  kind text not null default 'festivo_nacional'
    check (kind in ('festivo_nacional', 'festivo_religioso', 'puente', 'otro')),
  notes text,
  created_at timestamptz not null default now()
);

comment on table public.non_business_days is
  'Días no hábiles Colombia (festivos y excepciones). Editable. Seed 2026-2027 sujeto a validación.';

create index if not exists non_business_days_day_idx on public.non_business_days (day);

alter table public.non_business_days enable row level security;

drop policy if exists non_business_days_select_enabled on public.non_business_days;
create policy non_business_days_select_enabled
  on public.non_business_days for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists non_business_days_write_admin on public.non_business_days;
create policy non_business_days_write_admin
  on public.non_business_days for all
  to authenticated
  using (public.is_admin_member())
  with check (public.is_admin_member());

-- Seed 2026–2027 (aprox. Ley Emiliani / calendario oficial — VALIDAR)
insert into public.non_business_days (day, name, kind, notes) values
  -- 2026
  ('2026-01-01', 'Año Nuevo', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2026-01-12', 'Día de los Reyes Magos', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-03-23', 'Día de San José', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-04-02', 'Jueves Santo', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2026-04-03', 'Viernes Santo', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2026-05-01', 'Día del Trabajo', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2026-05-18', 'Ascensión del Señor', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-06-08', 'Corpus Christi', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-06-15', 'Sagrado Corazón', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-06-29', 'San Pedro y San Pablo', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2026-07-20', 'Independencia de Colombia', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2026-08-07', 'Batalla de Boyacá', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2026-08-17', 'Asunción de la Virgen', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-10-12', 'Día de la Raza', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2026-11-02', 'Todos los Santos', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2026-11-16', 'Independencia de Cartagena', 'festivo_nacional', 'Seed Fase 3 — validar (traslado)'),
  ('2026-12-08', 'Inmaculada Concepción', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2026-12-25', 'Navidad', 'festivo_religioso', 'Seed Fase 3 — validar'),
  -- 2027
  ('2027-01-01', 'Año Nuevo', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2027-01-11', 'Día de los Reyes Magos', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-03-22', 'Día de San José', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-03-25', 'Jueves Santo', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2027-03-26', 'Viernes Santo', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2027-05-01', 'Día del Trabajo', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2027-05-10', 'Ascensión del Señor', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-05-31', 'Corpus Christi', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-06-07', 'Sagrado Corazón', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-07-05', 'San Pedro y San Pablo', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-07-20', 'Independencia de Colombia', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2027-08-07', 'Batalla de Boyacá', 'festivo_nacional', 'Seed Fase 3 — validar'),
  ('2027-08-16', 'Asunción de la Virgen', 'festivo_religioso', 'Seed Fase 3 — validar (traslado)'),
  ('2027-10-18', 'Día de la Raza', 'festivo_nacional', 'Seed Fase 3 — validar (traslado)'),
  ('2027-11-01', 'Todos los Santos', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2027-11-15', 'Independencia de Cartagena', 'festivo_nacional', 'Seed Fase 3 — validar (traslado)'),
  ('2027-12-08', 'Inmaculada Concepción', 'festivo_religioso', 'Seed Fase 3 — validar'),
  ('2027-12-25', 'Navidad', 'festivo_religioso', 'Seed Fase 3 — validar')
on conflict (day) do nothing;

-- ---------------------------------------------------------------------------
-- events (agenda)
-- ---------------------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters (id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  location text,
  event_type text not null default 'otro'
    check (event_type in ('audiencia', 'reunion', 'plazo', 'interno', 'otro')),
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_matter_id_idx on public.events (matter_id);

alter table public.events enable row level security;

drop policy if exists events_select_enabled on public.events;
create policy events_select_enabled
  on public.events for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists events_insert_enabled on public.events;
create policy events_insert_enabled
  on public.events for insert
  to authenticated
  with check (public.is_enabled_member() and created_by = auth.uid());

drop policy if exists events_update_enabled on public.events;
create policy events_update_enabled
  on public.events for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

drop policy if exists events_delete_enabled on public.events;
create policy events_delete_enabled
  on public.events for delete
  to authenticated
  using (public.is_enabled_member());

-- ---------------------------------------------------------------------------
-- tasks: prioridad, checklist, ampliación de estados
-- ---------------------------------------------------------------------------

alter table public.tasks
  add column if not exists priority text not null default 'media'
    check (priority in ('baja', 'media', 'alta', 'urgente')),
  add column if not exists checklist jsonb not null default '[]'::jsonb,
  add column if not exists due_business_date date,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks
  add constraint tasks_status_check
  check (status in ('pendiente', 'en_curso', 'completada', 'cancelada'));

comment on column public.tasks.checklist is
  'Array JSON [{id, text, done}] checklist de la tarea';
comment on column public.tasks.due_business_date is
  'Fecha límite en días hábiles (opcional; semáforo puede usar follow_up_date o esta)';

-- ---------------------------------------------------------------------------
-- task_comments (con menciones @ opcionales en body)
-- ---------------------------------------------------------------------------

create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.members (id),
  body text not null,
  mentioned_member_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on public.task_comments (task_id);

alter table public.task_comments enable row level security;

drop policy if exists task_comments_select_enabled on public.task_comments;
create policy task_comments_select_enabled
  on public.task_comments for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists task_comments_insert_enabled on public.task_comments;
create policy task_comments_insert_enabled
  on public.task_comments for insert
  to authenticated
  with check (public.is_enabled_member() and author_id = auth.uid());

drop policy if exists task_comments_delete_own_or_admin on public.task_comments;
create policy task_comments_delete_own_or_admin
  on public.task_comments for delete
  to authenticated
  using (author_id = auth.uid() or public.is_admin_member());

-- ---------------------------------------------------------------------------
-- task_templates
-- ---------------------------------------------------------------------------

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  priority text not null default 'media'
    check (priority in ('baja', 'media', 'alta', 'urgente')),
  checklist jsonb not null default '[]'::jsonb,
  default_follow_up_offset_days int not null default 3,
  area text,
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now()
);

alter table public.task_templates enable row level security;

drop policy if exists task_templates_select_enabled on public.task_templates;
create policy task_templates_select_enabled
  on public.task_templates for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists task_templates_write_enabled on public.task_templates;
create policy task_templates_write_enabled
  on public.task_templates for all
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

-- Plantillas demo (ficticias)
-- Se insertan solo si hay al menos un admin; si no, se omiten.
do $$
declare
  admin_id uuid;
begin
  select id into admin_id from public.members where enabled and role = 'admin' limit 1;
  if admin_id is null then
    select id into admin_id from public.members where enabled limit 1;
  end if;
  if admin_id is not null then
    insert into public.task_templates (name, description, priority, checklist, default_follow_up_offset_days, area, created_by)
    values
      (
        'Revisar memorial',
        'Revisar borrador de memorial y devolver comentarios al redactor.',
        'alta',
        '[{"id":"1","text":"Leer memorial","done":false},{"id":"2","text":"Anotar observaciones","done":false},{"id":"3","text":"Devolver al redactor","done":false}]'::jsonb,
        2,
        'responsabilidad_seguros',
        admin_id
      ),
      (
        'Preparar audiencia',
        'Preparar carpeta y argumentos para audiencia.',
        'urgente',
        '[{"id":"1","text":"Confirmar fecha y sala","done":false},{"id":"2","text":"Armar índice de pruebas","done":false},{"id":"3","text":"Brief al cliente","done":false}]'::jsonb,
        5,
        'empresa',
        admin_id
      ),
      (
        'Seguimiento cliente',
        'Llamar o escribir al cliente con estado del asunto.',
        'media',
        '[{"id":"1","text":"Contactar cliente","done":false},{"id":"2","text":"Registrar actuación","done":false}]'::jsonb,
        3,
        null,
        admin_id
      )
    on conflict do nothing;
  end if;
end $$;
