import { AppShellHost } from "@/components/AppShellHost";
import {
  CatalogsReference,
  HolidaysAdmin,
  InviteMemberForm,
  MembersTable,
  NotificationPrefsForm,
} from "@/components/admin/admin-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Member, NonBusinessDay } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const admin = await requireAdmin();
  const { tab } = await searchParams;
  const supabase = await createClient();

  const [{ data: members }, { data: holidays }] = await Promise.all([
    supabase.from("members").select("*").order("full_name"),
    supabase
      .from("non_business_days")
      .select("*")
      .order("day", { ascending: true }),
  ]);

  const defaultTab = tab ?? "miembros";

  return (
    <AppShellHost member={admin}>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display text-3xl text-[var(--wine-900)] sm:text-4xl">
          Administración
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Miembros, días no hábiles, catálogos y preferencias de aviso. Solo
          rol admin.
        </p>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="miembros">Miembros</TabsTrigger>
          <TabsTrigger value="festivos">Días no hábiles</TabsTrigger>
          <TabsTrigger value="catalogos">Catálogos</TabsTrigger>
          <TabsTrigger value="avisos">Preferencias</TabsTrigger>
        </TabsList>

        <TabsContent value="miembros" className="grid gap-6 lg:grid-cols-2">
          <InviteMemberForm />
          <MembersTable
            members={(members ?? []) as Member[]}
            currentId={admin.id}
          />
        </TabsContent>

        <TabsContent value="festivos">
          <HolidaysAdmin days={(holidays ?? []) as NonBusinessDay[]} />
        </TabsContent>

        <TabsContent value="catalogos">
          <CatalogsReference />
        </TabsContent>

        <TabsContent value="avisos">
          <NotificationPrefsForm member={admin} />
          <p className="mt-4 max-w-lg text-sm text-[var(--muted)]">
            Cada miembro puede ajustar estas preferencias aquí (vista admin) o
            en su propio perfil cuando se amplíe. El digest por correo queda
            listo a nivel de datos; no hay job de envío en Fase 5.
          </p>
        </TabsContent>
      </Tabs>
    </AppShellHost>
  );
}
