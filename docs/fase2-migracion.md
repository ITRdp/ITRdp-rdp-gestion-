# Fase 2 — Cómo aplicar la migración

## Orden

1. Si aún no lo hiciste, aplica la v1:

`supabase/migrations/20261123000000_initial_schema.sql`

2. Luego aplica **Fase 2**:

`supabase/migrations/20261123010000_fase2_clients_matters.sql`

En el **SQL Editor** de Supabase (o `supabase db push` / `psql`), ejecuta el archivo completo.

## Qué hace

- Migra `clients.nif` → `document_type` + `document_number` (+ `document_dv`) **sin perder** el valor de `nif`.
- Amplía clientes: `person_type`, ciudad/depto, dirección, notas, soft delete.
- Crea `client_contacts` (contactos múltiples) con RLS.
- Amplía `matters`: código `RDP-YYYY-####`, área, tipo, etapa, prioridad, contraparte, radicado, despacho, ciudad, cuantía/honorarios COP, fechas, soft delete.
- Crea `matter_team` y función `next_matter_code()`.
- Asigna códigos a asuntos existentes y amplía `status` con `en_pausa`.
- Políticas: soft-delete de clientes/asuntos solo `admin`.

## Verificación rápida

```sql
-- nif ya no existe
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'clients'
  and column_name in ('nif', 'document_number', 'document_type');

-- códigos asignados
select code, title from public.matters order by code limit 20;

-- función de código
select public.next_matter_code();
```

## App

Tras migrar, reinicia `npm run dev`. Rutas nuevas: `/clientes`, `/clientes/[id]`. Asuntos con tabla/Kanban y ficha por pestañas.

Catálogos: `docs/fase2-catalogos.md`.
