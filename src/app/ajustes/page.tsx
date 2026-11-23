import { AppShellHost } from "@/components/AppShellHost";
import { NotificationPrefsForm } from "@/components/admin/admin-panels";
import { requireMember } from "@/lib/auth";

export default async function AjustesPage() {
  const member = await requireMember();

  return (
    <AppShellHost member={member}>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Cuenta
        </p>
        <h1 className="font-display text-3xl text-[var(--wine-900)]">
          Ajustes
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Preferencias de notificaciones para {member.full_name}.
        </p>
      </header>
      <NotificationPrefsForm member={member} />
    </AppShellHost>
  );
}
