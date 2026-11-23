import Link from "next/link";
import { notFound } from "next/navigation";
import { ActuacionForm } from "@/components/ActuacionForm";
import { AppNav } from "@/components/AppNav";
import { CompleteTaskButton } from "@/components/CompleteTaskButton";
import { TaskForm } from "@/components/TaskForm";
import { requireMember } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Actuacion, Member } from "@/lib/types";

type Params = { id: string };

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const member = await requireMember();
  const supabase = await createClient();

  const [
    { data: matter },
    { data: actuaciones },
    { data: tasks },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("matters")
      .select(
        `
        *,
        clients ( id, name, nif, email, phone ),
        responsible:members!matters_responsible_lawyer_id_fkey ( id, full_name, email ),
        creator:members!matters_created_by_fkey ( full_name )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("actuaciones")
      .select(
        `
        *,
        author:members!actuaciones_author_id_fkey ( full_name, email )
      `,
      )
      .eq("matter_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select(
        `
        *,
        assignee:members!tasks_assignee_id_fkey ( full_name ),
        completer:members!tasks_completed_by_fkey ( full_name ),
        creator:members!tasks_created_by_fkey ( full_name )
      `,
      )
      .eq("matter_id", id)
      .order("follow_up_date", { ascending: true }),
    supabase
      .from("members")
      .select("*")
      .eq("enabled", true)
      .order("full_name"),
  ]);

  if (!matter) {
    notFound();
  }

  const client = Array.isArray(matter.clients)
    ? matter.clients[0]
    : matter.clients;
  const responsible = Array.isArray(matter.responsible)
    ? matter.responsible[0]
    : matter.responsible;
  const creator = Array.isArray(matter.creator)
    ? matter.creator[0]
    : matter.creator;

  return (
    <div className="min-h-screen">
      <AppNav member={member} currentPath="/asuntos" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="fade-in mb-4">
          <Link
            href="/asuntos"
            className="text-sm text-[var(--gold)] underline-offset-4 hover:underline"
          >
            ← Volver a asuntos
          </Link>
        </p>

        <header className="fade-in mb-8">
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="badge capitalize">{matter.status}</span>
            {matter.procedural_deadline && (
              <span className="badge badge-gold">
                Vencimiento procesal {formatDate(matter.procedural_deadline)}
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl text-[var(--wine)] sm:text-4xl">
            {matter.title}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Cliente: <strong className="text-[var(--ink)]">{client?.name}</strong>
            {client?.nif ? ` · ${client.nif}` : ""}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div className="surface p-3">
              <dt className="hint">Abogado responsable del asunto</dt>
              <dd className="font-medium text-[var(--ink)]">
                {responsible?.full_name ?? "—"}
              </dd>
            </div>
            <div className="surface p-3">
              <dt className="hint">Alta del asunto</dt>
              <dd className="font-medium text-[var(--ink)]">
                {creator?.full_name ?? "—"} · {formatDateTime(matter.created_at)}
              </dd>
            </div>
          </dl>
          {matter.description && (
            <p className="mt-4 max-w-3xl text-[var(--ink)]">{matter.description}</p>
          )}
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="grid gap-8">
            <ActuacionForm matterId={matter.id} />
            <TaskForm
              matterId={matter.id}
              members={(members ?? []) as Member[]}
              actuaciones={(actuaciones ?? []) as Actuacion[]}
            />
          </div>

          <div className="grid gap-8">
            <section className="rise">
              <h2 className="font-display mb-3 text-xl text-[var(--wine)]">
                Actuaciones
              </h2>
              {!actuaciones?.length ? (
                <div className="surface p-4 text-[var(--muted)]">
                  Todavía no hay actuaciones registradas.
                </div>
              ) : (
                <ol className="grid gap-3">
                  {actuaciones.map((a) => {
                    const author = Array.isArray(a.author)
                      ? a.author[0]
                      : a.author;
                    return (
                      <li key={a.id} className="surface p-4">
                        <p className="text-[var(--ink)]">{a.description}</p>
                        {a.onedrive_url && (
                          <p className="mt-2">
                            <a
                              href={a.onedrive_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[var(--gold)] underline-offset-2 hover:underline"
                            >
                              Abrir documento OneDrive
                            </a>
                          </p>
                        )}
                        <p className="mt-3 text-xs text-[var(--muted)]">
                          Registrada por <strong>{author?.full_name ?? "—"}</strong>{" "}
                          el {formatDateTime(a.created_at)}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="fade-in">
              <h2 className="font-display mb-3 text-xl text-[var(--wine)]">
                Tareas y auditoría
              </h2>
              {!tasks?.length ? (
                <div className="surface p-4 text-[var(--muted)]">
                  No hay tareas en este asunto.
                </div>
              ) : (
                <ul className="grid gap-3">
                  {tasks.map((task) => {
                    const assignee = Array.isArray(task.assignee)
                      ? task.assignee[0]
                      : task.assignee;
                    const completer = Array.isArray(task.completer)
                      ? task.completer[0]
                      : task.completer;
                    const taskCreator = Array.isArray(task.creator)
                      ? task.creator[0]
                      : task.creator;
                    const mine =
                      task.assignee_id === member.id &&
                      task.status === "pendiente";

                    return (
                      <li key={task.id} className="surface p-4">
                        <div className="mb-2 flex flex-wrap gap-2">
                          <span
                            className={`badge ${
                              task.status === "completada" ? "badge-ok" : ""
                            } capitalize`}
                          >
                            {task.status}
                          </span>
                          <span className="badge">
                            Seguimiento {formatDate(task.follow_up_date)}
                          </span>
                        </div>
                        <p className="font-medium text-[var(--ink)]">
                          {task.description}
                        </p>
                        <p className="mt-2 text-sm text-[var(--muted)]">
                          Encargado: <strong>{assignee?.full_name ?? "—"}</strong>
                          {" · "}
                          Asignada por {taskCreator?.full_name ?? "—"} el{" "}
                          {formatDateTime(task.created_at)}
                        </p>
                        {task.status === "completada" && (
                          <p className="mt-1 text-sm text-[var(--success)]">
                            Completada por{" "}
                            <strong>{completer?.full_name ?? "—"}</strong> el{" "}
                            {formatDateTime(task.completed_at)}
                          </p>
                        )}
                        {mine && (
                          <div className="mt-3">
                            <CompleteTaskButton
                              taskId={task.id}
                              matterId={matter.id}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
