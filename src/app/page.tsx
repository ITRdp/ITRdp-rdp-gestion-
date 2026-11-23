import Link from "next/link";
import { headers } from "next/headers";
import { AppNav } from "@/components/AppNav";
import { CompleteTaskButton } from "@/components/CompleteTaskButton";
import { requireMember } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export default async function JornadaPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const hdrs = await headers();
  const path = hdrs.get("x-pathname") ?? "/";

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      `
      id,
      description,
      follow_up_date,
      status,
      completed_at,
      matter_id,
      matters (
        id,
        title,
        procedural_deadline,
        clients ( name )
      )
    `,
    )
    .eq("assignee_id", member.id)
    .order("follow_up_date", { ascending: true });

  const pending = (tasks ?? []).filter((t) => t.status === "pendiente");
  const done = (tasks ?? []).filter((t) => t.status === "completada").slice(0, 8);

  return (
    <div className="min-h-screen">
      <AppNav member={member} currentPath={path} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <header className="fade-in mb-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold)]">
            Hoy
          </p>
          <h1 className="font-display mt-1 text-3xl text-[var(--wine)] sm:text-4xl">
            Mi jornada
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Tareas asignadas a ti, ordenadas por fecha de seguimiento. El
            vencimiento procesal del asunto se muestra aparte cuando exista.
          </p>
        </header>

        <section className="rise mb-10">
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl text-[var(--wine)]">
              Pendientes ({pending.length})
            </h2>
            <Link href="/asuntos" className="text-sm text-[var(--gold)] underline-offset-4 hover:underline">
              Ver asuntos
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="surface p-6 text-[var(--muted)]">
              No tienes tareas pendientes. Cuando te asignen seguimiento, aparecerán aquí.
            </div>
          ) : (
            <ul className="grid gap-3">
              {pending.map((task) => {
                const matter = Array.isArray(task.matters)
                  ? task.matters[0]
                  : task.matters;
                const client = matter
                  ? Array.isArray(matter.clients)
                    ? matter.clients[0]
                    : matter.clients
                  : null;

                return (
                  <li key={task.id} className="surface grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="badge">Seguimiento {formatDate(task.follow_up_date)}</span>
                        {matter?.procedural_deadline && (
                          <span className="badge badge-gold">
                            Venc. procesal {formatDate(matter.procedural_deadline)}
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-[var(--ink)]">{task.description}</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {client?.name ?? "Cliente"} ·{" "}
                        <Link
                          href={`/asuntos/${task.matter_id}`}
                          className="text-[var(--wine)] underline-offset-2 hover:underline"
                        >
                          {matter?.title ?? "Asunto"}
                        </Link>
                      </p>
                    </div>
                    <CompleteTaskButton taskId={task.id} matterId={task.matter_id} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="fade-in">
          <h2 className="font-display mb-4 text-xl text-[var(--wine)]">
            Completadas recientemente
          </h2>
          {done.length === 0 ? (
            <p className="hint">Aún no has completado tareas en esta sesión de trabajo.</p>
          ) : (
            <ul className="grid gap-2">
              {done.map((task) => {
                const matter = Array.isArray(task.matters)
                  ? task.matters[0]
                  : task.matters;
                return (
                  <li
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] py-3"
                  >
                    <div>
                      <p className="text-[var(--ink)]">{task.description}</p>
                      <p className="text-sm text-[var(--muted)]">
                        {matter?.title ?? "Asunto"} · completada{" "}
                        {formatDateTime(task.completed_at)}
                      </p>
                    </div>
                    <span className="badge badge-ok">Completada</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
