"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addTaskCommentAction,
  updateTaskChecklistAction,
  updateTaskStatusAction,
  type TaskState,
} from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormSelect } from "@/components/ui/select";
import { TASK_STATUSES, labelOf } from "@/lib/catalogs";
import type { ChecklistItem, TaskComment, TaskStatus } from "@/lib/types";
import { formatDateTime } from "@/lib/format";

const initial: TaskState = {};

export function TaskStatusSelect({
  taskId,
  matterId,
  status,
}: {
  taskId: string;
  matterId: string;
  status: TaskStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <FormSelect
      value={status}
      disabled={pending}
      triggerClassName="h-8 text-xs capitalize"
      options={TASK_STATUSES.map((s) => ({
        value: s.value,
        label: s.label,
      }))}
      onValueChange={(v) =>
        start(async () => {
          const res = await updateTaskStatusAction(
            taskId,
            matterId,
            v as TaskStatus,
          );
          if (res.error) toast.error(res.error);
          else toast.success("Estado actualizado");
        })
      }
    />
  );
}

export function TaskChecklist({
  taskId,
  matterId,
  checklist,
}: {
  taskId: string;
  matterId: string;
  checklist: ChecklistItem[];
}) {
  const [items, setItems] = useState(checklist ?? []);
  const [pending, start] = useTransition();

  if (!items.length) return null;

  return (
    <ul className="mt-3 grid gap-1">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={item.done}
            disabled={pending}
            onChange={(e) => {
              const next = items.map((x) =>
                x.id === item.id ? { ...x, done: e.target.checked } : x,
              );
              setItems(next);
              start(async () => {
                await updateTaskChecklistAction(taskId, matterId, next);
              });
            }}
          />
          <span className={item.done ? "text-[var(--muted)] line-through" : ""}>
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function TaskComments({
  taskId,
  matterId,
  comments,
}: {
  taskId: string;
  matterId: string;
  comments: (TaskComment & {
    author?: { full_name: string } | { full_name: string }[] | null;
  })[];
}) {
  const [state, formAction, pending] = useActionState(
    addTaskCommentAction,
    initial,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <div className="mt-3 border-t border-[var(--line)] pt-3">
      <p className="hint mb-2">Comentarios (usa @Nombre para mencionar)</p>
      <ul className="mb-3 grid gap-2">
        {comments.map((c) => {
          const author = Array.isArray(c.author) ? c.author[0] : c.author;
          return (
            <li key={c.id} className="text-sm">
              <strong>{author?.full_name ?? "—"}</strong>{" "}
              <span className="text-xs text-[var(--muted)]">
                {formatDateTime(c.created_at)}
              </span>
              <p className="text-[var(--ink)]">{c.body}</p>
            </li>
          );
        })}
      </ul>
      <form action={formAction} className="grid gap-2">
        <input type="hidden" name="task_id" value={taskId} />
        <input type="hidden" name="matter_id" value={matterId} />
        <Label htmlFor={`comment-${taskId}`}>Nuevo comentario</Label>
        <textarea
          id={`comment-${taskId}`}
          name="body"
          required
          placeholder="@Ana revisar esto…"
          className="min-h-[3.5rem]"
        />
        <Button type="submit" size="sm" className="w-fit" disabled={pending}>
          {pending ? "Enviando…" : "Comentar"}
        </Button>
      </form>
    </div>
  );
}

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge capitalize ${
        status === "completada" ? "badge-ok" : ""
      }`}
    >
      {labelOf(TASK_STATUSES, status)}
    </span>
  );
}
