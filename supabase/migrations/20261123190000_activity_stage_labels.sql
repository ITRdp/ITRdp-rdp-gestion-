-- Activity log: etiquetas de etapa (no claves) en el resumen.
-- NO modifica migraciones 000000–180000.

create or replace function public.trg_log_matters()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_stage_label text;
  v_new_stage_label text;
  v_old_status_label text;
  v_new_status_label text;
begin
  if tg_op = 'INSERT' then
    select d.label into v_new_stage_label
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
    limit 1;

    perform public.write_activity_log(
      new.id, new.client_id, new.created_by, 'matter', new.id, 'created',
      'Asunto creado: ' || coalesce(new.code, '') || ' — ' || new.title,
      jsonb_build_object(
        'code', new.code,
        'status', new.status,
        'stage', new.stage,
        'stage_label', coalesce(v_new_stage_label, new.stage)
      )
    );
  elsif tg_op = 'UPDATE' then
    select d.label into v_old_stage_label
    from public.matter_stage_defs d
    where d.matter_type = old.matter_type
      and d.stage_key = old.stage
    limit 1;

    select d.label into v_new_stage_label
    from public.matter_stage_defs d
    where d.matter_type = new.matter_type
      and d.stage_key = new.stage
    limit 1;

    v_old_status_label := case old.status
      when 'abierto' then 'Abierto'
      when 'en_pausa' then 'En pausa'
      when 'cerrado' then 'Cerrado'
      when 'archivado' then 'Archivado'
      else old.status
    end;
    v_new_status_label := case new.status
      when 'abierto' then 'Abierto'
      when 'en_pausa' then 'En pausa'
      when 'cerrado' then 'Cerrado'
      when 'archivado' then 'Archivado'
      else new.status
    end;

    perform public.write_activity_log(
      new.id, new.client_id, auth.uid(), 'matter', new.id, 'updated',
      'Asunto actualizado: ' || coalesce(new.code, '') ||
        case when old.status is distinct from new.status
          then ' (estado ' || v_old_status_label || ' → ' || v_new_status_label || ')'
          else '' end ||
        case when old.stage is distinct from new.stage
          then ' (etapa ' || coalesce(v_old_stage_label, old.stage)
            || ' → ' || coalesce(v_new_stage_label, new.stage) || ')'
          else '' end,
      jsonb_build_object(
        'status', new.status,
        'stage', new.stage,
        'old_status', old.status,
        'old_stage', old.stage,
        'stage_label', coalesce(v_new_stage_label, new.stage),
        'old_stage_label', coalesce(v_old_stage_label, old.stage)
      )
    );
  end if;
  return new;
end;
$$;
