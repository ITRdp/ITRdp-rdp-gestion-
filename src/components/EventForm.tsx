"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { createEventAction, type FormState } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EVENT_TYPES } from "@/lib/catalogs";

const initial: FormState = {};

export function EventForm({
  matters,
}: {
  matters: { id: string; code: string; title: string }[];
}) {
  const [state, formAction, pending] = useActionState(createEventAction, initial);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="surface grid gap-3 rounded-md p-4">
      <h2 className="font-display text-lg text-[var(--wine-900)]">Nuevo evento</h2>
      {state.error ? (
        <div className="alert" role="alert">
          {state.error}
        </div>
      ) : null}
      <div className="field">
        <Label htmlFor="title">Título</Label>
        <Input id="title" name="title" required placeholder="Audiencia / reunión…" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field">
          <Label htmlFor="event_type">Tipo</Label>
          <select id="event_type" name="event_type" defaultValue="audiencia">
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="matter_id">Asunto (opcional)</Label>
          <select id="matter_id" name="matter_id" defaultValue="">
            <option value="">Sin vincular</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.code} · {m.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="starts_at">Inicio</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required />
        </div>
        <div className="field">
          <Label htmlFor="ends_at">Fin (opcional)</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="location">Lugar</Label>
          <Input id="location" name="location" placeholder="Juzgado / Teams / oficina" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" name="all_day" />
        Todo el día
      </label>
      <div className="field">
        <Label htmlFor="description">Notas</Label>
        <textarea id="description" name="description" />
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando…" : "Crear evento"}
      </Button>
    </form>
  );
}
