-- Prelanzamiento B/C: nombre comercial, modalidad honorarios, rango no hábil.
-- NO modifica migraciones 000000–170000.

alter table public.clients
  add column if not exists trade_name text;

comment on column public.clients.trade_name is
  'Nombre comercial opcional (distinto de la razón social / name).';

alter table public.matters
  add column if not exists fee_modality text
    check (
      fee_modality is null
      or fee_modality in ('fijo', 'por_etapa', 'cuota_litis', 'por_horas')
    );

comment on column public.matters.fee_modality is
  'Modalidad de honorarios: fijo | por_etapa | cuota_litis | por_horas.';

alter table public.non_business_days
  add column if not exists ends_on date;

comment on column public.non_business_days.ends_on is
  'Fin inclusivo del rango (vacancia colectiva u otro). NULL = solo el día.';

-- Aceptar kind vacancia_judicial
alter table public.non_business_days
  drop constraint if exists non_business_days_kind_check;

alter table public.non_business_days
  add constraint non_business_days_kind_check check (
    kind in (
      'festivo_nacional',
      'festivo_religioso',
      'puente',
      'vacancia_judicial',
      'otro'
    )
  );
