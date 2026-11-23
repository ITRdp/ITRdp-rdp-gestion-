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

## 2. Aplicar la migración

En **SQL Editor**, ejecuta íntegramente:

`supabase/migrations/20261123000000_initial_schema.sql`

Crea tablas, índices, helpers RLS (`is_enabled_member`, `is_admin_member`) y políticas. Solo miembros con `enabled = true` operan sobre los datos del despacho.

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

Rutas: `/` (Mi jornada), `/asuntos`, `/asuntos/[id]`.

## Notas

- Distinguir **abogado responsable del asunto** (`responsible_lawyer_id`) del **encargado de tarea** (`assignee_id`).
- Distinguir **vencimiento procesal** (`procedural_deadline`) de **fecha de seguimiento** (`follow_up_date`).
- Sin portal de clientes ni registro público.
