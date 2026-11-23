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
