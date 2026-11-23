import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CompleteTaskButton } from "@/components/CompleteTaskButton";
import { EmptyState } from "@/components/EmptyState";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { TaskChecklist, TaskStatusBadge } from "@/components/TaskExtras";
import { requireMember } from "@/lib/auth";
import { holidaySet, toISODate } from "@/lib/business-days";
import { formatDate, formatDateTime, todayISO } from "@/lib/format";
import { EVENT_TYPES, labelOf, TASK_PRIORITIES } from "@/lib/catalogs";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem } from "@/lib/types";

export default async function JornadaPage() {
  const member = await requireMember();
  const supabase = await createClient();
  const today = todayISO();
  const weekEnd = new Date(`${today}T12:00:00`);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [
    { data: tasks },
    { data: holidays },
    { data: events },
    { data: urgentMatters },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        `
      id,
      description,
      follow_up_date,
      due_business_date,
      priority,
      status,
      checklist,
      completed_at,
      matter_id,
      matters (
        id,
        code,
        title,
        procedural_deadline,
        clients ( name )
      )
    `,
      )
      .eq("assignee_id", member.id)
      .order("follow_up_date", { ascending: true }),
    supabase.from("non_business_days").select("day"),
    supabase
      .from("events")
      .select("id, title, starts_at, event_type, matter_id, matters(code, title)")
      .gte("starts_at", `${today}T00:00:00`)
      .lte("starts_at", weekEnd.toISOString())
      .order("starts_at", { ascending: true })
      .limit(8),
    supabase
      .from("matters")
      .select("id, code, title, procedural_deadline")
      .is("deleted_at", null)
      .not("procedural_deadline", "is", null)
      .lte("procedural_deadline", toISODate(weekEnd))
      .gte("procedural_deadline", today)
      .order("procedural_deadline")
      .limit(6),
  ]);

  const holidaysSet = holidaySet(holidays ?? []);
  const pending = (tasks ?? []).filter(
    (t) => t.status === "pendiente" || t.status === "en_curso",
  );
  const done = (tasks ?? [])
    .filter((t) => t.status === "completada")
    .slice(0, 8);

  return (
    <AppShell member={member}>
      <header className="fade-in mb-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Hoy · {formatDate(today)}
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Mi jornada
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Tareas, semáforo por días hábiles CO, eventos próximos y plazos
          procesales de la semana.
        </p>
      </header>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <section className="surface rounded-md p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg text-[var(--wine-900)]">
              Agenda (7 días)
            </h2>
            <Link
              href="/agenda"
              className="text-sm text-[var(--gold-500)] hover:underline"
            >
              Ver agenda
            </Link>
          </div>
          {!events?.length ? (
            <p className="hint">Sin eventos próximos.</p>
          ) : (
            <ul className="grid gap-2">
              {events.map((e) => {
                const m = Array.isArray(e.matters) ? e.matters[0] : e.matters;
                return (
                  <li key={e.id} className="text-sm">
                    <span className="badge mr-2">
                      {labelOf(EVENT_TYPES, e.event_type)}
                    </span>
                    <span className="font-medium">{e.title}</span>
                    <span className="text-[var(--muted)]">
                      {" · "}
                      {formatDateTime(e.starts_at)}
                    </span>
                    {m ? (
                      <p className="text-xs text-[var(--muted)]">
                        {m.code} · {m.title}
                      </p>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="surface rounded-md p-4">
          <h2 className="font-display mb-3 text-lg text-[var(--wine-900)]">
            Plazos procesales (semana)
          </h2>
          {!urgentMatters?.length ? (
            <p className="hint">Sin vencimientos procesales esta semana.</p>
          ) : (
            <ul className="grid gap-2">
              {urgentMatters.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <Link
                    href={`/asuntos/${m.id}`}
                    className="font-medium text-[var(--wine-900)] hover:underline"
                  >
                    {m.code} · {m.title}
                  </Link>
                  <SemaforoBadge
                    deadline={m.procedural_deadline}
                    today={today}
                    holidays={holidaysSet}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rise mb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-xl text-[var(--wine-900)]">
            Pendientes ({pending.length})
          </h2>
          <Link
            href="/asuntos"
            className="text-sm text-[var(--gold-500)] underline-offset-4 hover:underline"
          >
            Ver asuntos
          </Link>
        </div>

        {pending.length === 0 ? (
          <EmptyState
            title="Sin tareas pendientes"
            description="Cuando te asignen seguimiento, aparecerán aquí."
          />
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
              const checklist = (task.checklist ?? []) as ChecklistItem[];

              return (
                <li
                  key={task.id}
                  className="surface grid gap-3 rounded-md p-4 sm:grid-cols-[1fr_auto] sm:items-start"
                >
                  <div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      <TaskStatusBadge status={task.status} />
                      <span className="badge capitalize">
                        {labelOf(TASK_PRIORITIES, task.priority)}
                      </span>
                      <span className="badge">
                        Seguimiento {formatDate(task.follow_up_date)}
                      </span>
                      <SemaforoBadge
                        deadline={
                          task.due_business_date || task.follow_up_date
                        }
                        today={today}
                        holidays={holidaysSet}
                        prefix="Semáforo"
                      />
                      {matter?.procedural_deadline ? (
                        <SemaforoBadge
                          deadline={matter.procedural_deadline}
                          today={today}
                          holidays={holidaysSet}
                          prefix="Venc. procesal"
                        />
                      ) : null}
                    </div>
                    <p className="font-medium text-[var(--ink)]">
                      {task.description}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {client?.name ?? "Cliente"} ·{" "}
                      <Link
                        href={`/asuntos/${task.matter_id}`}
                        className="text-[var(--wine-900)] underline-offset-2 hover:underline"
                      >
                        {matter?.code ? `${matter.code} · ` : ""}
                        {matter?.title ?? "Asunto"}
                      </Link>
                    </p>
                    <TaskChecklist
                      taskId={task.id}
                      matterId={task.matter_id}
                      checklist={checklist}
                    />
                  </div>
                  {task.status !== "completada" ? (
                    <CompleteTaskButton
                      taskId={task.id}
                      matterId={task.matter_id}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="fade-in">
        <h2 className="font-display mb-4 text-xl text-[var(--wine-900)]">
          Completadas recientemente
        </h2>
        {done.length === 0 ? (
          <p className="hint">
            Aún no has completado tareas en esta sesión de trabajo.
          </p>
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
    </AppShell>
  );
}
