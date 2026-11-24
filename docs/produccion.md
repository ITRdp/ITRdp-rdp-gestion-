# Producción — RDP Gestión

Guía completa (DNS Namecheap, Vercel nuevo, SMTP M365 vs Resend, bootstrap, members, plantillas):

→ **[`docs/deploy-produccion.md`](./deploy-produccion.md)**

## Resumen rápido

| Pieza | Valor |
|---|---|
| URL | `https://gestion.rdpabogados.com` |
| Git | Deploy desde `main` |
| Supabase | Proyecto **prod** aparte del dev |
| Schema | `supabase/prod/bootstrap.sql` (000000→190000) |
| Miembros | `supabase/prod/members.sql` tras crear Auth users |
| Vercel | Proyecto **nuevo** (no tocar www) |
| DNS | Valor **exacto** que muestre Vercel (no asumir cname) |
| SMTP | Preferir M365 `smtp.office365.com:587` |

### Variables Production

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor |
| `NEXT_PUBLIC_SITE_URL` | `https://gestion.rdpabogados.com` |
| `SENTRY_DSN` | Opcional |

### Orden merge (mientras #14/#15 abiertas)

1. Merge #15 → `release/v1`  
2. Merge PR deploy-produccion → `release/v1`  
3. Merge #14 → `main`  
4. Deploy Vercel Production
