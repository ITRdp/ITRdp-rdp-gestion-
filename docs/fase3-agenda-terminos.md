# Fase 3 — Agenda, términos hábiles y tareas

## Migración

Aplicar **después** de Fase 2:

`supabase/migrations/20261123020000_fase3_agenda_tasks.sql`

Crea:

- `non_business_days` + seed festivos **2026–2027** (marcados para validación del despacho)
- `events` (agenda)
- Ampliación de `tasks` (prioridad, checklist JSON, `due_business_date`, estado `en_curso`)
- `task_comments` (menciones `@Nombre`)
- `task_templates` (+ 3 plantillas demo si hay members)

Solo admin escribe en `non_business_days`. RLS en el resto para miembros habilitados.

## Días hábiles CO

Lógica en `src/lib/business-days.ts`:

- Excluye sábados y domingos
- Excluye fechas de `non_business_days`
- Helpers: `isBusinessDay`, `addBusinessDays`, `businessDaysBetween`, `businessDaysUntil`

## Semáforo

`src/lib/semaforo.ts` (días hábiles hasta la fecha):

| Nivel | Criterio |
|---|---|
| Verde | > 5 hábiles |
| Amarillo | 2–5 |
| Rojo | ≤ 1 o vencido |

Usado en Mi jornada y ficha de asunto (seguimiento / vencimiento procesal).

## UI

- `/agenda` — vistas mes / semana / lista + alta de eventos
- `/` Mi jornada — tareas con semáforo, checklist, eventos 7 días, plazos procesales
- Ficha asunto — pestaña Agenda con eventos del asunto; tareas con plantillas, estados, checklist y comentarios

## Validación de festivos

El seed es aproximado (Ley Emiliani / calendario típico). **Revisar y editar** en `/admin` (Días no hábiles) o SQL antes de producción.

Corrección Ascensión / Corpus / Sagrado Corazón **2027**: seed Fase 3 actualizado + migración `20261123120000_fix_festivos_areas_protect.sql` para bases ya aplicadas.
