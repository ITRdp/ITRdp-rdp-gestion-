# Fase 4 — Actividad, documentos y tiempo

Migración: `supabase/migrations/20261123030000_fase4_activity_docs_time.sql` (después de Fase 3).

## Tablas

| Tabla | Uso |
|---|---|
| `activity_log` | Timeline inmutable de cambios (asuntos, actuaciones, tareas, eventos, documentos, tiempo) |
| `documents` | Metadatos: Storage (`storage_path`), OneDrive/enlace (`onedrive_url`) |
| `time_entries` | Cronómetro y carga manual; `duration_minutes` al cerrar |

## Triggers de actividad

- `matters` insert/update → created / updated (+ detalle de estado/etapa)
- `actuaciones` insert → actuación
- `tasks` insert / cambio de status
- `events` insert
- `documents` insert
- `time_entries` start / stop

Helper: `write_activity_log(...)` (security definer).

## Storage

1. Bucket privado **`matter-documents`** (la migración lo crea si existe el schema `storage`).
2. Políticas: SELECT/INSERT/UPDATE/DELETE para `authenticated` + `is_enabled_member()`.
3. Límite sugerido: 50 MB.
4. Si el bucket no está, la UI permite enlaces OneDrive/SharePoint.

## UI

- Pestaña **Actividad** del asunto: actuaciones + línea de tiempo `activity_log`.
- **Documentos**: enlace OneDrive o subida a Storage; archivar (soft delete).
- **Tiempo**: cronómetro (una sesión abierta por miembro), carga manual, historial.
- **`/reportes`**: KPIs operativos + export CSV (`/api/reportes/csv?kind=tiempo|asuntos|actividad`).

## RLS

Lectura/escritura acotada a miembros habilitados. Tiempo: insert propio; update/delete propio o admin.

## Fuera de alcance (Fase 5+)

Facturación avanzada, portal cliente, Microsoft Graph OAuth nativo, OCR, etc.
