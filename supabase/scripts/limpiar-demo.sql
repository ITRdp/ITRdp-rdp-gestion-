-- Limpia datos de demostración / prueba.
-- NO ejecutar en producción con datos reales sin respaldo.
-- Orden: dependencias → miembros demo Auth deben borrarse aparte en Dashboard.

begin;

-- Notificaciones / tiempo / documentos / actividad
delete from public.notifications;
delete from public.time_entries;
delete from public.documents;
delete from public.activity_log;

-- Tareas y eventos
delete from public.task_comments;
delete from public.tasks;
delete from public.events;

-- Actuaciones y equipo
delete from public.actuaciones;
delete from public.matter_team;

-- Asuntos y clientes
update public.matters set deleted_at = now() where deleted_at is null;
delete from public.matters; -- hard delete demo
delete from public.client_contacts;
delete from public.clients;

-- Plantillas demo
delete from public.task_templates;

-- Miembros con correo de prueba (el Auth user hay que borrarlo en Authentication → Users)
delete from public.members
where email like '%@despacho.local'
   or email like '%@despacho.co' and email in (
     'ana.ruiz@despacho.co',
     'luis.martin@despacho.co',
     'maria.lopez@despacho.co',
     'abogado1@despacho.local',
     'abogado2@despacho.local',
     'paralegal@despacho.local'
   );

commit;

-- Primer admin real (después de crear el usuario en Auth → Users):
-- insert into public.members (id, email, full_name, role, enabled, must_change_password)
-- values ('UUID-AUTH', 'tu@rdpabogados.com', 'Nombre Apellido', 'admin', true, false);
