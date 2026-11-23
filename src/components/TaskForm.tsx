"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createTaskAction, type TaskState } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Actuacion, Member } from "@/lib/types";
import { todayISO } from "@/lib/format";

const initial: TaskState = {};

export function TaskForm({
  matterId,
  members,
  actuaciones,
}: {
  matterId: string;
  members: Member[];
  actuaciones: Actuacion[];
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
          El encargado de la tarea puede ser distinto del abogado responsable
          del asunto. La fecha de seguimiento es interna, no el vencimiento
          procesal.
        </p>
      </div>

      <input type="hidden" name="matter_id" value={matterId} />

      {state.error && (
        <div className="alert" role="alert">
          {state.error}
        </div>
      )}
      {state.success && <div className="alert alert-ok">{state.success}</div>}

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
          required
          placeholder="Qué debe hacer el encargado"
        />
      </div>

      <div className="field">
        <Label htmlFor="follow_up_date">Fecha de seguimiento</Label>
        <Input
          id="follow_up_date"
          name="follow_up_date"
          type="date"
          required
          defaultValue={todayISO()}
        />
      </div>

      <Button type="submit" variant="gold" className="w-fit" disabled={pending}>
        {pending ? "Asignando…" : "Asignar tarea"}
      </Button>
    </form>
  );
}
