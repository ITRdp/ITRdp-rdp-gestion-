import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { AppShell } from "@/components/AppShell";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { TimePanel } from "@/components/time/time-panel";
import type {
  ActivityLogEntry,
  MatterDocument,
  Member,
  TimeEntry,
} from "@/lib/types";

const demoMember: Member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana.ruiz@despacho.co",
  full_name: "Ana Ruiz",
  role: "admin",
  enabled: true,
  created_at: "2026-01-10T10:00:00.000Z",
};

const matterId = "00000000-0000-4000-8000-000000000010";

const demoDocs: MatterDocument[] = [
  {
    id: "d1",
    matter_id: matterId,
    title: "Poder especial",
    description: "Firmado por el cliente",
    source: "onedrive",
    storage_path: null,
    onedrive_url: "https://onedrive.live.com/example",
    file_name: null,
    mime_type: null,
    file_size: null,
    uploaded_by: demoMember.id,
    created_at: "2026-11-20T14:00:00.000Z",
    deleted_at: null,
  },
  {
    id: "d2",
    matter_id: matterId,
    title: "Memorial de pruebas.pdf",
    description: null,
    source: "storage",
    storage_path: `${matterId}/memorial.pdf`,
    onedrive_url: null,
    file_name: "Memorial de pruebas.pdf",
    mime_type: "application/pdf",
    file_size: 245760,
    uploaded_by: demoMember.id,
    created_at: "2026-11-21T09:30:00.000Z",
    deleted_at: null,
  },
];

const demoTimes: TimeEntry[] = [
  {
    id: "t1",
    matter_id: matterId,
    member_id: demoMember.id,
    description: "Revisión expediente",
    started_at: "2026-11-22T09:00:00.000Z",
    ended_at: "2026-11-22T10:25:00.000Z",
    duration_minutes: 85,
    billable: true,
    created_at: "2026-11-22T09:00:00.000Z",
    updated_at: "2026-11-22T10:25:00.000Z",
  },
  {
    id: "t2",
    matter_id: matterId,
    member_id: demoMember.id,
    description: "Sesión de trabajo",
    started_at: new Date(Date.now() - 12 * 60_000).toISOString(),
    ended_at: null,
    duration_minutes: null,
    billable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const demoActivity: ActivityLogEntry[] = [
  {
    id: "a1",
    matter_id: matterId,
    client_id: null,
    actor_id: demoMember.id,
    entity_type: "time_entry",
    entity_id: "t2",
    action: "started",
    summary: "Cronómetro iniciado",
    meta: {},
    created_at: new Date().toISOString(),
  },
  {
    id: "a2",
    matter_id: matterId,
    client_id: null,
    actor_id: demoMember.id,
    entity_type: "document",
    entity_id: "d2",
    action: "created",
    summary: "Documento: Memorial de pruebas.pdf (storage)",
    meta: { source: "storage" },
    created_at: "2026-11-21T09:30:00.000Z",
  },
  {
    id: "a3",
    matter_id: matterId,
    client_id: null,
    actor_id: demoMember.id,
    entity_type: "task",
    entity_id: "task1",
    action: "status_changed",
    summary: "Tarea pendiente → en_curso: Preparar audiencia",
    meta: {},
    created_at: "2026-11-20T16:00:00.000Z",
  },
  {
    id: "a4",
    matter_id: matterId,
    client_id: null,
    actor_id: demoMember.id,
    entity_type: "matter",
    entity_id: matterId,
    action: "updated",
    summary: "Asunto actualizado: RDP-2026-0002 (etapa instrucción → audiencia)",
    meta: {},
    created_at: "2026-11-18T11:00:00.000Z",
  },
];

export default async function Fase4PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_FASE4_PREVIEW !== "1"
  ) {
    notFound();
  }

  const { view = "reportes" } = await searchParams;

  return (
    <AppShell member={demoMember}>
      {view === "documentos" ? (
        <DocsPreview />
      ) : view === "tiempo" ? (
        <TimePreview />
      ) : view === "actividad" ? (
        <ActivityPreview />
      ) : (
        <ReportesPreview />
      )}
    </AppShell>
  );
}

function DocsPreview() {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          RDP-2026-0002
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)]">
          Documentos
        </h1>
      </header>
      <DocumentsPanel matterId={matterId} documents={demoDocs} />
    </>
  );
}

function TimePreview() {
  const active = demoTimes.find((t) => !t.ended_at) ?? null;
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          RDP-2026-0002
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)]">
          Tiempo
        </h1>
      </header>
      <TimePanel
        matterId={matterId}
        entries={demoTimes}
        activeEntry={active}
      />
    </>
  );
}

function ActivityPreview() {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          RDP-2026-0002
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)]">
          Línea de tiempo
        </h1>
      </header>
      <div className="surface max-w-xl rounded-md p-4">
        <ActivityTimeline
          entries={demoActivity}
          actorNames={{ [demoMember.id]: demoMember.full_name }}
        />
      </div>
    </>
  );
}

function ReportesPreview() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
            Operación
          </p>
          <h1 className="font-display text-3xl text-[var(--wine-900)]">
            Reportes
          </h1>
        </div>
        <div className="flex gap-2">
          <span className="badge">Exportar tiempo</span>
          <span className="badge">Exportar asuntos</span>
          <span className="badge badge-gold">Exportar actividad</span>
        </div>
      </header>
      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Asuntos abiertos", "12"],
          ["Tareas abiertas", "27"],
          ["Tareas vencidas", "3"],
          ["Documentos activos", "48"],
        ].map(([label, value]) => (
          <div key={label} className="surface rounded-md p-4">
            <p className="hint">{label}</p>
            <p className="mt-1 font-display text-3xl text-[var(--wine-900)]">
              {value}
            </p>
          </div>
        ))}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface rounded-md p-4">
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Tiempo por miembro
          </h2>
          <ul className="grid gap-2 text-sm">
            <li className="flex justify-between">
              <span>Ana Ruiz</span>
              <strong>14 h 20 min</strong>
            </li>
            <li className="flex justify-between">
              <span>Luis Martín</span>
              <strong>9 h 05 min</strong>
            </li>
            <li className="flex justify-between">
              <span>María López</span>
              <strong>6 h 40 min</strong>
            </li>
          </ul>
        </section>
        <section className="surface rounded-md p-4">
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Actividad reciente
          </h2>
          <ul className="grid gap-2 text-sm">
            <li>Cronómetro iniciado · RDP-2026-0002</li>
            <li>Documento: Memorial de pruebas.pdf</li>
            <li>Tarea pendiente → en_curso</li>
          </ul>
        </section>
      </div>
    </>
  );
}
