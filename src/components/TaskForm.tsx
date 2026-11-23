"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createTaskAction, type TaskState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TASK_PRIORITIES } from "@/lib/catalogs";
import type { Actuacion, Member, TaskTemplate } from "@/lib/types";
import { todayISO } from "@/lib/format";

const initial: TaskState = {};

export function TaskForm({
  matterId,
  members,
  actuaciones,
  templates = [],
}: {
  matterId: string;
  members: Member[];
  actuaciones: Actuacion[];
  templates?: TaskTemplate[];
}) {
  const [state, formAction, pending] = useActionState(createTaskAction, initial);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="surface grid gap-4 rounded-md p-5">
      <div>
        <h3 className="font-display text-lg text-[var(--wine-900)]">
          Asignar tarea
        </h3>
        <p className="hint mt-1">
          Prioridad, checklist y plantillas. La fecha de seguimiento es interna;
          el semáforo usa días hábiles CO.
        </p>
      </div>

      <input type="hidden" name="matter_id" value={matterId} />

      {state.error && (
        <div className="alert" role="alert">
          {state.error}
        </div>
      )}
      {state.success && <div className="alert alert-ok">{state.success}</div>}

      {templates.length > 0 ? (
        <div className="field">
          <Label htmlFor="template_id">Plantilla (opcional)</Label>
          <select id="template_id" name="template_id" defaultValue="">
            <option value="">Sin plantilla</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <Label htmlFor="actuacion_id">Vinculada a actuación (opcional)</Label>
        <select id="actuacion_id" name="actuacion_id" defaultValue="">
          <option value="">Sin vincular</option>
          {actuaciones.map((a) => (
            <option key={a.id} value={a.id}>
              {a.description.slice(0, 80)}
              {a.description.length > 80 ? "…" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <Label htmlFor="assignee_id">Encargado de la tarea</Label>
        <select id="assignee_id" name="assignee_id" required defaultValue="">
          <option value="" disabled>
            Selecciona un miembro
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          placeholder="Qué debe hacer el encargado (o usa plantilla)"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field">
          <Label htmlFor="priority">Prioridad</Label>
          <select id="priority" name="priority" defaultValue="media">
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="follow_up_date">Fecha de seguimiento</Label>
          <Input
            id="follow_up_date"
            name="follow_up_date"
            type="date"
            defaultValue={todayISO()}
          />
        </div>
      </div>

      <div className="field">
        <Label htmlFor="checklist">Checklist (una línea por ítem)</Label>
        <textarea
          id="checklist"
          name="checklist"
          placeholder={"Revisar expediente\nConfirmar con cliente"}
        />
      </div>

      <Button type="submit" variant="gold" className="w-fit" disabled={pending}>
        {pending ? "Asignando…" : "Asignar tarea"}
      </Button>
    </form>
  );
}
