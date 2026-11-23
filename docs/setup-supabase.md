# Puesta en marcha: Supabase + RDP Gestión

Guía exacta para conectar el proyecto, migrar el schema, habilitar tres usuarios de prueba y arrancar la app.

## 1. Conectar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En **Settings → API** copia Project URL, clave `anon` y clave `service_role`.
3. En la raíz del repositorio:

```bash
cp .env.example .env.local
```

4. Completa `.env.local` (sin subir secretos al repositorio):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

5. **Authentication → Providers**: Email activado; desactiva sign-ups públicos si está disponible.
6. **Authentication → URL Configuration**: Site URL `http://localhost:3000`.

## 2. Aplicar las migraciones

En **SQL Editor**, ejecuta **en orden**:

1. `supabase/migrations/20261123000000_initial_schema.sql` — v1 (tablas base + RLS)
2. `supabase/migrations/20261123010000_fase2_clients_matters.sql` — Fase 2 (clientes/asuntos ampliados)
3. `supabase/migrations/20261123020000_fase3_agenda_tasks.sql` — Fase 3 (agenda, festivos, tareas)
4. `supabase/migrations/20261123030000_fase4_activity_docs_time.sql` — Fase 4 (activity_log, documentos, tiempo)
5. `supabase/migrations/20261123040000_fase5_admin_rls_notifications.sql` — Fase 5 (admin, RLS por rol, notificaciones)
6. `supabase/migrations/20261123120000_fix_festivos_areas_protect.sql` — Fix post Fase 5 (festivos 2027, áreas firma, protect members)
7. `supabase/migrations/20261123140000_prelanzamiento_stages.sql` — Etapas por tipo + must_change_password
8. `supabase/migrations/20261123150000_etapas_acordadas.sql` — Mapa exacto (upsert, disable extras, remap)
9. `supabase/migrations/20261123160000_matters_stage_default_trigger.sql` — Default etapa vía trigger (primera enabled)
10. `supabase/migrations/20261123170000_matters_stage_update_trigger.sql` — Validación/remap en UPDATE de stage/tipo

Detalle: `docs/fase2-migracion.md`, `docs/fase2-catalogos.md`, `docs/fase3-agenda-terminos.md`, `docs/fase4-actividad-docs-tiempo.md`, `docs/fase5-admin-permisos-avisos.md`, `docs/produccion.md`. Solo miembros con `enabled = true` operan sobre los datos del despacho.

**Storage (Fase 4):** confirma el bucket privado `matter-documents` en Dashboard → Storage (o créalo a mano si el `DO` de la migración no corrió).

## 3. Tres usuarios de prueba

En **Authentication → Users → Add user** crea:

| Correo | Nombre | Rol en `members` |
|---|---|---|
| `abogado1@despacho.local` | Ana Ruiz | `admin` |
| `abogado2@despacho.local` | Luis Martín | `abogado` |
| `paralegal@despacho.local` | María López | `paralegal` |

Inserta sus perfiles (sustituye UUID):

```sql
insert into public.members (id, email, full_name, role, enabled) values
  ('UUID-DE-ANA', 'abogado1@despacho.local', 'Ana Ruiz', 'admin', true),
  ('UUID-DE-LUIS', 'abogado2@despacho.local', 'Luis Martín', 'abogado', true),
  ('UUID-DE-MARIA', 'paralegal@despacho.local', 'María López', 'paralegal', true);
```

### Recorrido funcional

1. Ana inicia sesión → crea cliente y asunto.
2. Luis abre el asunto → registra actuación (OneDrive opcional).
3. Luis asigna tarea a María con fecha de seguimiento.
4. María en **Mi jornada** completa la tarea.
5. Al reabrir el asunto se ve autor de la actuación, quién completó la tarea y cuándo.

## 4. Arrancar

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 → `/login`.

Rutas: `/` (Mi jornada), `/agenda`, `/asuntos`, `/asuntos/[id]`, `/clientes`, `/clientes/[id]`, `/reportes`, `/admin` (solo admin), `/ajustes`.

**Invitar miembros (Fase 5):** requiere `SUPABASE_SERVICE_ROLE_KEY` solo en servidor. Nunca la expongas al cliente.

## Notas

- Distinguir **abogado responsable del asunto** (`responsible_lawyer_id`) del **encargado de tarea** (`assignee_id`).
- Distinguir **vencimiento procesal** (`procedural_deadline`) de **fecha de seguimiento** (`follow_up_date`).
- Sin portal de clientes ni registro público.
