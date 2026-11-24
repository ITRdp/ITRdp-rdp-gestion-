-- Quitar default fijo 'ingreso' y resolver etapa en INSERT vía catálogo enabled.
-- Aplicar DESPUÉS de 20261123150000_etapas_acordadas.sql
-- No inventa etapas: solo lee matter_stage_defs (enabled + sort_order).

-- ---------------------------------------------------------------------------
-- 1) Sin default fijo en matters.stage
-- ---------------------------------------------------------------------------

alter table public.matters
  alter column stage drop default;

-- ---------------------------------------------------------------------------
-- 2) BEFORE INSERT: null → primera enabled; invalid/disabled → EXCEPTION
-- ---------------------------------------------------------------------------

create or replace function public.trg_matters_stage_default()
returns trigger
language plpgsql
as $$
declare
  v_stage text;
begin
  if new.stage is null or btrim(new.stage) = '' then
    select d.stage_key
      into v_stage
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.enabled
    order by d.sort_order
    limit 1;

    if v_stage is null then
      raise exception
        'No hay etapas habilitadas para el tipo de asunto «%».',
        new.matter_type;
    end if;

    new.stage := v_stage;
  else
    if not exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = new.matter_type
        and d.stage_key = new.stage
        and d.enabled
    ) then
      raise exception
        'La etapa «%» no existe o está deshabilitada para el tipo «%».',
        new.stage,
        new.matter_type;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists matters_stage_default_bi on public.matters;
create trigger matters_stage_default_bi
  before insert on public.matters
  for each row
  execute function public.trg_matters_stage_default();

comment on function public.trg_matters_stage_default() is
  'BEFORE INSERT: stage null → primera matter_stage_defs.enabled del tipo; si stage viene y está disabled/ausente → RAISE.';

-- ---------------------------------------------------------------------------
-- 3) Remap residual: asuntos aún en etapa disabled o inexistente
--    → enabled con sort_order más cercano; si no hay cur, primera enabled.
-- ---------------------------------------------------------------------------

update public.matters m
set stage = coalesce(
  (
    select d2.stage_key
    from public.matter_stage_defs cur
    join public.matter_stage_defs d2
      on d2.matter_type = cur.matter_type
     and d2.enabled
    where cur.matter_type = m.matter_type
      and cur.stage_key = m.stage
    order by abs(d2.sort_order - cur.sort_order), d2.sort_order
    limit 1
  ),
  (
    select d.stage_key
    from public.matter_stage_defs d
    where d.matter_type = m.matter_type
      and d.enabled
    order by d.sort_order
    limit 1
  )
)
where m.deleted_at is null
  and (
    not exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = m.matter_type
        and d.stage_key = m.stage
    )
    or exists (
      select 1
      from public.matter_stage_defs d
      where d.matter_type = m.matter_type
        and d.stage_key = m.stage
        and not d.enabled
    )
  );
