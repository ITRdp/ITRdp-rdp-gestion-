"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  createActuacionAction,
  type ActuacionState,
} from "@/app/actions/actuaciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActuacionState = {};

export function ActuacionForm({ matterId }: { matterId: string }) {
  const [state, formAction, pending] = useActionState(
    createActuacionAction,
    initial,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="surface grid gap-4 rounded-md p-5">
      <div>
        <h3 className="font-display text-lg text-[var(--wine-900)]">
          Registrar actuación
        </h3>
        <p className="hint mt-1">
          Documenta la gestión realizada. Puedes enlazar un documento en
          OneDrive.
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
        <Label htmlFor="description">Descripción</Label>
        <textarea
          id="description"
          name="description"
          required
          placeholder="Qué se ha hecho, con quién y resultado"
        />
      </div>

      <div className="field">
        <Label htmlFor="onedrive_url">Enlace OneDrive (opcional)</Label>
        <Input
          id="onedrive_url"
          name="onedrive_url"
          type="url"
          placeholder="https://…"
        />
      </div>

      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar actuación"}
      </Button>
    </form>
  );
}
