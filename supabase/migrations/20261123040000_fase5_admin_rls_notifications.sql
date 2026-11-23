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
  if not public.is_admin_member() then
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
