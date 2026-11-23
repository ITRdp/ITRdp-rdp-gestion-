-- Fix post Fase 5 — festivos 2027, áreas de la firma, protect members
-- Aplicar DESPUÉS de 20261123040000_fase5_admin_rls_notifications.sql
-- Seguro para quien ya aplicó migraciones 2–5.

-- ---------------------------------------------------------------------------
-- 1) Festivos móviles 2027 (orden evita choque UNIQUE(day))
-- ---------------------------------------------------------------------------

update public.non_business_days
set day = '2027-05-10',
    notes = coalesce(notes, '') || ' · corregido Ascensión 2027'
where name = 'Ascensión del Señor'
  and day = '2027-05-17';

update public.non_business_days
set day = '2027-05-31',
    notes = coalesce(notes, '') || ' · corregido Corpus 2027'
where name = 'Corpus Christi'
  and day = '2027-06-07';

update public.non_business_days
set day = '2027-06-07',
    notes = coalesce(notes, '') || ' · corregido Sagrado Corazón 2027'
where name = 'Sagrado Corazón'
  and day = '2027-06-14';

-- ---------------------------------------------------------------------------
-- 2) trg_members_protect_fields: no bloquear si auth.uid() is null (service_role)
-- ---------------------------------------------------------------------------

create or replace function public.trg_members_protect_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin_member() then
    new.role := old.role;
    new.enabled := old.enabled;
    new.email := old.email;
    new.id := old.id;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) matters.area alineado a la firma
-- ---------------------------------------------------------------------------

alter table public.matters drop constraint if exists matters_area_check;

-- Remap de valores legacy → catálogo firma
update public.matters
set area = case area
  when 'civil' then 'responsabilidad_seguros'
  when 'laboral' then 'empresa'
  when 'comercial' then 'comercial'
  when 'penal' then 'otro'
  when 'familia' then 'otro'
  when 'administrativo' then 'consumidor'
  when 'tributario' then 'tributario'
  when 'otros' then 'otro'
  when 'responsabilidad_seguros' then 'responsabilidad_seguros'
  when 'empresa' then 'empresa'
  when 'consumidor' then 'consumidor'
  when 'insolvencia' then 'insolvencia'
  when 'societario' then 'societario'
  when 'otro' then 'otro'
  else 'otro'
end;

update public.task_templates
set area = case area
  when 'civil' then 'responsabilidad_seguros'
  when 'laboral' then 'empresa'
  when 'comercial' then 'comercial'
  when 'penal' then 'otro'
  when 'familia' then 'otro'
  when 'administrativo' then 'consumidor'
  when 'tributario' then 'tributario'
  when 'otros' then 'otro'
  else area
end
where area is not null;

alter table public.matters
  alter column area set default 'comercial';

alter table public.matters
  add constraint matters_area_check check (
    area in (
      'responsabilidad_seguros',
      'empresa',
      'consumidor',
      'insolvencia',
      'comercial',
      'tributario',
      'societario',
      'otro'
    )
  );
