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
