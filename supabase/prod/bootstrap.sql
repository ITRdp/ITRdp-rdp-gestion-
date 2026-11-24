-- RDP Gestión — bootstrap producción
-- Concat de migraciones 000000→190000 (sin plantillas demo).
-- NO editar migraciones fuente; este archivo se regenera.
-- Aplicar en proyecto Supabase PROD vacío (SQL Editor o psql).


-- ############################################################################
-- Source: supabase/migrations/20261123000000_initial_schema.sql
-- ############################################################################

-- RDP Gestión v1 — schema, RLS y helpers
-- Aplicar en el SQL Editor de Supabase o con: supabase db push / psql

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null default 'abogado'
    check (role in ('admin', 'abogado', 'paralegal')),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.members is
  'Perfiles del despacho. Solo enabled=true pueden usar la aplicación. Sin registro público.';

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  nif text,
  email text,
  phone text,
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now()
);

create table public.matters (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  title text not null,
  description text,
  -- Abogado responsable del asunto (distinto del encargado de una tarea)
  responsible_lawyer_id uuid not null references public.members (id),
  -- Vencimiento procesal (NO confundir con follow_up_date de tasks)
  procedural_deadline date,
  status text not null default 'abierto'
    check (status in ('abierto', 'cerrado', 'archivado')),
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now()
);

create table public.actuaciones (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  author_id uuid not null references public.members (id),
  description text not null,
  onedrive_url text,
  created_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  actuacion_id uuid references public.actuaciones (id) on delete set null,
  -- Encargado de la tarea (puede ser distinto del abogado responsable del asunto)
  assignee_id uuid not null references public.members (id),
  description text not null,
  -- Fecha de seguimiento interna (NO es el vencimiento procesal del asunto)
  follow_up_date date not null,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'completada', 'cancelada')),
  completed_at timestamptz,
  completed_by uuid references public.members (id),
  created_by uuid not null references public.members (id),
  created_at timestamptz not null default now()
);

create index matters_client_id_idx on public.matters (client_id);
create index matters_responsible_lawyer_id_idx on public.matters (responsible_lawyer_id);
create index actuaciones_matter_id_idx on public.actuaciones (matter_id);
create index tasks_matter_id_idx on public.tasks (matter_id);
create index tasks_assignee_status_idx on public.tasks (assignee_id, status);
create index tasks_follow_up_date_idx on public.tasks (follow_up_date);

-- ---------------------------------------------------------------------------
-- Helpers RLS
-- ---------------------------------------------------------------------------

create or replace function public.is_enabled_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.enabled = true
  );
$$;

revoke all on function public.is_enabled_member() from public;
grant execute on function public.is_enabled_member() to authenticated;

create or replace function public.is_admin_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.enabled = true
      and m.role = 'admin'
  );
$$;

revoke all on function public.is_admin_member() from public;
grant execute on function public.is_admin_member() to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.members enable row level security;
alter table public.clients enable row level security;
alter table public.matters enable row level security;
alter table public.actuaciones enable row level security;
alter table public.tasks enable row level security;

-- members: cada uno ve su fila; habilitados ven a todos; solo admin escribe
create policy members_select_self_or_enabled
  on public.members for select
  to authenticated
  using (id = auth.uid() or public.is_enabled_member());

create policy members_update_admin
  on public.members for update
  to authenticated
  using (public.is_admin_member())
  with check (public.is_admin_member());

create policy members_insert_admin
  on public.members for insert
  to authenticated
  with check (public.is_admin_member());

-- clients
create policy clients_select_enabled
  on public.clients for select
  to authenticated
  using (public.is_enabled_member());

create policy clients_insert_enabled
  on public.clients for insert
  to authenticated
  with check (public.is_enabled_member() and created_by = auth.uid());

create policy clients_update_enabled
  on public.clients for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

-- matters
create policy matters_select_enabled
  on public.matters for select
  to authenticated
  using (public.is_enabled_member());

create policy matters_insert_enabled
  on public.matters for insert
  to authenticated
  with check (public.is_enabled_member() and created_by = auth.uid());

create policy matters_update_enabled
  on public.matters for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

-- actuaciones
create policy actuaciones_select_enabled
  on public.actuaciones for select
  to authenticated
  using (public.is_enabled_member());

create policy actuaciones_insert_enabled
  on public.actuaciones for insert
  to authenticated
  with check (public.is_enabled_member() and author_id = auth.uid());

create policy actuaciones_update_enabled
  on public.actuaciones for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

-- tasks
create policy tasks_select_enabled
  on public.tasks for select
  to authenticated
  using (public.is_enabled_member());

create policy tasks_insert_enabled
  on public.tasks for insert
  to authenticated
  with check (public.is_enabled_member() and created_by = auth.uid());

create policy tasks_update_enabled
  on public.tasks for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

-- ---------------------------------------------------------------------------
-- Seeds de documentación (NO insertan usuarios auth; ver README)
-- Tras crear 3 usuarios en Authentication → Users, habilitarlos así
-- (sustituir los UUID por los reales):
--
-- insert into public.members (id, email, full_name, role, enabled) values
--   ('UUID-1', 'abogado1@despacho.local', 'Ana Ruiz', 'admin', true),
--   ('UUID-2', 'abogado2@despacho.local', 'Luis Martín', 'abogado', true),
--   ('UUID-3', 'paralegal@despacho.local', 'María López', 'paralegal', true);
-- ---------------------------------------------------------------------------


-- ############################################################################
-- Source: supabase/migrations/20261123010000_fase2_clients_matters.sql
-- ############################################################################

-- Fase 2 — Clientes y asuntos robustos
-- Aplicar DESPUÉS de 20261123000000_initial_schema.sql
-- Migra clients.nif → document_type + document_number sin perder datos.

-- ---------------------------------------------------------------------------
-- clients: ampliar y migrar nif
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists person_type text not null default 'juridica'
    check (person_type in ('natural', 'juridica')),
  add column if not exists document_type text not null default 'NIT'
    check (document_type in ('NIT', 'CC', 'CE', 'PAS', 'PPT', 'OTRO')),
  add column if not exists document_number text,
  add column if not exists document_dv text,
  add column if not exists legal_name text,
  add column if not exists city text,
  add column if not exists department text,
  add column if not exists address text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- Migrar nif existente → document_number (NIT por defecto)
update public.clients
set
  document_number = nullif(trim(nif), ''),
  document_type = coalesce(document_type, 'NIT'),
  person_type = coalesce(person_type, 'juridica'),
  legal_name = coalesce(legal_name, name)
where nif is not null and trim(nif) <> '';

-- Si no había nif, al menos copiar name a legal_name para jurídicas
update public.clients
set legal_name = coalesce(legal_name, name)
where legal_name is null;

alter table public.clients drop column if exists nif;

comment on column public.clients.document_number is
  'Número de documento (NIT sin DV, CC, etc.). El DV de NIT va en document_dv.';
comment on column public.clients.document_dv is
  'Dígito de verificación (solo NIT Colombia).';
comment on column public.clients.deleted_at is
  'Soft delete. Solo admin puede borrar; listados filtran deleted_at is null.';

create index if not exists clients_document_number_idx
  on public.clients (document_type, document_number)
  where deleted_at is null;
create index if not exists clients_name_idx
  on public.clients (name)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- client_contacts: contactos múltiples
-- ---------------------------------------------------------------------------

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  full_name text not null,
  role_title text,
  email text,
  phone text,
  notes text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists client_contacts_client_id_idx
  on public.client_contacts (client_id);

alter table public.client_contacts enable row level security;

drop policy if exists client_contacts_select_enabled on public.client_contacts;
create policy client_contacts_select_enabled
  on public.client_contacts for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists client_contacts_insert_enabled on public.client_contacts;
create policy client_contacts_insert_enabled
  on public.client_contacts for insert
  to authenticated
  with check (public.is_enabled_member());

drop policy if exists client_contacts_update_enabled on public.client_contacts;
create policy client_contacts_update_enabled
  on public.client_contacts for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

drop policy if exists client_contacts_delete_enabled on public.client_contacts;
create policy client_contacts_delete_enabled
  on public.client_contacts for delete
  to authenticated
  using (public.is_enabled_member());

-- Soft-delete clients: solo admin
drop policy if exists clients_delete_admin on public.clients;
create policy clients_delete_admin
  on public.clients for delete
  to authenticated
  using (public.is_admin_member());

-- ---------------------------------------------------------------------------
-- matters: campos ampliados
-- ---------------------------------------------------------------------------

alter table public.matters
  add column if not exists code text,
  add column if not exists area text not null default 'comercial'
    check (area in (
      'responsabilidad_seguros', 'empresa', 'consumidor', 'insolvencia',
      'comercial', 'tributario', 'societario', 'otro'
    )),
  add column if not exists matter_type text not null default 'general',
  add column if not exists stage text not null default 'ingreso'
    check (stage in (
      'ingreso', 'analisis', 'actuacion', 'audiencia',
      'alegatos', 'fallo', 'ejecucion', 'cierre'
    )),
  add column if not exists priority text not null default 'media'
    check (priority in ('baja', 'media', 'alta', 'urgente')),
  add column if not exists counterparts text,
  add column if not exists radicado text,
  add column if not exists court_name text,
  add column if not exists city text,
  add column if not exists amount_cop numeric(18, 2),
  add column if not exists fees_cop numeric(18, 2),
  add column if not exists opened_at date default current_date,
  add column if not exists closed_at date,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- Ampliar status: mantener abierto/cerrado/archivado + en_pausa
alter table public.matters drop constraint if exists matters_status_check;
alter table public.matters
  add constraint matters_status_check
  check (status in ('abierto', 'en_pausa', 'cerrado', 'archivado'));

-- Códigos RDP-YYYY-#### para filas existentes sin code
do $$
declare
  r record;
  yr text;
  seq int;
  new_code text;
begin
  for r in
    select id, created_at
    from public.matters
    where code is null
    order by created_at, id
  loop
    yr := to_char(coalesce(r.created_at, now()), 'YYYY');
    select coalesce(max(
      nullif(substring(m.code from 'RDP-' || yr || '-([0-9]+)'), '')::int
    ), 0) + 1
    into seq
    from public.matters m
    where m.code ~ ('^RDP-' || yr || '-[0-9]+$');

    new_code := 'RDP-' || yr || '-' || lpad(seq::text, 4, '0');
    update public.matters set code = new_code where id = r.id;
  end loop;
end $$;

alter table public.matters
  alter column code set not null;

create unique index if not exists matters_code_uidx on public.matters (code);
create index if not exists matters_stage_idx on public.matters (stage) where deleted_at is null;
create index if not exists matters_status_idx on public.matters (status) where deleted_at is null;
create index if not exists matters_area_idx on public.matters (area) where deleted_at is null;
create index if not exists matters_priority_idx on public.matters (priority) where deleted_at is null;

comment on column public.matters.code is 'Código interno RDP-YYYY-####';
comment on column public.matters.radicado is 'Radicado judicial (hasta 23 dígitos), opcional';
comment on column public.matters.stage is
  'Catálogo editable de etapas: ingreso, analisis, actuacion, audiencia, alegatos, fallo, ejecucion, cierre';
comment on column public.matters.deleted_at is 'Soft delete; solo admin';

-- Soft-delete matters: solo admin
drop policy if exists matters_delete_admin on public.matters;
create policy matters_delete_admin
  on public.matters for delete
  to authenticated
  using (public.is_admin_member());

-- ---------------------------------------------------------------------------
-- matter_team: equipo del asunto
-- ---------------------------------------------------------------------------

create table if not exists public.matter_team (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  role_in_matter text not null default 'colaborador'
    check (role_in_matter in ('responsable', 'colaborador', 'paralegal', 'observador')),
  created_at timestamptz not null default now(),
  unique (matter_id, member_id)
);

create index if not exists matter_team_matter_id_idx on public.matter_team (matter_id);
create index if not exists matter_team_member_id_idx on public.matter_team (member_id);

alter table public.matter_team enable row level security;

drop policy if exists matter_team_select_enabled on public.matter_team;
create policy matter_team_select_enabled
  on public.matter_team for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists matter_team_insert_enabled on public.matter_team;
create policy matter_team_insert_enabled
  on public.matter_team for insert
  to authenticated
  with check (public.is_enabled_member());

drop policy if exists matter_team_update_enabled on public.matter_team;
create policy matter_team_update_enabled
  on public.matter_team for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

drop policy if exists matter_team_delete_enabled on public.matter_team;
create policy matter_team_delete_enabled
  on public.matter_team for delete
  to authenticated
  using (public.is_enabled_member());

-- ---------------------------------------------------------------------------
-- Secuencia / función para códigos RDP-YYYY-####
-- ---------------------------------------------------------------------------

create or replace function public.next_matter_code(p_at timestamptz default now())
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  yr text := to_char(p_at, 'YYYY');
  seq int;
begin
  select coalesce(max(
    nullif(substring(m.code from 'RDP-' || yr || '-([0-9]+)'), '')::int
  ), 0) + 1
  into seq
  from public.matters m
  where m.code ~ ('^RDP-' || yr || '-[0-9]+$');

  return 'RDP-' || yr || '-' || lpad(seq::text, 4, '0');
end;
$$;

revoke all on function public.next_matter_code(timestamptz) from public;
grant execute on function public.next_matter_code(timestamptz) to authenticated;


-- ############################################################################
-- Source: supabase/migrations/20261123020000_fase3_agenda_tasks.sql
-- ############################################################################

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


-- ############################################################################
-- Source: supabase/migrations/20261123030000_fase4_activity_docs_time.sql
-- ############################################################################

-- Fase 4 — activity_log, documentos, tiempo
-- Aplicar DESPUÉS de 20261123020000_fase3_agenda_tasks.sql
--
-- Storage: crear bucket privado `matter-documents` en Dashboard → Storage
-- (o: insert into storage.buckets …). Políticas abajo asumen ese nombre.

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  actor_id uuid references public.members (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_matter_id_idx
  on public.activity_log (matter_id, created_at desc);
create index if not exists activity_log_client_id_idx
  on public.activity_log (client_id, created_at desc);
create index if not exists activity_log_created_at_idx
  on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists activity_log_select_enabled on public.activity_log;
create policy activity_log_select_enabled
  on public.activity_log for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists activity_log_insert_enabled on public.activity_log;
create policy activity_log_insert_enabled
  on public.activity_log for insert
  to authenticated
  with check (public.is_enabled_member());

-- Helper: insertar log (security definer para triggers)
create or replace function public.write_activity_log(
  p_matter_id uuid,
  p_client_id uuid,
  p_actor_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_summary text,
  p_meta jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_log (
    matter_id, client_id, actor_id, entity_type, entity_id, action, summary, meta
  ) values (
    p_matter_id, p_client_id, p_actor_id, p_entity_type, p_entity_id, p_action, p_summary, coalesce(p_meta, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.write_activity_log from public;
grant execute on function public.write_activity_log to authenticated;

-- Triggers: matters
create or replace function public.trg_log_matters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.write_activity_log(
      new.id, new.client_id, new.created_by, 'matter', new.id, 'created',
      'Asunto creado: ' || coalesce(new.code, '') || ' — ' || new.title,
      jsonb_build_object('code', new.code, 'status', new.status, 'stage', new.stage)
    );
  elsif tg_op = 'UPDATE' then
    perform public.write_activity_log(
      new.id, new.client_id, auth.uid(), 'matter', new.id, 'updated',
      'Asunto actualizado: ' || coalesce(new.code, '') ||
        case when old.status is distinct from new.status
          then ' (estado ' || old.status || ' → ' || new.status || ')'
          else '' end ||
        case when old.stage is distinct from new.stage
          then ' (etapa ' || old.stage || ' → ' || new.stage || ')'
          else '' end,
      jsonb_build_object(
        'status', new.status, 'stage', new.stage,
        'old_status', old.status, 'old_stage', old.stage
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists matters_activity_log on public.matters;
create trigger matters_activity_log
  after insert or update on public.matters
  for each row execute function public.trg_log_matters();

-- Triggers: actuaciones
create or replace function public.trg_log_actuaciones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  select client_id into v_client from public.matters where id = new.matter_id;
  perform public.write_activity_log(
    new.matter_id, v_client, new.author_id, 'actuacion', new.id, 'created',
    'Actuación registrada: ' || left(new.description, 120),
    jsonb_build_object('has_onedrive', new.onedrive_url is not null)
  );
  return new;
end;
$$;

drop trigger if exists actuaciones_activity_log on public.actuaciones;
create trigger actuaciones_activity_log
  after insert on public.actuaciones
  for each row execute function public.trg_log_actuaciones();

-- Triggers: tasks
create or replace function public.trg_log_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  select client_id into v_client from public.matters where id = new.matter_id;
  if tg_op = 'INSERT' then
    perform public.write_activity_log(
      new.matter_id, v_client, new.created_by, 'task', new.id, 'created',
      'Tarea asignada: ' || left(new.description, 120),
      jsonb_build_object('assignee_id', new.assignee_id, 'priority', new.priority)
    );
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    perform public.write_activity_log(
      new.matter_id, v_client, coalesce(new.completed_by, auth.uid()), 'task', new.id, 'status_changed',
      'Tarea ' || old.status || ' → ' || new.status || ': ' || left(new.description, 80),
      jsonb_build_object('old_status', old.status, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_activity_log on public.tasks;
create trigger tasks_activity_log
  after insert or update on public.tasks
  for each row execute function public.trg_log_tasks();

-- Triggers: events
create or replace function public.trg_log_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  if new.matter_id is not null then
    select client_id into v_client from public.matters where id = new.matter_id;
  end if;
  perform public.write_activity_log(
    new.matter_id, v_client, new.created_by, 'event', new.id, 'created',
    'Evento: ' || new.title,
    jsonb_build_object('event_type', new.event_type, 'starts_at', new.starts_at)
  );
  return new;
end;
$$;

drop trigger if exists events_activity_log on public.events;
create trigger events_activity_log
  after insert on public.events
  for each row execute function public.trg_log_events();

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  title text not null,
  description text,
  source text not null default 'onedrive'
    check (source in ('storage', 'onedrive', 'enlace')),
  storage_path text,
  onedrive_url text,
  file_name text,
  mime_type text,
  file_size bigint,
  uploaded_by uuid not null references public.members (id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint documents_has_location check (
    (source = 'storage' and storage_path is not null)
    or (source in ('onedrive', 'enlace') and onedrive_url is not null)
  )
);

create index if not exists documents_matter_id_idx
  on public.documents (matter_id)
  where deleted_at is null;

alter table public.documents enable row level security;

drop policy if exists documents_select_enabled on public.documents;
create policy documents_select_enabled
  on public.documents for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists documents_insert_enabled on public.documents;
create policy documents_insert_enabled
  on public.documents for insert
  to authenticated
  with check (public.is_enabled_member() and uploaded_by = auth.uid());

drop policy if exists documents_update_enabled on public.documents;
create policy documents_update_enabled
  on public.documents for update
  to authenticated
  using (public.is_enabled_member())
  with check (public.is_enabled_member());

drop policy if exists documents_delete_enabled on public.documents;
create policy documents_delete_enabled
  on public.documents for delete
  to authenticated
  using (public.is_enabled_member());

create or replace function public.trg_log_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  select client_id into v_client from public.matters where id = new.matter_id;
  perform public.write_activity_log(
    new.matter_id, v_client, new.uploaded_by, 'document', new.id, 'created',
    'Documento: ' || new.title || ' (' || new.source || ')',
    jsonb_build_object('source', new.source)
  );
  return new;
end;
$$;

drop trigger if exists documents_activity_log on public.documents;
create trigger documents_activity_log
  after insert on public.documents
  for each row execute function public.trg_log_documents();

-- ---------------------------------------------------------------------------
-- time_entries
-- ---------------------------------------------------------------------------

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid not null references public.matters (id) on delete cascade,
  member_id uuid not null references public.members (id),
  description text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes int,
  billable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint time_entries_duration_check check (
    duration_minutes is null or duration_minutes >= 0
  )
);

create index if not exists time_entries_matter_id_idx on public.time_entries (matter_id);
create index if not exists time_entries_member_id_idx on public.time_entries (member_id, started_at desc);
create index if not exists time_entries_open_idx
  on public.time_entries (member_id)
  where ended_at is null;

alter table public.time_entries enable row level security;

drop policy if exists time_entries_select_enabled on public.time_entries;
create policy time_entries_select_enabled
  on public.time_entries for select
  to authenticated
  using (public.is_enabled_member());

drop policy if exists time_entries_insert_own on public.time_entries;
create policy time_entries_insert_own
  on public.time_entries for insert
  to authenticated
  with check (public.is_enabled_member() and member_id = auth.uid());

drop policy if exists time_entries_update_own_or_admin on public.time_entries;
create policy time_entries_update_own_or_admin
  on public.time_entries for update
  to authenticated
  using (member_id = auth.uid() or public.is_admin_member())
  with check (member_id = auth.uid() or public.is_admin_member());

drop policy if exists time_entries_delete_own_or_admin on public.time_entries;
create policy time_entries_delete_own_or_admin
  on public.time_entries for delete
  to authenticated
  using (member_id = auth.uid() or public.is_admin_member());

-- Auto-calcular duration_minutes al cerrar
create or replace function public.trg_time_entries_duration()
returns trigger
language plpgsql
as $$
begin
  if new.ended_at is not null and new.started_at is not null then
    new.duration_minutes := greatest(
      0,
      ceil(extract(epoch from (new.ended_at - new.started_at)) / 60.0)::int
    );
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists time_entries_set_duration on public.time_entries;
create trigger time_entries_set_duration
  before insert or update on public.time_entries
  for each row execute function public.trg_time_entries_duration();

create or replace function public.trg_log_time_entries()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
begin
  select client_id into v_client from public.matters where id = new.matter_id;
  if tg_op = 'INSERT' then
    perform public.write_activity_log(
      new.matter_id, v_client, new.member_id, 'time_entry', new.id, 'started',
      'Cronómetro iniciado',
      '{}'::jsonb
    );
  elsif tg_op = 'UPDATE' and old.ended_at is null and new.ended_at is not null then
    perform public.write_activity_log(
      new.matter_id, v_client, new.member_id, 'time_entry', new.id, 'stopped',
      'Tiempo registrado: ' || coalesce(new.duration_minutes::text, '?') || ' min',
      jsonb_build_object('duration_minutes', new.duration_minutes, 'billable', new.billable)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists time_entries_activity_log on public.time_entries;
create trigger time_entries_activity_log
  after insert or update on public.time_entries
  for each row execute function public.trg_log_time_entries();

-- ---------------------------------------------------------------------------
-- Storage bucket (documentación + políticas si storage schema existe)
-- ---------------------------------------------------------------------------
-- En Dashboard: Storage → New bucket → name: matter-documents → Private
-- Políticas típicas (ejecutar si el proyecto tiene storage):

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'storage' and table_name = 'buckets'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('matter-documents', 'matter-documents', false, 52428800)
    on conflict (id) do nothing;

    -- Lectura/escritura solo miembros autenticados habilitados (vía JWT)
    execute $pol$
      drop policy if exists matter_documents_select on storage.objects;
      create policy matter_documents_select
        on storage.objects for select to authenticated
        using (
          bucket_id = 'matter-documents'
          and public.is_enabled_member()
        );

      drop policy if exists matter_documents_insert on storage.objects;
      create policy matter_documents_insert
        on storage.objects for insert to authenticated
        with check (
          bucket_id = 'matter-documents'
          and public.is_enabled_member()
        );

      drop policy if exists matter_documents_update on storage.objects;
      create policy matter_documents_update
        on storage.objects for update to authenticated
        using (
          bucket_id = 'matter-documents'
          and public.is_enabled_member()
        );

      drop policy if exists matter_documents_delete on storage.objects;
      create policy matter_documents_delete
        on storage.objects for delete to authenticated
        using (
          bucket_id = 'matter-documents'
          and public.is_enabled_member()
        );
    $pol$;
  end if;
exception when others then
  raise notice 'Storage bucket/policies skip: %', sqlerrm;
end $$;


-- ############################################################################
-- Source: supabase/migrations/20261123040000_fase5_admin_rls_notifications.sql
-- ############################################################################

-- Fase 5 — Admin, RLS por rol, notificaciones in-app
-- Aplicar DESPUÉS de 20261123030000_fase4_activity_docs_time.sql
--
-- Roles: admin | abogado | paralegal
-- Preferencia email_daily_digest queda preparada en false (sin envío automático en esta fase).

-- ---------------------------------------------------------------------------
-- Preferencias en members
-- ---------------------------------------------------------------------------

alter table public.members
  add column if not exists email_daily_digest boolean not null default false;

alter table public.members
  add column if not exists notify_in_app boolean not null default true;

comment on column public.members.email_daily_digest is
  'Preferencia preparada para resumen diario por correo (default off; envío no implementado en Fase 5).';
comment on column public.members.notify_in_app is
  'Recibir notificaciones in-app (default on).';

-- ---------------------------------------------------------------------------
-- Helpers de rol
-- ---------------------------------------------------------------------------

create or replace function public.current_member_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.members m
  where m.id = auth.uid()
    and m.enabled = true
  limit 1;
$$;

revoke all on function public.current_member_role() from public;
grant execute on function public.current_member_role() to authenticated;

create or replace function public.is_lawyer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.id = auth.uid()
      and m.enabled = true
      and m.role in ('admin', 'abogado')
  );
$$;

revoke all on function public.is_lawyer_or_admin() from public;
grant execute on function public.is_lawyer_or_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  title text not null,
  body text,
  href text,
  kind text not null default 'info'
    check (kind in (
      'info',
      'task_assigned',
      'task_comment',
      'matter_assigned',
      'system'
    )),
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_member_unread_idx
  on public.notifications (member_id, created_at desc)
  where read_at is null;

create index if not exists notifications_member_created_idx
  on public.notifications (member_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
  on public.notifications for select
  to authenticated
  using (member_id = auth.uid() and public.is_enabled_member());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
  on public.notifications for update
  to authenticated
  using (member_id = auth.uid() and public.is_enabled_member())
  with check (member_id = auth.uid() and public.is_enabled_member());

-- Inserts solo vía security definer (triggers / helper)
drop policy if exists notifications_insert_none on public.notifications;
create policy notifications_insert_none
  on public.notifications for insert
  to authenticated
  with check (false);

create or replace function public.notify_member(
  p_member_id uuid,
  p_title text,
  p_body text default null,
  p_href text default null,
  p_kind text default 'info',
  p_entity_type text default null,
  p_entity_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_in_app boolean;
begin
  if p_member_id is null then
    return;
  end if;

  select coalesce(notify_in_app, true)
    into v_in_app
  from public.members
  where id = p_member_id and enabled = true;

  if not coalesce(v_in_app, false) then
    return;
  end if;

  insert into public.notifications (
    member_id, title, body, href, kind, entity_type, entity_id
  ) values (
    p_member_id, p_title, p_body, p_href, coalesce(p_kind, 'info'),
    p_entity_type, p_entity_id
  );
end;
$$;

revoke all on function public.notify_member from public;
grant execute on function public.notify_member to authenticated;

-- Triggers: tareas
create or replace function public.trg_notify_tasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.assignee_id is distinct from new.created_by then
      perform public.notify_member(
        new.assignee_id,
        'Nueva tarea asignada',
        left(new.description, 160),
        '/asuntos/' || new.matter_id || '?tab=tareas',
        'task_assigned',
        'task',
        new.id
      );
    end if;
  elsif tg_op = 'UPDATE' then
    if new.assignee_id is distinct from old.assignee_id
       and new.assignee_id is distinct from auth.uid() then
      perform public.notify_member(
        new.assignee_id,
        'Tarea reasignada a ti',
        left(new.description, 160),
        '/asuntos/' || new.matter_id || '?tab=tareas',
        'task_assigned',
        'task',
        new.id
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_notify on public.tasks;
create trigger tasks_notify
  after insert or update on public.tasks
  for each row execute function public.trg_notify_tasks();

-- Triggers: comentarios de tarea
create or replace function public.trg_notify_task_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task record;
begin
  select id, matter_id, assignee_id, created_by, description
    into v_task
  from public.tasks
  where id = new.task_id;

  if not found then
    return new;
  end if;

  if v_task.assignee_id is not null
     and v_task.assignee_id is distinct from new.author_id then
    perform public.notify_member(
      v_task.assignee_id,
      'Comentario en tu tarea',
      left(new.body, 160),
      '/asuntos/' || v_task.matter_id || '?tab=tareas',
      'task_comment',
      'task',
      v_task.id
    );
  end if;

  if v_task.created_by is distinct from new.author_id
     and v_task.created_by is distinct from v_task.assignee_id then
    perform public.notify_member(
      v_task.created_by,
      'Comentario en tarea que creaste',
      left(new.body, 160),
      '/asuntos/' || v_task.matter_id || '?tab=tareas',
      'task_comment',
      'task',
      v_task.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists task_comments_notify on public.task_comments;
create trigger task_comments_notify
  after insert on public.task_comments
  for each row execute function public.trg_notify_task_comments();

-- Triggers: asunto — responsable
create or replace function public.trg_notify_matters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.responsible_lawyer_id is distinct from new.created_by then
      perform public.notify_member(
        new.responsible_lawyer_id,
        'Asunto asignado como responsable',
        coalesce(new.code || ' — ', '') || new.title,
        '/asuntos/' || new.id,
        'matter_assigned',
        'matter',
        new.id
      );
    end if;
  elsif tg_op = 'UPDATE'
        and new.responsible_lawyer_id is distinct from old.responsible_lawyer_id
        and new.responsible_lawyer_id is distinct from auth.uid() then
    perform public.notify_member(
      new.responsible_lawyer_id,
      'Eres el nuevo responsable del asunto',
      coalesce(new.code || ' — ', '') || new.title,
      '/asuntos/' || new.id,
      'matter_assigned',
      'matter',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists matters_notify on public.matters;
create trigger matters_notify
  after insert or update on public.matters
  for each row execute function public.trg_notify_matters();

-- ---------------------------------------------------------------------------
-- RLS por rol — clientes / asuntos (escritura abogado|admin; soft-delete admin)
-- ---------------------------------------------------------------------------

-- clients
drop policy if exists clients_insert_enabled on public.clients;
drop policy if exists clients_update_enabled on public.clients;
drop policy if exists clients_delete_admin on public.clients;

create policy clients_insert_lawyer_admin
  on public.clients for insert
  to authenticated
  with check (public.is_lawyer_or_admin() and created_by = auth.uid());

create policy clients_update_lawyer_admin
  on public.clients for update
  to authenticated
  using (
    public.is_lawyer_or_admin()
    and deleted_at is null
  )
  with check (
    public.is_admin_member()
    or (public.is_lawyer_or_admin() and deleted_at is null)
  );

create policy clients_soft_delete_admin
  on public.clients for update
  to authenticated
  using (public.is_admin_member())
  with check (public.is_admin_member());

-- matters
drop policy if exists matters_insert_enabled on public.matters;
drop policy if exists matters_update_enabled on public.matters;

create policy matters_insert_lawyer_admin
  on public.matters for insert
  to authenticated
  with check (public.is_lawyer_or_admin() and created_by = auth.uid());

create policy matters_update_lawyer_admin
  on public.matters for update
  to authenticated
  using (
    public.is_lawyer_or_admin()
    and deleted_at is null
  )
  with check (
    public.is_admin_member()
    or (public.is_lawyer_or_admin() and deleted_at is null)
  );

-- matter_team: solo abogado/admin gestiona equipo
drop policy if exists matter_team_insert_enabled on public.matter_team;
drop policy if exists matter_team_update_enabled on public.matter_team;
drop policy if exists matter_team_delete_enabled on public.matter_team;

create policy matter_team_insert_lawyer_admin
  on public.matter_team for insert
  to authenticated
  with check (public.is_lawyer_or_admin());

create policy matter_team_update_lawyer_admin
  on public.matter_team for update
  to authenticated
  using (public.is_lawyer_or_admin())
  with check (public.is_lawyer_or_admin());

create policy matter_team_delete_lawyer_admin
  on public.matter_team for delete
  to authenticated
  using (public.is_lawyer_or_admin());

-- client_contacts: abogado/admin escribe; paralegal solo lee
drop policy if exists client_contacts_insert_enabled on public.client_contacts;
drop policy if exists client_contacts_update_enabled on public.client_contacts;
drop policy if exists client_contacts_delete_enabled on public.client_contacts;

create policy client_contacts_insert_lawyer_admin
  on public.client_contacts for insert
  to authenticated
  with check (public.is_lawyer_or_admin());

create policy client_contacts_update_lawyer_admin
  on public.client_contacts for update
  to authenticated
  using (public.is_lawyer_or_admin())
  with check (public.is_lawyer_or_admin());

create policy client_contacts_delete_lawyer_admin
  on public.client_contacts for delete
  to authenticated
  using (public.is_lawyer_or_admin());

-- task_templates: escritura abogado|admin (SELECT sigue en policy select_enabled)
drop policy if exists task_templates_write_enabled on public.task_templates;

create policy task_templates_insert_lawyer_admin
  on public.task_templates for insert
  to authenticated
  with check (public.is_lawyer_or_admin());

create policy task_templates_update_lawyer_admin
  on public.task_templates for update
  to authenticated
  using (public.is_lawyer_or_admin())
  with check (public.is_lawyer_or_admin());

create policy task_templates_delete_lawyer_admin
  on public.task_templates for delete
  to authenticated
  using (public.is_lawyer_or_admin());

-- documents soft-delete / upload: todos los roles operativos pueden; ya covered
-- time_entries: paralegal ok (own)

-- Members: preferencias propias (email_daily_digest / notify_in_app)
drop policy if exists members_update_self_prefs on public.members;
create policy members_update_self_prefs
  on public.members for update
  to authenticated
  using (id = auth.uid() and public.is_enabled_member())
  with check (id = auth.uid() and public.is_enabled_member());

-- Impedir que un miembro no-admin se cambie rol / enabled / email
create or replace function public.trg_members_protect_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin_member() then
    new.role := old.role;
    new.enabled := old.enabled;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

drop trigger if exists members_protect_fields on public.members;
create trigger members_protect_fields
  before update on public.members
  for each row execute function public.trg_members_protect_fields();

-- Nota: políticas UPDATE se combinan con OR (self-prefs o admin).


-- ############################################################################
-- Source: supabase/migrations/20261123120000_fix_festivos_areas_protect.sql
-- ############################################################################

-- Fix post Fase 5 — festivos 2027, áreas de la firma, protect members
-- Aplicar DESPUÉS de 20261123040000_fase5_admin_rls_notifications.sql
-- Seguro para quien ya aplicó migraciones 2–5.

-- ---------------------------------------------------------------------------
-- 1) Festivos móviles 2027 (orden evita choque UNIQUE(day))
-- ---------------------------------------------------------------------------

update public.non_business_days
set day = '2027-05-10',
    notes = coalesce(notes, '') || ' · corregido Ascensión 2027'
where name = 'Ascensión del Señor'
  and day = '2027-05-17';

update public.non_business_days
set day = '2027-05-31',
    notes = coalesce(notes, '') || ' · corregido Corpus 2027'
where name = 'Corpus Christi'
  and day = '2027-06-07';

update public.non_business_days
set day = '2027-06-07',
    notes = coalesce(notes, '') || ' · corregido Sagrado Corazón 2027'
where name = 'Sagrado Corazón'
  and day = '2027-06-14';

-- ---------------------------------------------------------------------------
-- 2) trg_members_protect_fields: no bloquear si auth.uid() is null (service_role)
-- ---------------------------------------------------------------------------

create or replace function public.trg_members_protect_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin_member() then
    new.role := old.role;
    new.enabled := old.enabled;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) matters.area alineado a la firma
-- ---------------------------------------------------------------------------

alter table public.matters drop constraint if exists matters_area_check;

-- Remap de valores legacy → catálogo firma
update public.matters
set area = case area
  when 'civil' then 'responsabilidad_seguros'
  when 'laboral' then 'empresa'
  when 'comercial' then 'comercial'
  when 'penal' then 'otro'
  when 'familia' then 'otro'
  when 'administrativo' then 'consumidor'
  when 'tributario' then 'tributario'
  when 'otros' then 'otro'
  when 'responsabilidad_seguros' then 'responsabilidad_seguros'
  when 'empresa' then 'empresa'
  when 'consumidor' then 'consumidor'
  when 'insolvencia' then 'insolvencia'
  when 'societario' then 'societario'
  when 'otro' then 'otro'
  else 'otro'
end;

update public.task_templates
set area = case area
  when 'civil' then 'responsabilidad_seguros'
  when 'laboral' then 'empresa'
  when 'comercial' then 'comercial'
  when 'penal' then 'otro'
  when 'familia' then 'otro'
  when 'administrativo' then 'consumidor'
  when 'tributario' then 'tributario'
  when 'otros' then 'otro'
  else area
end
where area is not null;

alter table public.matters
  alter column area set default 'comercial';

alter table public.matters
  add constraint matters_area_check check (
    area in (
      'responsabilidad_seguros',
      'empresa',
      'consumidor',
      'insolvencia',
      'comercial',
      'tributario',
      'societario',
      'otro'
    )
  );


-- ############################################################################
-- Source: supabase/migrations/20261123140000_prelanzamiento_stages.sql
-- ############################################################################

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


-- ############################################################################
-- Source: supabase/migrations/20261123150000_etapas_acordadas.sql
-- ############################################################################

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


-- ############################################################################
-- Source: supabase/migrations/20261123160000_matters_stage_default_trigger.sql
-- ############################################################################

-- Quitar default fijo 'ingreso' y resolver etapa en INSERT vía catálogo enabled.
-- Aplicar DESPUÉS de 20261123150000_etapas_acordadas.sql
-- No inventa etapas: solo lee matter_stage_defs (enabled + sort_order).

-- ---------------------------------------------------------------------------
-- 1) Sin default fijo en matters.stage
-- ---------------------------------------------------------------------------

alter table public.matters
  alter column stage drop default;

-- ---------------------------------------------------------------------------
-- 2) BEFORE INSERT: null → primera enabled; invalid/disabled → EXCEPTION
-- ---------------------------------------------------------------------------

create or replace function public.trg_matters_stage_default()
returns trigger
language plpgsql
as $$
declare
  v_stage text;
begin
  if new.stage is null or btrim(new.stage) = '' then
    select d.stage_key
      into v_stage
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.enabled
    order by d.sort_order
    limit 1;

    if v_stage is null then
      raise exception
        'No hay etapas habilitadas para el tipo de asunto «%».',
        new.matter_type;
    end if;

    new.stage := v_stage;
  else
    if not exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = new.matter_type
        and d.stage_key = new.stage
        and d.enabled
    ) then
      raise exception
        'La etapa «%» no existe o está deshabilitada para el tipo «%».',
        new.stage,
        new.matter_type;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists matters_stage_default_bi on public.matters;
create trigger matters_stage_default_bi
  before insert on public.matters
  for each row
  execute function public.trg_matters_stage_default();

comment on function public.trg_matters_stage_default() is
  'BEFORE INSERT: stage null → primera matter_stage_defs.enabled del tipo; si stage viene y está disabled/ausente → RAISE.';

-- ---------------------------------------------------------------------------
-- 3) Remap residual: asuntos aún en etapa disabled o inexistente
--    → enabled con sort_order más cercano; si no hay cur, primera enabled.
-- ---------------------------------------------------------------------------

update public.matters m
set stage = coalesce(
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
  (
    select d.stage_key
    from public.matter_stage_defs d
    where d.matter_type = m.matter_type
      and d.enabled
    order by d.sort_order
    limit 1
  )
)
where m.deleted_at is null
  and (
    not exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = m.matter_type
        and d.stage_key = m.stage
    )
    or exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = m.matter_type
        and d.stage_key = m.stage
        and not d.enabled
    )
  );


-- ############################################################################
-- Source: supabase/migrations/20261123170000_matters_stage_update_trigger.sql
-- ############################################################################

-- Extiende trg_matters_stage_default a BEFORE UPDATE OF stage, matter_type.
-- Aplicar DESPUÉS de 20261123160000_matters_stage_default_trigger.sql
-- No inventa etapas: solo matter_stage_defs.
--
-- Reglas:
--   INSERT (igual que 160000):
--     - stage null/vacío → primera enabled del matter_type
--     - stage presente → debe existir y enabled; si no → RAISE
--   UPDATE OF stage, matter_type:
--     - stage null/vacío → primera enabled del nuevo matter_type
--     - stage sin cambio (OLD.stage IS NOT DISTINCT FROM NEW.stage):
--         · si enabled para NEW.matter_type → OK
--         · si matter_type NO cambió y stage disabled → PERMITIR (grandfather)
--         · si matter_type cambió y stage inválido/disabled para el nuevo tipo
--           → REMAP a etapa enabled del nuevo tipo (sort_order más cercano
--             al de la etapa en el tipo anterior; si no, primera enabled)
--     - stage cambió (usuario eligió otra):
--         · debe existir y enabled para NEW.matter_type; si no → RAISE

create or replace function public.trg_matters_stage_default()
returns trigger
language plpgsql
as $$
declare
  v_stage text;
  v_enabled boolean;
begin
  if new.stage is not null and btrim(new.stage) = '' then
    new.stage := null;
  end if;

  -- Resolver null / vacío → primera enabled
  if new.stage is null then
    select d.stage_key
      into v_stage
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.enabled
    order by d.sort_order
    limit 1;

    if v_stage is null then
      raise exception
        'No hay etapas habilitadas para el tipo de asunto «%».',
        new.matter_type;
    end if;

    new.stage := v_stage;
    return new;
  end if;

  select exists (
    select 1
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
      and d.enabled
  )
  into v_enabled;

  if TG_OP = 'UPDATE'
     and old.stage is not distinct from new.stage then
    -- Stage sin cambio
    if v_enabled then
      return new;
    end if;

    if old.matter_type is not distinct from new.matter_type then
      -- Mismo tipo + etapa disabled: permitir (no forzar remap en updates)
      return new;
    end if;

    -- Tipo cambió y la etapa quedó inválida/disabled → remap
    select d2.stage_key
      into v_stage
    from public.matter_stage_defs cur
    join public.matter_stage_defs d2
      on d2.matter_type = new.matter_type
     and d2.enabled
    where cur.matter_type = old.matter_type
      and cur.stage_key = old.stage
    order by abs(d2.sort_order - cur.sort_order), d2.sort_order
    limit 1;

    if v_stage is null then
      select d.stage_key
        into v_stage
      from public.matter_stage_defs d
      where d.matter_type = new.matter_type
        and d.enabled
      order by d.sort_order
      limit 1;
    end if;

    if v_stage is null then
      raise exception
        'No hay etapas habilitadas para el tipo de asunto «%».',
        new.matter_type;
    end if;

    new.stage := v_stage;
    return new;
  end if;

  -- INSERT, o UPDATE con stage distinto: exigir enabled
  if not v_enabled then
    raise exception
      'La etapa «%» no existe o está deshabilitada para el tipo «%».',
      new.stage,
      new.matter_type;
  end if;

  return new;
end;
$$;

drop trigger if exists matters_stage_default_bi on public.matters;
create trigger matters_stage_default_bi
  before insert on public.matters
  for each row
  execute function public.trg_matters_stage_default();

drop trigger if exists matters_stage_default_bu on public.matters;
create trigger matters_stage_default_bu
  before update of stage, matter_type on public.matters
  for each row
  execute function public.trg_matters_stage_default();

comment on function public.trg_matters_stage_default() is
  'BEFORE INSERT/UPDATE(stage,matter_type): null→primera enabled; stage sin cambio+disabled permitido si tipo igual; tipo cambia→remap; stage nuevo→debe estar enabled.';


-- ############################################################################
-- Source: supabase/migrations/20261123180000_prelanzamiento_bc.sql
-- ############################################################################

-- Prelanzamiento B/C: nombre comercial, modalidad honorarios, rango no hábil.
-- NO modifica migraciones 000000–170000.

alter table public.clients
  add column if not exists trade_name text;

comment on column public.clients.trade_name is
  'Nombre comercial opcional (distinto de la razón social / name).';

alter table public.matters
  add column if not exists fee_modality text
    check (
      fee_modality is null
      or fee_modality in ('fijo', 'por_etapa', 'cuota_litis', 'por_horas')
    );

comment on column public.matters.fee_modality is
  'Modalidad de honorarios: fijo | por_etapa | cuota_litis | por_horas.';

alter table public.non_business_days
  add column if not exists ends_on date;

comment on column public.non_business_days.ends_on is
  'Fin inclusivo del rango (vacancia colectiva u otro). NULL = solo el día.';

-- Aceptar kind vacancia_judicial
alter table public.non_business_days
  drop constraint if exists non_business_days_kind_check;

alter table public.non_business_days
  add constraint non_business_days_kind_check check (
    kind in (
      'festivo_nacional',
      'festivo_religioso',
      'puente',
      'vacancia_judicial',
      'otro'
    )
  );


-- ############################################################################
-- Source: supabase/migrations/20261123190000_activity_stage_labels.sql
-- ############################################################################

-- Activity log: etiquetas de etapa (no claves) en el resumen.
-- NO modifica migraciones 000000–180000.

create or replace function public.trg_log_matters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_stage_label text;
  v_new_stage_label text;
  v_old_status_label text;
  v_new_status_label text;
begin
  if tg_op = 'INSERT' then
    select d.label into v_new_stage_label
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
    limit 1;

    perform public.write_activity_log(
      new.id, new.client_id, new.created_by, 'matter', new.id, 'created',
      'Asunto creado: ' || coalesce(new.code, '') || ' — ' || new.title,
      jsonb_build_object(
        'code', new.code,
        'status', new.status,
        'stage', new.stage,
        'stage_label', coalesce(v_new_stage_label, new.stage)
      )
    );
  elsif tg_op = 'UPDATE' then
    select d.label into v_old_stage_label
    from public.matter_stage_defs d
    where d.matter_type = old.matter_type
      and d.stage_key = old.stage
    limit 1;

    select d.label into v_new_stage_label
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
    limit 1;

    v_old_status_label := case old.status
      when 'abierto' then 'Abierto'
      when 'en_pausa' then 'En pausa'
      when 'cerrado' then 'Cerrado'
      when 'archivado' then 'Archivado'
      else old.status
    end;
    v_new_status_label := case new.status
      when 'abierto' then 'Abierto'
      when 'en_pausa' then 'En pausa'
      when 'cerrado' then 'Cerrado'
      when 'archivado' then 'Archivado'
      else new.status
    end;

    perform public.write_activity_log(
      new.id, new.client_id, auth.uid(), 'matter', new.id, 'updated',
      'Asunto actualizado: ' || coalesce(new.code, '') ||
        case when old.status is distinct from new.status
          then ' (estado ' || v_old_status_label || ' → ' || v_new_status_label || ')'
          else '' end ||
        case when old.stage is distinct from new.stage
          then ' (etapa ' || coalesce(v_old_stage_label, old.stage)
            || ' → ' || coalesce(v_new_stage_label, new.stage) || ')'
          else '' end,
      jsonb_build_object(
        'status', new.status,
        'stage', new.stage,
        'old_status', old.status,
        'old_stage', old.stage,
        'stage_label', coalesce(v_new_stage_label, new.stage),
        'old_stage_label', coalesce(v_old_stage_label, old.stage)
      )
    );
  end if;
  return new;
end;
$$;


-- ############################################################################
-- Verificación post-bootstrap (ejecutar y revisar resultados)
-- ############################################################################

-- Tablas públicas esperadas
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by 1;

-- RLS activado en tablas públicas
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- Nº de policies
select schemaname, tablename, count(*) as policies
from pg_policies
where schemaname = 'public'
group by 1, 2
order by 1, 2;

select count(*) as total_policies from pg_policies where schemaname = 'public';

-- Triggers en public
select event_object_table as table_name, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
order by 1, 2;

-- Etapas habilitadas por tipo
select matter_type, count(*) as etapas_enabled
from public.matter_stage_defs
where enabled
group by matter_type
order by 1;

-- Bucket matter-documents privado
select id, name, public
from storage.buckets
where id = 'matter-documents';

