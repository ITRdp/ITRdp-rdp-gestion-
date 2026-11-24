# Plantillas de correo Supabase (ES + marca)

Copiar el HTML en **Authentication → Email Templates** del proyecto de producción:

| Archivo | Plantilla Supabase |
|---|---|
| `recovery.html` | Reset password |
| `invite.html` | Invite user |
| `change-email.html` | Change email address |

Subject sugeridos:

- Recovery: `Restablecer contraseña — RDP Gestión`
- Invite: `Invitación a RDP Gestión`
- Change email: `Confirma tu nuevo correo — RDP Gestión`

El enlace usa `{{ .ConfirmationURL }}` (variable de Supabase Auth).
