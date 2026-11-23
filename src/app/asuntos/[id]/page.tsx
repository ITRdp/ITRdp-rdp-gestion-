import Link from "next/link";
import { notFound } from "next/navigation";
import { softDeleteMatterAction } from "@/app/actions/matters";
import { ActuacionForm } from "@/components/ActuacionForm";
import { AppShell } from "@/components/AppShell";
import { CompleteTaskButton } from "@/components/CompleteTaskButton";
import { EmptyState } from "@/components/EmptyState";
import { MatterEditForm } from "@/components/MatterEditForm";
import { TaskForm } from "@/components/TaskForm";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireMember } from "@/lib/auth";
import {
  labelOf,
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_STAGES,
  MATTER_STATUSES,
} from "@/lib/catalogs";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatCOP } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { Actuacion, Client, Matter, Member } from "@/lib/types";

type Params = { id: string };

export default async function MatterDetailPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const member = await requireMember();
  const supabase = await createClient();

  const [
    { data: matter },
    { data: actuaciones },
    { data: tasks },
    { data: members },
    { data: clients },
    { data: team },
  ] = await Promise.all([
    supabase
      .from("matters")
      .select(
        `
        *,
        clients ( id, name, document_type, document_number, document_dv, email, phone ),
        responsible:members!matters_responsible_lawyer_id_fkey ( id, full_name, email ),
        creator:members!matters_created_by_fkey ( full_name )
      `,
      )
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("actuaciones")
      .select(
        `*, author:members!actuaciones_author_id_fkey ( full_name, email )`,
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
    supabase.from("members").select("*").eq("enabled", true).order("full_name"),
    supabase
      .from("clients")
      .select("id, name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("matter_team")
      .select(
        `*, member:members!matter_team_member_id_fkey ( full_name, role )`,
      )
      .eq("matter_id", id),
  ]);

  if (!matter) notFound();

  const client = Array.isArray(matter.clients)
    ? matter.clients[0]
    : matter.clients;
  const responsible = Array.isArray(matter.responsible)
    ? matter.responsible[0]
    : matter.responsible;
  const creator = Array.isArray(matter.creator)
    ? matter.creator[0]
    : matter.creator;

  const defaultTab = tab ?? "resumen";

  return (
    <AppShell member={member}>
      <p className="fade-in mb-4">
        <Link
          href="/asuntos"
          className="text-sm text-[var(--gold-500)] underline-offset-4 hover:underline"
        >
          ← Volver a asuntos
        </Link>
      </p>

      <header className="fade-in mb-6">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="badge">{matter.code}</span>
          <span className="badge capitalize">
            {labelOf(MATTER_STATUSES, matter.status)}
          </span>
          <span className="badge">
            {labelOf(MATTER_STAGES, matter.stage)}
          </span>
          <span className="badge badge-gold capitalize">
            {labelOf(MATTER_PRIORITIES, matter.priority)}
          </span>
          {matter.procedural_deadline ? (
            <span className="badge badge-gold">
              Venc. procesal {formatDate(matter.procedural_deadline)}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-3xl text-[var(--wine-900)] sm:text-4xl">
          {matter.title}
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Cliente:{" "}
          <Link
            href={`/clientes/${client?.id}`}
            className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
          >
            {client?.name}
          </Link>
          {" · "}
          {labelOf(MATTER_AREAS, matter.area)}
        </p>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="tiempo">Tiempo</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="grid gap-6 lg:grid-cols-2">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:col-span-2">
            <div className="surface rounded-md p-3">
              <dt className="hint">Responsable</dt>
              <dd className="font-medium">{responsible?.full_name ?? "—"}</dd>
            </div>
            <div className="surface rounded-md p-3">
              <dt className="hint">Alta</dt>
              <dd className="font-medium">
                {creator?.full_name ?? "—"} · {formatDateTime(matter.created_at)}
              </dd>
            </div>
            <div className="surface rounded-md p-3">
              <dt className="hint">Contraparte(s)</dt>
              <dd className="font-medium">{matter.counterparts || "—"}</dd>
            </div>
            <div className="surface rounded-md p-3">
              <dt className="hint">Radicado</dt>
              <dd className="font-medium">{matter.radicado || "—"}</dd>
            </div>
            <div className="surface rounded-md p-3">
              <dt className="hint">Despacho / ciudad</dt>
              <dd className="font-medium">
                {[matter.court_name, matter.city].filter(Boolean).join(" · ") ||
                  "—"}
              </dd>
            </div>
            <div className="surface rounded-md p-3">
              <dt className="hint">Cuantía / honorarios</dt>
              <dd className="font-medium">
                {formatCOP(matter.amount_cop)} · {formatCOP(matter.fees_cop)}
              </dd>
            </div>
          </dl>

          <div>
            <h2 className="font-display mb-3 text-lg text-[var(--wine-900)]">
              Equipo
            </h2>
            {!team?.length ? (
              <p className="hint">Sin equipo adicional.</p>
            ) : (
              <ul className="grid gap-2">
                {team.map((t) => {
                  const m = Array.isArray(t.member) ? t.member[0] : t.member;
                  return (
                    <li key={t.id} className="surface rounded-md px-3 py-2 text-sm">
                      {m?.full_name ?? "—"}{" "}
                      <span className="text-[var(--muted)]">
                        · {t.role_in_matter}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="lg:col-span-2">
            <h2 className="font-display mb-3 text-lg text-[var(--wine-900)]">
              Editar asunto
            </h2>
            <MatterEditForm
              matter={matter as Matter}
              clients={(clients ?? []) as Pick<Client, "id" | "name">[]}
              members={(members ?? []) as Member[]}
            />
            {member.role === "admin" ? (
              <form
                action={async () => {
                  "use server";
                  await softDeleteMatterAction(id);
                }}
                className="mt-4"
              >
                <Button type="submit" variant="destructive" size="sm">
                  Soft delete (solo admin)
                </Button>
              </form>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="actividad" className="grid gap-6 lg:grid-cols-2">
          <ActuacionForm matterId={matter.id} />
          <section>
            <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
              Actuaciones
            </h2>
            {!actuaciones?.length ? (
              <EmptyState title="Todavía no hay actuaciones registradas." />
            ) : (
              <ol className="grid gap-3">
                {actuaciones.map((a) => {
                  const author = Array.isArray(a.author)
                    ? a.author[0]
                    : a.author;
                  return (
                    <li key={a.id} className="surface rounded-md p-4">
                      <p className="text-[var(--ink)]">{a.description}</p>
                      {a.onedrive_url ? (
                        <p className="mt-2">
                          <a
                            href={a.onedrive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[var(--gold-500)] underline-offset-2 hover:underline"
                          >
                            Abrir documento OneDrive
                          </a>
                        </p>
                      ) : null}
                      <p className="mt-3 text-xs text-[var(--muted)]">
                        Registrada por{" "}
                        <strong>{author?.full_name ?? "—"}</strong> el{" "}
                        {formatDateTime(a.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </TabsContent>

        <TabsContent value="tareas" className="grid gap-6 lg:grid-cols-2">
          <TaskForm
            matterId={matter.id}
            members={(members ?? []) as Member[]}
            actuaciones={(actuaciones ?? []) as Actuacion[]}
          />
          <section>
            <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
              Tareas y auditoría
            </h2>
            {!tasks?.length ? (
              <EmptyState title="No hay tareas en este asunto." />
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
                    <li key={task.id} className="surface rounded-md p-4">
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span
                          className={`badge capitalize ${
                            task.status === "completada" ? "badge-ok" : ""
                          }`}
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
                        Encargado:{" "}
                        <strong>{assignee?.full_name ?? "—"}</strong>
                        {" · "}
                        Asignada por {taskCreator?.full_name ?? "—"} el{" "}
                        {formatDateTime(task.created_at)}
                      </p>
                      {task.status === "completada" ? (
                        <p className="mt-1 text-sm text-[var(--success)]">
                          Completada por{" "}
                          <strong>{completer?.full_name ?? "—"}</strong> el{" "}
                          {formatDateTime(task.completed_at)}
                        </p>
                      ) : null}
                      {mine ? (
                        <div className="mt-3">
                          <CompleteTaskButton
                            taskId={task.id}
                            matterId={matter.id}
                          />
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="agenda">
          <EmptyState
            title="Agenda (próximamente)"
            description="Stub Fase 2: calendarios y audiencias llegan en fases posteriores."
          />
        </TabsContent>
        <TabsContent value="documentos">
          <EmptyState
            title="Documentos (próximamente)"
            description="Stub Fase 2: Storage y expediente digital llegan después. Por ahora usa enlaces OneDrive en actuaciones."
          />
        </TabsContent>
        <TabsContent value="tiempo">
          <EmptyState
            title="Tiempo (próximamente)"
            description="Stub Fase 2: registro de horas se implementará en una fase posterior."
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
