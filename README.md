# RDP Gestión

Aplicación interna del despacho para gestionar **clientes**, **asuntos**, **actuaciones** (con enlace OneDrive opcional) y **tareas** con fecha de seguimiento. Interfaz en español.

Stack: **Next.js (App Router) + TypeScript + Supabase** (Auth, Postgres, RLS).

No hay registro público ni portal de clientes. Solo miembros con `members.enabled = true` pueden entrar.

## Distinciones importantes

| Concepto | Campo | Significado |
|---|---|---|
| Abogado responsable del asunto | `matters.responsible_lawyer_id` | Titular del encargo |
| Encargado de la tarea | `tasks.assignee_id` | Quién debe ejecutar el seguimiento |
| Vencimiento procesal | `matters.procedural_deadline` | Plazo judicial/administrativo |
| Fecha de seguimiento | `tasks.follow_up_date` | Recordatorio interno de la tarea |

## Requisitos

- Node.js 20+
- Cuenta y proyecto en [Supabase](https://supabase.com)

## 1. Conectar Supabase

1. Crea un proyecto en Supabase.
2. En **Settings → API** copia:
   - Project URL
   - `anon` `public` key
   - `service_role` key (solo servidor; no la expongas al navegador)
3. En la raíz del repo:

```bash
cp .env.example .env.local
```

4. Rellena `.env.local` con tus valores (nunca commits de secretos reales):

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

5. En **Authentication → Providers**, deja **Email** activado.
6. En **Authentication → URL Configuration**, añade `http://localhost:3000` como Site URL (y Redirect URLs si usas callbacks).
7. Desactiva el registro público si tu plan/UI lo permite (**Authentication → Providers → Email → Disable sign ups**). La app no ofrece pantalla de alta; el middleware y `members.enabled` hacen de puerta.

## 2. Aplicar la migración SQL

1. Abre **SQL Editor** en Supabase.
2. Pega y ejecuta el contenido de:

`supabase/migrations/20261123000000_initial_schema.sql`

Eso crea las tablas `members`, `clients`, `matters`, `actuaciones`, `tasks`, índices, funciones RLS y políticas. Solo miembros habilitados leen/escriben datos del despacho.

## 3. Crear y habilitar 3 usuarios de prueba

En **Authentication → Users → Add user** crea tres cuentas (email + password), por ejemplo:

| Correo | Nombre sugerido | Rol |
|---|---|---|
| `abogado1@despacho.local` | Ana Ruiz | admin |
| `abogado2@despacho.local` | Luis Martín | abogado |
| `paralegal@despacho.local` | María López | paralegal |

Copia el **UUID** de cada usuario y, en el SQL Editor, ejecuta (sustituyendo los UUID):

```sql
insert into public.members (id, email, full_name, role, enabled) values
  ('UUID-DE-ANA', 'abogado1@despacho.local', 'Ana Ruiz', 'admin', true),
  ('UUID-DE-LUIS', 'abogado2@despacho.local', 'Luis Martín', 'abogado', true),
  ('UUID-DE-MARIA', 'paralegal@despacho.local', 'María López', 'paralegal', true);
```

Sin fila en `members` con `enabled = true`, el login falla aunque Auth acepte la contraseña.

### Flujo de prueba recomendado

1. Entra como **Ana** → **Asuntos** → crea cliente + asunto (Ana como responsable).
2. Entra como **Luis** → abre el asunto → registra una actuación (enlace OneDrive opcional).
3. Desde el mismo asunto, Luis asigna una tarea a **María** con fecha de seguimiento.
4. Entra como **María** → **Mi jornada** → completa la tarea.
5. Vuelve al asunto: verás quién registró la actuación, quién completó la tarea y cuándo.

## 4. Arrancar desde la terminal

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Serás redirigido a `/login`.

Pantallas:

- `/login` — Acceso
- `/` o `/jornada` — Mi jornada
- `/asuntos` — Listado y alta
- `/asuntos/[id]` — Ficha del asunto (actuaciones, tareas, auditoría)

## Seguridad

- RLS en todas las tablas; helper `is_enabled_member()`.
- Middleware comprueba sesión y `members.enabled`.
- `SUPABASE_SERVICE_ROLE_KEY` solo en servidor (véase `src/lib/supabase/server.ts`).
- `.env*` ignorado en git excepto `.env.example`.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build de producción |
| `npm run start` | Servir build |
| `npm run lint` | ESLint |

## Estructura relevante

```
src/app/                 # Rutas y Server Actions
src/components/          # Formularios y navegación
src/lib/supabase/        # Clientes browser / server / middleware
supabase/migrations/     # Schema + RLS
.env.example             # Nombres de variables (sin secretos)
docs/setup-supabase.md   # Misma guía de puesta en marcha
```
