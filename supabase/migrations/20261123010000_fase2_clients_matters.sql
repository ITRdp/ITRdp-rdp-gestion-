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
