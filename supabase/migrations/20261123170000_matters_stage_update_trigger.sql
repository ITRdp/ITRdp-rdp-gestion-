-- Extiende trg_matters_stage_default a BEFORE UPDATE OF stage, matter_type.
-- Aplicar DESPUÉS de 20261123160000_matters_stage_default_trigger.sql
-- No inventa etapas: solo matter_stage_defs.
--
-- Reglas:
--   INSERT (igual que 160000):
--     - stage null/vacío → primera enabled del matter_type
--     - stage presente → debe existir y enabled; si no → RAISE
--   UPDATE OF stage, matter_type:
--     - stage null/vacío → primera enabled del nuevo matter_type
--     - stage sin cambio (OLD.stage IS NOT DISTINCT FROM NEW.stage):
--         · si enabled para NEW.matter_type → OK
--         · si matter_type NO cambió y stage disabled → PERMITIR (grandfather)
--         · si matter_type cambió y stage inválido/disabled para el nuevo tipo
--           → REMAP a etapa enabled del nuevo tipo (sort_order más cercano
--             al de la etapa en el tipo anterior; si no, primera enabled)
--     - stage cambió (usuario eligió otra):
--         · debe existir y enabled para NEW.matter_type; si no → RAISE

create or replace function public.trg_matters_stage_default()
returns trigger
language plpgsql
as $$
declare
  v_stage text;
  v_enabled boolean;
begin
  if new.stage is not null and btrim(new.stage) = '' then
    new.stage := null;
  end if;

  -- Resolver null / vacío → primera enabled
  if new.stage is null then
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
    return new;
  end if;

  select exists (
    select 1
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
      and d.enabled
  )
  into v_enabled;

  if TG_OP = 'UPDATE'
     and old.stage is not distinct from new.stage then
    -- Stage sin cambio
    if v_enabled then
      return new;
    end if;

    if old.matter_type is not distinct from new.matter_type then
      -- Mismo tipo + etapa disabled: permitir (no forzar remap en updates)
      return new;
    end if;

    -- Tipo cambió y la etapa quedó inválida/disabled → remap
    select d2.stage_key
      into v_stage
    from public.matter_stage_defs cur
    join public.matter_stage_defs d2
      on d2.matter_type = new.matter_type
     and d2.enabled
    where cur.matter_type = old.matter_type
      and cur.stage_key = old.stage
    order by abs(d2.sort_order - cur.sort_order), d2.sort_order
    limit 1;

    if v_stage is null then
      select d.stage_key
        into v_stage
      from public.matter_stage_defs d
      where d.matter_type = new.matter_type
        and d.enabled
      order by d.sort_order
      limit 1;
    end if;

    if v_stage is null then
      raise exception
        'No hay etapas habilitadas para el tipo de asunto «%».',
        new.matter_type;
    end if;

    new.stage := v_stage;
    return new;
  end if;

  -- INSERT, o UPDATE con stage distinto: exigir enabled
  if not v_enabled then
    raise exception
      'La etapa «%» no existe o está deshabilitada para el tipo «%».',
      new.stage,
      new.matter_type;
  end if;

  return new;
end;
$$;

drop trigger if exists matters_stage_default_bi on public.matters;
create trigger matters_stage_default_bi
  before insert on public.matters
  for each row
  execute function public.trg_matters_stage_default();

drop trigger if exists matters_stage_default_bu on public.matters;
create trigger matters_stage_default_bu
  before update of stage, matter_type on public.matters
  for each row
  execute function public.trg_matters_stage_default();

comment on function public.trg_matters_stage_default() is
  'BEFORE INSERT/UPDATE(stage,matter_type): null→primera enabled; stage sin cambio+disabled permitido si tipo igual; tipo cambia→remap; stage nuevo→debe estar enabled.';
