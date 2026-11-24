-- RDP Gestión — perfiles iniciales de producción
-- Prerrequisito: los tres usuarios ya existen en Authentication (auth.users)
-- con el mismo email. Crearlos en Dashboard → Authentication → Users
-- (o Admin API) y luego ejecutar este script.
--
-- Correos:
--   rojas.rivaldo@rdpabogados.com   → Rivaldo Rojas (admin)
--   depaz.alejandro@rdpabogados.com → Alejandro de Paz (abogado)
--   depaz.armando@rdpabogados.com   → Armando de Paz (abogado)

insert into public.members (
  id,
  email,
  full_name,
  role,
  enabled,
  must_change_password
)
select
  u.id,
  lower(u.email),
  v.full_name,
  v.role,
  true,
  true
from (
  values
    ('rojas.rivaldo@rdpabogados.com', 'Rivaldo Rojas', 'admin'),
    ('depaz.alejandro@rdpabogados.com', 'Alejandro de Paz', 'abogado'),
    ('depaz.armando@rdpabogados.com', 'Armando de Paz', 'abogado')
) as v(email, full_name, role)
join auth.users u on lower(u.email) = lower(v.email)
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  role = excluded.role,
  enabled = true,
  must_change_password = true;

-- Verificación
select m.email, m.full_name, m.role, m.enabled, m.must_change_password
from public.members m
where m.email in (
  'rojas.rivaldo@rdpabogados.com',
  'depaz.alejandro@rdpabogados.com',
  'depaz.armando@rdpabogados.com'
)
order by m.email;
