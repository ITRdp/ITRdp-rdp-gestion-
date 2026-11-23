# Fase 5 — Administración, permisos y notificaciones

Migración: `supabase/migrations/20261123040000_fase5_admin_rls_notifications.sql` (después de Fase 4).

## Panel `/admin` (solo admin)

| Pestaña | Función |
|---|---|
| Miembros | Invitar/crear con `SUPABASE_SERVICE_ROLE_KEY` (server-only), cambiar rol, habilitar/deshabilitar |
| Días no hábiles | CRUD de `non_business_days` |
| Catálogos | Referencia de dominio (`src/lib/catalogs.ts`) |
| Preferencias | `notify_in_app` y `email_daily_digest` |

Preferencias también en `/ajustes` (cualquier miembro habilitado).

## RLS por rol

Helpers: `current_member_role()`, `is_lawyer_or_admin()` (+ existentes `is_admin_member` / `is_enabled_member`).

| Acción | admin | abogado | paralegal |
|---|---|---|---|
| Miembros / invitar | sí | — | — |
| Escribir festivos | sí | — | — |
| Crear/editar clientes y asuntos | sí | sí | lectura |
| Soft-delete clientes/asuntos | sí | — | — |
| Equipo del asunto / contactos | sí | sí | lectura |
| Tareas, actuaciones, eventos, docs, tiempo | sí | sí | sí |
| Plantillas de tarea (escritura) | sí | sí | lectura |

Trigger `members_protect_fields`: un no-admin no puede cambiarse `role`, `enabled` ni `email`.

## Notificaciones in-app

Tabla `notifications` + campana en AppShell.

Triggers:

- Tarea creada/reasignada → assignee
- Comentario en tarea → assignee y creador
- Asunto con responsable distinto → responsible_lawyer

Columnas en `members`:

- `notify_in_app` (default true)
- `email_daily_digest` (default **false**; envío no implementado)

## Fuera de alcance

Facturación, portal cliente, IA, integración Rama Judicial, envío real del digest email.
