"use client";

import { useActionState } from "react";
import { createTaskAction, type TaskState } from "@/app/actions/tasks";
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

  return (
    <form action={formAction} className="surface grid gap-4 p-5">
      <div>
        <h3 className="font-display text-lg text-[var(--wine)]">Asignar tarea</h3>
        <p className="hint mt-1">
          El encargado de la tarea puede ser distinto del abogado responsable del
          asunto. La fecha de seguimiento es interna, no el vencimiento procesal.
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
        <label htmlFor="actuacion_id">Vinculada a actuación (opcional)</label>
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
        <label htmlFor="assignee_id">Encargado de la tarea</label>
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
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          required
          placeholder="Qué debe hacer el encargado"
        />
      </div>

      <div className="field">
        <label htmlFor="follow_up_date">Fecha de seguimiento</label>
        <input
          id="follow_up_date"
          name="follow_up_date"
          type="date"
          required
          defaultValue={todayISO()}
        />
      </div>

      <button type="submit" className="btn btn-gold w-fit" disabled={pending}>
        {pending ? "Asignando…" : "Asignar tarea"}
      </button>
    </form>
  );
}
