# Despliegue a producción — RDP Gestión

App interna: **`https://gestion.rdpabogados.com`**.  
Producción sale de **`main`**. No reutilizar el proyecto Vercel de `www` / marketing.

## Orden de merge (PRs abiertas — no mergear desde este doc)

Stack actual:

1. **#15** (`cursor/prelanzamiento-bc-f000` → `release/v1`) — pulido B/C  
2. **Esta PR** (`cursor/deploy-produccion-f000` → `release/v1`) — bootstrap/prod/docs  
3. **#14** (`release/v1` → `main`) — release consolidado a main  

Orden recomendado:

1. Merge **#15** → `release/v1`  
2. Merge **deploy-produccion** → `release/v1` (tras #15, o rebase si hace falta)  
3. Merge **#14** → `main` (incluye el tip de `release/v1`)  
4. Desplegar Vercel Production desde `main`

## 1. Supabase (proyecto NUEVO de prod)

1. Crear proyecto separado (no uses `rdp-gestion-dev`). Región cercana a Colombia.  
2. Plan con backups (Pro+ recomendado; Free pausa inactivos y sin PITR).  
3. Aplicar schema:

```bash
# Opción A — un solo archivo
# SQL Editor → pegar supabase/prod/bootstrap.sql (000000→190000, sin plantillas demo)

# Opción B — migraciones una a una
# supabase/migrations/ en orden alfabético hasta 190000
```

4. Crear usuarios Auth (Dashboard → Authentication → Users) con contraseña temporal:

| Email | Nombre | Rol en members |
|---|---|---|
| `rojas.rivaldo@rdpabogados.com` | Rivaldo Rojas | admin |
| `depaz.alejandro@rdpabogados.com` | Alejandro de Paz | abogado |
| `depaz.armando@rdpabogados.com` | Armando de Paz | abogado |

5. Ejecutar `supabase/prod/members.sql` (une `auth.users` → `public.members`, `enabled=true`, `must_change_password=true`).  
6. Auth → URL Configuration:

- **Site URL:** `https://gestion.rdpabogados.com`  
- **Redirect URLs:**  
  - `https://gestion.rdpabogados.com/**`  
  - `https://gestion.rdpabogados.com/restablecer`  
  - `https://gestion.rdpabogados.com/primer-ingreso`

7. Auth → Emails: SMTP (sección 4) + plantillas ES en `supabase/prod/email-templates/`.  
8. Activar leaked password protection; MFA admin si el plan lo permite.  
9. Revisar al final de `bootstrap.sql` las queries de verificación (tablas, RLS, policies, triggers, etapas, bucket `matter-documents` privado).

## 2. Vercel — proyecto NUEVO

1. **New Project** desde este repo (no tocar el proyecto de `www.rdpabogados.com`).  
2. Framework: Next.js. Production branch: **`main`**.  
3. Variables **Production**:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (solo servidor) |
| `NEXT_PUBLIC_SITE_URL` | `https://gestion.rdpabogados.com` |
| `SENTRY_DSN` | opcional |

Preview/Development → proyecto Supabase **dev**.

4. Domains → Add → `gestion.rdpabogados.com`.  
5. Copia el registro DNS **exacto** que Vercel muestre (CNAME o A). **No asumas** `cname.vercel-dns.com`.

## 3. Namecheap — Advanced DNS

En el dominio `rdpabogados.com` → Advanced DNS:

| Tipo | Host | Valor | TTL |
|---|---|---|---|
| CNAME (o el que indique Vercel) | `gestion` | **pegar el valor del dashboard Vercel** | Automatic |

Espera propagación y verifica el dominio en Vercel (candado TLS).

## 4. Correo / SMTP

### Recomendación: **Microsoft 365 SMTP** (opción a)

El despacho ya usa Outlook/M365 (`spf.protection.outlook.com`). Usar el mismo stack evita un segundo remitente y mantiene un solo SPF.

1. Buzón dedicado p.ej. `noreply@rdpabogados.com` (o el que usen para sistema).  
2. En M365: habilitar **SMTP AUTH** solo para ese buzón.  
3. Supabase → Project Settings → Auth → SMTP:

| Campo | Valor |
|---|---|
| Host | `smtp.office365.com` |
| Port | `587` (STARTTLS) |
| User | correo del buzón |
| Pass | contraseña / app password del buzón |
| Sender name | `RDP Gestión` |
| Sender email | el mismo buzón |

4. SPF existente típico: `v=spf1 include:spf.protection.outlook.com -all` — **no hace falta** añadir otro `include` si el envío sale por M365.  
5. Pegar plantillas de `supabase/prod/email-templates/`.

### Alternativa: **Resend** (opción b)

Útil si no pueden habilitar SMTP AUTH. Requiere DNS adicional **sin romper** el SPF de Outlook:

```
v=spf1 include:spf.protection.outlook.com include:resend.com -all
```

Más registros DKIM (CNAME Resend) y DMARC (`_dmarc`). Más superficie DNS y dos caminos de envío; por eso **preferimos M365** salvo bloqueo de SMTP AUTH.

## 5. App — checklist técnico (ya en código de esta PR)

- [x] Validación de env al arrancar (`src/lib/env.ts` + `src/instrumentation.ts`)  
- [x] Headers: HSTS, X-Frame-Options, Referrer-Policy, CSP (`next.config.ts`)  
- [x] `robots: noindex` (layout) + `src/app/robots.txt` vía `robots.ts` (disallow `/`)  
- [x] Auth redirects con `NEXT_PUBLIC_SITE_URL` (`getSiteUrl`)  
- [x] Plantillas correo ES + marca  

## 6. Checklist post-deploy

- [ ] Login con Rivaldo / Alejandro / Armando  
- [ ] Primer ingreso fuerza cambio de contraseña  
- [ ] «Olvidaste contraseña» llega por SMTP de marca  
- [ ] `https://gestion.rdpabogados.com/robots.txt` bloquea todo  
- [ ] Headers de seguridad visibles (SecurityHeaders / curl -I)  
- [ ] Bucket `matter-documents` privado; subida de documento OK  
- [ ] Etapas por tipo visibles en Admin → Catálogos  
- [ ] Sin datos demo / plantillas de prueba  

## Archivos de referencia

| Ruta | Uso |
|---|---|
| `supabase/prod/bootstrap.sql` | Schema prod concatenado |
| `supabase/prod/members.sql` | Perfiles iniciales |
| `supabase/prod/email-templates/` | HTML Auth |
| `docs/deploy-produccion.md` | Esta guía |
| `docs/produccion.md` | Resumen + enlace aquí |
