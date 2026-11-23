import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/auth";
import { formatDate, formatDateTime, todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

function formatMins(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

export default async function ReportesPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const today = todayISO();

  const [
    { count: mattersOpen },
    { count: tasksOpen },
    { count: tasksOverdue },
    { data: timeRows },
    { data: recentActivity },
    { data: mattersByStatus },
    { count: documentsCount },
  ] = await Promise.all([
    supabase
      .from("matters")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .neq("status", "cerrado")
      .neq("status", "archivado"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "completada")
      .neq("status", "cancelada"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "completada")
      .neq("status", "cancelada")
      .lt("follow_up_date", today),
    supabase
      .from("time_entries")
      .select(
        `
        id, duration_minutes, billable, started_at, ended_at, description,
        matter:matters!time_entries_matter_id_fkey ( code, title ),
        member:members!time_entries_member_id_fkey ( full_name )
      `,
      )
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(200),
    supabase
      .from("activity_log")
      .select(
        `
        id, matter_id, summary, action, entity_type, created_at,
        matter:matters!activity_log_matter_id_fkey ( code, title )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("matters")
      .select("status")
      .is("deleted_at", null),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  const statusCounts = new Map<string, number>();
  for (const m of mattersByStatus ?? []) {
    statusCounts.set(m.status, (statusCounts.get(m.status) ?? 0) + 1);
  }

  const totalMins = (timeRows ?? []).reduce(
    (acc, r) => acc + (r.duration_minutes ?? 0),
    0,
  );
  const billableMins = (timeRows ?? [])
    .filter((r) => r.billable)
    .reduce((acc, r) => acc + (r.duration_minutes ?? 0), 0);

  const byMember = new Map<string, number>();
  for (const r of timeRows ?? []) {
    const mem = Array.isArray(r.member) ? r.member[0] : r.member;
    const name = mem?.full_name ?? "—";
    byMember.set(name, (byMember.get(name) ?? 0) + (r.duration_minutes ?? 0));
  }

  return (
    <AppShell member={member}>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
            Operación
          </p>
          <h1 className="font-display text-3xl text-[var(--wine-900)] sm:text-4xl">
            Reportes
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Resumen operativo y exportes CSV (compatible Excel).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href="/api/reportes/csv?kind=tiempo">Exportar tiempo</a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href="/api/reportes/csv?kind=asuntos">Exportar asuntos</a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href="/api/reportes/csv?kind=actividad">Exportar actividad</a>
          </Button>
        </div>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Asuntos abiertos" value={String(mattersOpen ?? 0)} />
        <Stat label="Tareas abiertas" value={String(tasksOpen ?? 0)} />
        <Stat
          label="Tareas vencidas (seguimiento)"
          value={String(tasksOverdue ?? 0)}
        />
        <Stat label="Documentos activos" value={String(documentsCount ?? 0)} />
      </section>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <section className="surface rounded-md p-4">
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Asuntos por estado
          </h2>
          {!statusCounts.size ? (
            <EmptyState title="Sin asuntos." />
          ) : (
            <ul className="grid gap-2 text-sm">
              {[...statusCounts.entries()].map(([status, n]) => (
                <li
                  key={status}
                  className="flex justify-between border-b border-[var(--line)] py-1.5"
                >
                  <span className="capitalize">{status}</span>
                  <strong>{n}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface rounded-md p-4">
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Tiempo registrado
          </h2>
          <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="hint">Total (últimas entradas)</dt>
              <dd className="text-lg font-medium text-[var(--wine-900)]">
                {formatMins(totalMins)}
              </dd>
            </div>
            <div>
              <dt className="hint">Facturable</dt>
              <dd className="text-lg font-medium text-[var(--wine-900)]">
                {formatMins(billableMins)}
              </dd>
            </div>
          </dl>
          <h3 className="mb-2 text-sm font-medium">Por miembro</h3>
          {!byMember.size ? (
            <p className="text-sm text-[var(--muted)]">Sin tiempo cerrado.</p>
          ) : (
            <ul className="grid gap-1 text-sm">
              {[...byMember.entries()]
                .sort((a, b) => b[1] - a[1])
                .map(([name, mins]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span>{formatMins(mins)}</span>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Últimas entradas de tiempo
          </h2>
          {!timeRows?.length ? (
            <EmptyState title="Sin tiempo registrado." />
          ) : (
            <ul className="grid gap-2">
              {timeRows.slice(0, 12).map((r) => {
                const matter = Array.isArray(r.matter) ? r.matter[0] : r.matter;
                const mem = Array.isArray(r.member) ? r.member[0] : r.member;
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium text-[var(--ink)]">
                        {matter?.code ?? "—"} · {mem?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {r.description || "Sesión"} ·{" "}
                        {formatDateTime(r.started_at)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatMins(r.duration_minutes ?? 0)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Actividad reciente
          </h2>
          {!recentActivity?.length ? (
            <EmptyState title="Sin actividad." />
          ) : (
            <ul className="grid gap-2">
              {recentActivity.map((a) => {
                const matter = Array.isArray(a.matter) ? a.matter[0] : a.matter;
                return (
                  <li
                    key={a.id}
                    className="rounded-md border border-[var(--line)] bg-white/60 px-3 py-2 text-sm"
                  >
                    <p className="text-[var(--ink)]">{a.summary}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {matter?.code && a.matter_id ? (
                        <>
                          <Link
                            href={`/asuntos/${a.matter_id}`}
                            className="text-[var(--gold-500)] hover:underline"
                          >
                            {matter.code}
                          </Link>
                          {" · "}
                        </>
                      ) : null}
                      {formatDate(a.created_at)} · {a.entity_type} / {a.action}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-md p-4">
      <p className="hint">{label}</p>
      <p className="mt-1 font-display text-3xl text-[var(--wine-900)]">
        {value}
      </p>
    </div>
  );
}
