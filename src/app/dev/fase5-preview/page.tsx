import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import {
  CatalogsReference,
  HolidaysAdmin,
  InviteMemberForm,
  MembersTable,
  NotificationPrefsForm,
} from "@/components/admin/admin-panels";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  AppNotification,
  Member,
  NonBusinessDay,
} from "@/lib/types";

const demoAdmin: Member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana.ruiz@despacho.co",
  full_name: "Ana Ruiz",
  role: "admin",
  enabled: true,
  email_daily_digest: false,
  notify_in_app: true,
  created_at: "2026-01-10T10:00:00.000Z",
};

const demoMembers: Member[] = [
  demoAdmin,
  {
    id: "00000000-0000-4000-8000-000000000002",
    email: "luis.martin@despacho.co",
    full_name: "Luis Martín",
    role: "abogado",
    enabled: true,
    created_at: "2026-01-12T10:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    email: "maria.lopez@despacho.co",
    full_name: "María López",
    role: "paralegal",
    enabled: true,
    created_at: "2026-01-15T10:00:00.000Z",
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    email: "ex.colaborador@despacho.co",
    full_name: "Ex Colaborador",
    role: "abogado",
    enabled: false,
    created_at: "2026-02-01T10:00:00.000Z",
  },
];

const demoHolidays: NonBusinessDay[] = [
  {
    id: "h1",
    day: "2026-05-01",
    name: "Día del Trabajo",
    kind: "festivo_nacional",
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "h2",
    day: "2026-07-20",
    name: "Independencia",
    kind: "festivo_nacional",
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "h3",
    day: "2026-12-25",
    name: "Navidad",
    kind: "festivo_religioso",
    notes: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

const demoNotifications: AppNotification[] = [
  {
    id: "n1",
    member_id: demoAdmin.id,
    title: "Nueva tarea asignada",
    body: "Preparar audiencia — RDP-2026-0002",
    href: "/asuntos/x?tab=tareas",
    kind: "task_assigned",
    entity_type: "task",
    entity_id: null,
    read_at: null,
    created_at: "2026-11-23T10:00:00.000Z",
  },
  {
    id: "n2",
    member_id: demoAdmin.id,
    title: "Comentario en tu tarea",
    body: "Adjunto índice de pruebas en OneDrive",
    href: "/asuntos/x?tab=tareas",
    kind: "task_comment",
    entity_type: "task",
    entity_id: null,
    read_at: null,
    created_at: "2026-11-22T16:30:00.000Z",
  },
  {
    id: "n3",
    member_id: demoAdmin.id,
    title: "Asunto asignado como responsable",
    body: "RDP-2026-0005 — Contrato marco",
    href: "/asuntos/y",
    kind: "matter_assigned",
    entity_type: "matter",
    entity_id: null,
    read_at: "2026-11-21T12:00:00.000Z",
    created_at: "2026-11-21T11:00:00.000Z",
  },
];

export default async function Fase5PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_FASE5_PREVIEW !== "1"
  ) {
    notFound();
  }

  const { view = "admin" } = await searchParams;
  const unread = demoNotifications.filter((n) => !n.read_at).length;

  return (
    <AppShell
      member={demoAdmin}
      notifications={demoNotifications}
      unreadCount={unread}
    >
      {view === "roles" ? (
        <RolesPreview />
      ) : view === "avisos" ? (
        <AvisosPreview />
      ) : (
        <AdminPreview />
      )}
    </AppShell>
  );
}

function AdminPreview() {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display text-3xl text-[var(--wine-900)]">
          Administración
        </h1>
      </header>
      <Tabs defaultValue="miembros">
        <TabsList>
          <TabsTrigger value="miembros">Miembros</TabsTrigger>
          <TabsTrigger value="festivos">Días no hábiles</TabsTrigger>
          <TabsTrigger value="catalogos">Catálogos</TabsTrigger>
          <TabsTrigger value="avisos">Preferencias</TabsTrigger>
        </TabsList>
        <TabsContent value="miembros" className="grid gap-6 lg:grid-cols-2">
          <InviteMemberForm />
          <MembersTable members={demoMembers} currentId={demoAdmin.id} />
        </TabsContent>
        <TabsContent value="festivos">
          <HolidaysAdmin days={demoHolidays} />
        </TabsContent>
        <TabsContent value="catalogos">
          <CatalogsReference />
        </TabsContent>
        <TabsContent value="avisos">
          <NotificationPrefsForm member={demoAdmin} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function RolesPreview() {
  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-3xl text-[var(--wine-900)]">
          Permisos por rol
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Matriz operativa Fase 5 (RLS + UI).
        </p>
      </header>
      <div className="overflow-x-auto rounded-md border border-[var(--line)]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-[var(--surface)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Admin</th>
              <th className="px-3 py-2">Abogado</th>
              <th className="px-3 py-2">Paralegal</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Gestionar miembros / invitar", "Sí", "—", "—"],
              ["Días no hábiles", "Sí", "lectura", "lectura"],
              ["Crear/editar clientes y asuntos", "Sí", "Sí", "lectura"],
              ["Soft-delete clientes/asuntos", "Sí", "—", "—"],
              ["Tareas, actuaciones, docs, tiempo", "Sí", "Sí", "Sí"],
              ["Plantillas de tarea", "Sí", "Sí", "lectura"],
            ].map(([a, ad, ab, p]) => (
              <tr key={a} className="border-t border-[var(--line)]">
                <td className="px-3 py-2">{a}</td>
                <td className="px-3 py-2">{ad}</td>
                <td className="px-3 py-2">{ab}</td>
                <td className="px-3 py-2">{p}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AvisosPreview() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[var(--wine-900)]">
            Notificaciones in-app
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Campana en la barra superior · digest email preparado (off).
          </p>
        </div>
        <NotificationsBell
          notifications={demoNotifications}
          unreadCount={demoNotifications.filter((n) => !n.read_at).length}
        />
      </header>
      <NotificationPrefsForm member={demoAdmin} />
      <ul className="mt-6 grid max-w-lg gap-2">
        {demoNotifications.map((n) => (
          <li
            key={n.id}
            className="rounded-md border border-[var(--line)] bg-white/70 px-3 py-2 text-sm"
          >
            <p className="font-medium">{n.title}</p>
            <p className="text-xs text-[var(--muted)]">{n.body}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
