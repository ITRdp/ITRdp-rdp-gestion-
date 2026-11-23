import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import type { Member } from "@/lib/types";

const demoMember: Member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana.ruiz@despacho.co",
  full_name: "Ana Ruiz",
  role: "admin",
  enabled: true,
  created_at: "2026-01-10T10:00:00.000Z",
};

export default async function Fase3PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_FASE3_PREVIEW !== "1"
  ) {
    notFound();
  }

  const { view = "jornada" } = await searchParams;

  return (
    <AppShell member={demoMember}>
      {view === "agenda" ? <AgendaPreview /> : <JornadaPreview />}
    </AppShell>
  );
}

function JornadaPreview() {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Hoy · 23 nov 2026
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)]">
          Mi jornada
        </h1>
      </header>
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-md p-4">
          <h2 className="font-display text-lg text-[var(--wine-900)]">
            Agenda (7 días)
          </h2>
          <p className="mt-2 text-sm">
            <span className="badge mr-2">Audiencia</span>
            Juzgado 12 Civil · 25 nov 2026, 9:00 a. m.
          </p>
        </div>
        <div className="surface rounded-md p-4">
          <h2 className="font-display text-lg text-[var(--wine-900)]">
            Plazos procesales
          </h2>
          <p className="mt-2 flex items-center justify-between text-sm">
            <span>RDP-2026-0002 · Tutela laboral</span>
            <span className="badge badge-semaforo-amarillo">3 hábiles</span>
          </p>
        </div>
      </div>
      <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
        Pendientes (1)
      </h2>
      <div className="surface rounded-md p-4">
        <div className="mb-2 flex flex-wrap gap-2">
          <span className="badge">En curso</span>
          <span className="badge">Alta</span>
          <span className="badge badge-semaforo-rojo">1 hábil</span>
        </div>
        <p className="font-medium">Preparar audiencia</p>
        <ul className="mt-2 text-sm text-[var(--muted)]">
          <li>☐ Confirmar fecha y sala</li>
          <li>☐ Armar índice de pruebas</li>
        </ul>
      </div>
    </>
  );
}

function AgendaPreview() {
  return (
    <>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-[var(--wine-900)]">
            Agenda
          </h1>
          <p className="hint">Vista mes · festivos seed 2026</p>
        </div>
        <div className="flex gap-1 rounded-md border border-[var(--line)] p-0.5 text-sm">
          <span className="rounded bg-[var(--wine-900)] px-3 py-1 text-white">
            Mes
          </span>
          <span className="px-3 py-1 text-[var(--muted)]">Semana</span>
          <span className="px-3 py-1 text-[var(--muted)]">Lista</span>
        </div>
      </header>
      <div className="mb-2 grid grid-cols-7 text-center text-xs font-semibold uppercase text-[var(--muted)]">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const isHoliday = day === 16;
          return (
            <div
              key={day}
              className={`agenda-day-cell ${day === 23 ? "is-today" : ""} ${
                isHoliday ? "is-holiday" : ""
              }`}
            >
              <span className="text-xs font-medium">{day}</span>
              {isHoliday ? (
                <p className="text-[10px] text-[var(--wine-700)]">
                  Independencia Cartagena
                </p>
              ) : null}
              {day === 25 ? (
                <span className="agenda-event-chip audiencia">Audiencia</span>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-sm">
        <Link href="/dev/fase3-preview?view=jornada" className="text-[var(--gold-500)]">
          Ver jornada
        </Link>
      </p>
    </>
  );
}
