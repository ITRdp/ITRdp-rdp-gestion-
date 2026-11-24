"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createTaskAction, type TaskState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FormSelect } from "@/components/ui/select";
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
          <FormSelect
            id="template_id"
            name="template_id"
            defaultValue=""
            placeholder="Sin plantilla"
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />
        </div>
      ) : null}

      <div className="field">
        <Label htmlFor="actuacion_id">Vinculada a actuación (opcional)</Label>
        <FormSelect
          id="actuacion_id"
          name="actuacion_id"
          defaultValue=""
          placeholder="Sin vincular"
          options={actuaciones.map((a) => ({
            value: a.id,
            label:
              a.description.slice(0, 80) +
              (a.description.length > 80 ? "…" : ""),
          }))}
        />
      </div>

      <div className="field">
        <Label htmlFor="assignee_id">Encargado de la tarea</Label>
        <FormSelect
          id="assignee_id"
          name="assignee_id"
          required
          defaultValue=""
          placeholder="Selecciona un miembro"
          options={members.map((m) => ({
            value: m.id,
            label: m.full_name,
          }))}
        />
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
          <FormSelect
            id="priority"
            name="priority"
            defaultValue="media"
            options={TASK_PRIORITIES.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="follow_up_date">Fecha de seguimiento</Label>
          <DatePicker
            id="follow_up_date"
            name="follow_up_date"
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
