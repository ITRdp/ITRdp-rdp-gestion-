# Producción — RDP Gestión

## 1. Proyecto Supabase de producción

Usa un proyecto **separado** (no reutilices `rdp-gestion-dev`).

1. Crea el proyecto en [Supabase](https://supabase.com) (región cercana a Colombia).
2. Copia URL, `anon` y `service_role` a las variables de Vercel (ver abajo).
3. Aplica migraciones en orden (SQL Editor o CLI):

```bash
# Con supabase CLI (recomendado)
npx supabase db push --db-url "$DATABASE_URL"
# o ejecuta en orden los archivos de supabase/migrations/
```

Lista actual (incluye fix festivos/áreas y etapas prelanzamiento):

1. `20261123000000_initial_schema.sql`
2. `20261123010000_fase2_clients_matters.sql`
3. `20261123020000_fase3_agenda_tasks.sql`
4. `20261123030000_fase4_activity_docs_time.sql`
5. `20261123040000_fase5_admin_rls_notifications.sql`
6. `20261123120000_fix_festivos_areas_protect.sql`
7. `20261123140000_prelanzamiento_stages.sql`
8. `20261123150000_etapas_acordadas.sql` — Mapa exacto de etapas (upsert + disable extras + remap)
9. `20261123160000_matters_stage_default_trigger.sql` — Sin default ingreso; BI trigger primera etapa enabled
10. `20261123170000_matters_stage_update_trigger.sql` — Mismo trigger en UPDATE (remap si cambia tipo)

4. Crea el bucket privado `matter-documents` si la migración no lo hizo.
5. Authentication → URL Configuration:
   - **Site URL:** `https://gestion.rdpabogados.com`
   - **Redirect URLs:** `https://gestion.rdpabogados.com/**`, `https://gestion.rdpabogados.com/restablecer`
6. SMTP propio (`@rdpabogados.com`) en Authentication → Emails (el correo por defecto de Supabase es limitado).
7. Activa **Leaked password protection** y, si el plan lo permite, MFA para admins.
8. Plan de backups: el Free no ofrece PITR y pausa proyectos inactivos. Usa Pro (o superior) con backups diarios / PITR.

Limpieza de datos demo: `supabase/scripts/limpiar-demo.sql`.

## 2. Despliegue en Vercel

Proyecto: **Vercel Pro**. Dominio: **`gestion.rdpabogados.com`**.

### Variables de entorno (Production)

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto **prod** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | **Solo servidor** (nunca `NEXT_PUBLIC_`) |
| `NEXT_PUBLIC_SITE_URL` | `https://gestion.rdpabogados.com` |
| `SENTRY_DSN` | Opcional; monitoreo de errores |

Preview/Development: apunta a Supabase **dev**.

### DNS (documentar en el registrador del dominio)

Para `gestion.rdpabogados.com` → Vercel:

| Tipo | Nombre | Valor |
|---|---|---|
| `CNAME` | `gestion` | `cname.vercel-dns.com` |

(Si Vercel pide registro `A` en apex, no aplica a este subdominio.)

En el dashboard de Vercel: Domains → Add → `gestion.rdpabogados.com` → seguir la verificación.

### Checklist post-deploy

- [ ] Login / recuperar contraseña reciben correo SMTP
- [ ] `robots: noindex` activo (layout)
- [ ] 404 / 500 de marca
- [ ] Primer admin real creado (sin `@despacho.local`)
- [ ] Migraciones aplicadas y festivos 2027 verificados
