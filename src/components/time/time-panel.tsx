"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  addManualTimeAction,
  startTimerAction,
  stopTimerAction,
  type FormState,
} from "@/app/actions/time";
import type { TimeEntry } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";

const initial: FormState = {};

function formatDuration(mins: number | null) {
  if (mins === null || mins === undefined) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h <= 0) return `${m} min`;
  return `${h} h ${m.toString().padStart(2, "0")} min`;
}

function elapsedLabel(startedAt: string, now: number) {
  const secs = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function TimePanel({
  matterId,
  entries,
  activeEntry,
}: {
  matterId: string;
  entries: TimeEntry[];
  activeEntry: TimeEntry | null;
}) {
  const [manualState, manualAction, manualPending] = useActionState(
    addManualTimeAction,
    initial,
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!activeEntry) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeEntry]);

  const totalMins = entries
    .filter((e) => e.ended_at && e.duration_minutes)
    .reduce((acc, e) => acc + (e.duration_minutes ?? 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface rounded-md p-4">
        <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
          Cronómetro
        </h2>
        {activeEntry ? (
          <div className="grid gap-3">
            <p className="font-mono text-3xl tracking-wide text-[var(--wine-900)]">
              {elapsedLabel(activeEntry.started_at, now)}
            </p>
            <p className="text-sm text-[var(--muted)]">
              Iniciado {formatDateTime(activeEntry.started_at)}
            </p>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await stopTimerAction(activeEntry.id);
                  if (res.error) setError(res.error);
                })
              }
            >
              Detener y guardar
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            <p className="text-sm text-[var(--muted)]">
              Inicia el cronómetro para registrar tiempo real sobre este asunto.
            </p>
            <Button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await startTimerAction(matterId);
                  if (res.error) setError(res.error);
                })
              }
            >
              Iniciar cronómetro
            </Button>
          </div>
        )}
        {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

        <hr className="my-6 border-[var(--line)]" />

        <h3 className="mb-3 font-medium text-[var(--ink)]">Carga manual</h3>
        <form action={manualAction} className="grid gap-3">
          <input type="hidden" name="matter_id" value={matterId} />
          <div>
            <Label htmlFor="mins">Minutos</Label>
            <Input
              id="mins"
              name="duration_minutes"
              type="number"
              min={1}
              step={1}
              required
            />
          </div>
          <div>
            <Label htmlFor="tdesc">Descripción</Label>
            <Input id="tdesc" name="description" placeholder="Revisión memorial…" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="billable" defaultChecked />
            Facturable
          </label>
          {manualState.error ? (
            <p className="text-sm text-red-700">{manualState.error}</p>
          ) : null}
          {manualState.success ? (
            <p className="text-sm text-emerald-700">{manualState.success}</p>
          ) : null}
          <Button type="submit" variant="secondary" disabled={manualPending}>
            {manualPending ? "Guardando…" : "Registrar tiempo"}
          </Button>
        </form>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-[var(--wine-900)]">
            Historial
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Total cerrado: <strong>{formatDuration(totalMins)}</strong>
          </p>
        </div>
        {!entries.length ? (
          <EmptyState title="Sin entradas de tiempo." />
        ) : (
          <ul className="grid gap-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white/60 px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-[var(--ink)]">
                    {e.description || "Sesión"}
                    {!e.ended_at ? (
                      <span className="ml-2 text-xs text-amber-700">
                        en curso
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDateTime(e.started_at)}
                    {e.ended_at ? ` → ${formatDateTime(e.ended_at)}` : ""}
                  </p>
                </div>
                <span className="font-medium text-[var(--wine-900)]">
                  {e.ended_at
                    ? formatDuration(e.duration_minutes)
                    : elapsedLabel(e.started_at, now)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
