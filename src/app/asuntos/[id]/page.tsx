import Link from "next/link";
import { notFound } from "next/navigation";
import { softDeleteMatterAction } from "@/app/actions/matters";
import { ActuacionForm } from "@/components/ActuacionForm";
import { ActivityTimeline } from "@/components/activity/activity-timeline";
import { AppShellHost as AppShell } from "@/components/AppShellHost";
import { CompleteTaskButton } from "@/components/CompleteTaskButton";
import { DocumentsPanel } from "@/components/documents/documents-panel";
import { EmptyState } from "@/components/EmptyState";
import { MatterEditForm } from "@/components/MatterEditForm";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { TaskForm } from "@/components/TaskForm";
import {
  TaskChecklist,
  TaskComments,
  TaskStatusBadge,
  TaskStatusSelect,
} from "@/components/TaskExtras";
import { TimePanel } from "@/components/time/time-panel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireMember } from "@/lib/auth";
import { holidaySet } from "@/lib/business-days";
import {
  EVENT_TYPES,
  labelOf,
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_STAGES,
  MATTER_STATUSES,
  TASK_PRIORITIES,
} from "@/lib/catalogs";
import { formatDate, formatDateTime, todayISO } from "@/lib/format";
import { formatCOP } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type {
  Actuacion,
  ActivityLogEntry,
  ChecklistItem,
  Client,
  Matter,
  MatterDocument,
  Member,
  TaskStatus,
  TaskTemplate,
  TimeEntry,
} from "@/lib/types";

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
    { data: templates },
    { data: matterEvents },
    { data: holidays },
    { data: taskComments },
    { data: activityLog },
    { data: documents },
    { data: timeEntries },
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
    supabase.from("task_templates").select("*").order("name"),
    supabase
      .from("events")
      .select("*")
      .eq("matter_id", id)
      .order("starts_at", { ascending: true }),
    supabase.from("non_business_days").select("day"),
    supabase
      .from("task_comments")
      .select(
        `*, author:members!task_comments_author_id_fkey ( full_name ), tasks!inner(matter_id)`,
      )
      .eq("tasks.matter_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("activity_log")
      .select("*")
      .eq("matter_id", id)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("documents")
      .select("*")
      .eq("matter_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_entries")
      .select("*")
      .eq("matter_id", id)
      .order("started_at", { ascending: false }),
  ]);

  const holidaysSet = holidaySet(holidays ?? []);
  const today = todayISO();
  const commentsByTask = new Map<string, NonNullable<typeof taskComments>>();
  for (const c of taskComments ?? []) {
    const list = commentsByTask.get(c.task_id) ?? [];
    list.push(c);
    commentsByTask.set(c.task_id, list);
  }

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

  const actorNames: Record<string, string> = {};
  for (const m of (members as Member[] | null) ?? []) {
    actorNames[m.id] = m.full_name;
  }

  const docs = (documents ?? []) as MatterDocument[];
  const times = (timeEntries ?? []) as TimeEntry[];
  const activeEntry =
    times.find((t) => !t.ended_at && t.member_id === member.id) ?? null;
  const activity = (activityLog ?? []) as ActivityLogEntry[];

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
            <SemaforoBadge
              deadline={matter.procedural_deadline}
              today={today}
              holidays={holidaysSet}
              prefix="Venc. procesal"
            />
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
          <div className="grid gap-6">
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
          </div>
          <section>
            <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
              Línea de tiempo
            </h2>
            <ActivityTimeline entries={activity} actorNames={actorNames} />
          </section>
        </TabsContent>

        <TabsContent value="tareas" className="grid gap-6 lg:grid-cols-2">
          <TaskForm
            matterId={matter.id}
            members={(members ?? []) as Member[]}
            actuaciones={(actuaciones ?? []) as Actuacion[]}
            templates={(templates ?? []) as TaskTemplate[]}
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
                    (task.status === "pendiente" || task.status === "en_curso");
                  const checklist = (task.checklist ?? []) as ChecklistItem[];

                  return (
                    <li key={task.id} className="surface rounded-md p-4">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <TaskStatusBadge status={task.status} />
                        <TaskStatusSelect
                          taskId={task.id}
                          matterId={matter.id}
                          status={task.status as TaskStatus}
                        />
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
                        />
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
                      <TaskChecklist
                        taskId={task.id}
                        matterId={matter.id}
                        checklist={checklist}
                      />
                      {mine ? (
                        <div className="mt-3">
                          <CompleteTaskButton
                            taskId={task.id}
                            matterId={matter.id}
                          />
                        </div>
                      ) : null}
                      <TaskComments
                        taskId={task.id}
                        matterId={matter.id}
                        comments={commentsByTask.get(task.id) ?? []}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="agenda">
          {!matterEvents?.length ? (
            <EmptyState
              title="Sin eventos en este asunto"
              description="Crea audiencias o reuniones desde Agenda y vincúlalas a este asunto."
            />
          ) : (
            <ul className="grid gap-2">
              {matterEvents.map((e) => (
                <li key={e.id} className="surface rounded-md p-3 text-sm">
                  <span className="badge mr-2">
                    {labelOf(EVENT_TYPES, e.event_type)}
                  </span>
                  <span className="font-medium">{e.title}</span>
                  <p className="mt-1 text-[var(--muted)]">
                    {formatDateTime(e.starts_at)}
                    {e.location ? ` · ${e.location}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4">
            <Link href="/agenda" className="text-sm text-[var(--gold-500)] hover:underline">
              Abrir Agenda completa
            </Link>
          </p>
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentsPanel matterId={matter.id} documents={docs} />
        </TabsContent>
        <TabsContent value="tiempo">
          <TimePanel
            matterId={matter.id}
            entries={times}
            activeEntry={activeEntry}
          />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
