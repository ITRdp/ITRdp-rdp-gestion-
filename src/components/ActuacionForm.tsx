"use client";

import { useActionState } from "react";
import {
  createActuacionAction,
  type ActuacionState,
} from "@/app/actions/actuaciones";

const initial: ActuacionState = {};

export function ActuacionForm({ matterId }: { matterId: string }) {
  const [state, formAction, pending] = useActionState(createActuacionAction, initial);

  return (
    <form action={formAction} className="surface grid gap-4 p-5">
      <div>
        <h3 className="font-display text-lg text-[var(--wine)]">Registrar actuación</h3>
        <p className="hint mt-1">
          Documenta la gestión realizada. Puedes enlazar un documento en OneDrive.
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
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          required
          placeholder="Qué se ha hecho, con quién y resultado"
        />
      </div>

      <div className="field">
        <label htmlFor="onedrive_url">Enlace OneDrive (opcional)</label>
        <input
          id="onedrive_url"
          name="onedrive_url"
          type="url"
          placeholder="https://…"
        />
      </div>

      <button type="submit" className="btn btn-primary w-fit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar actuación"}
      </button>
    </form>
  );
}
