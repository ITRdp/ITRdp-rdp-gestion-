"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EVENT_TYPES, labelOf } from "@/lib/catalogs";
import { formatDate, formatDateTime } from "@/lib/format";
import { toISODate } from "@/lib/business-days";
import type { CalendarEvent } from "@/lib/types";

type MatterLite = { id: string; code: string; title: string } | null;

export type AgendaEventRow = CalendarEvent & {
  matters?: MatterLite | MatterLite[] | null;
};

function matterOf(e: AgendaEventRow) {
  const m = Array.isArray(e.matters) ? e.matters[0] : e.matters;
  return m ?? null;
}

function startOfMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, 1, 12);
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function AgendaViews({
  events,
  holidays,
  anchor,
}: {
  events: AgendaEventRow[];
  holidays: { day: string; name: string }[];
  anchor: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const vista = params.get("vista") ?? "mes";
  const holidayMap = new Map(holidays.map((h) => [h.day.slice(0, 10), h.name]));

  function setVista(v: string) {
    const next = new URLSearchParams(params.toString());
    next.set("vista", v);
    router.push(`/agenda?${next.toString()}`);
  }

  function shift(days: number) {
    const next = new URLSearchParams(params.toString());
    const d = addDays(new Date(`${anchor}T12:00:00`), days);
    next.set("fecha", toISODate(d));
    router.push(`/agenda?${next.toString()}`);
  }

  function shiftMonth(delta: number) {
    const next = new URLSearchParams(params.toString());
    const d = startOfMonth(anchor);
    d.setMonth(d.getMonth() + delta);
    next.set("fecha", toISODate(d));
    router.push(`/agenda?${next.toString()}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-[var(--line)] p-0.5">
          {[
            ["mes", "Mes"],
            ["semana", "Semana"],
            ["lista", "Lista"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`rounded px-3 py-1.5 text-sm ${
                vista === id
                  ? "bg-[var(--wine-900)] text-white"
                  : "text-[var(--muted)]"
              }`}
              onClick={() => setVista(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => (vista === "mes" ? shiftMonth(-1) : shift(-7))}
        >
          ←
        </button>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => {
            const next = new URLSearchParams(params.toString());
            next.set("fecha", toISODate(new Date()));
            router.push(`/agenda?${next.toString()}`);
          }}
        >
          Hoy
        </button>
        <button
          type="button"
          className="btn btn-secondary text-sm"
          onClick={() => (vista === "mes" ? shiftMonth(1) : shift(7))}
        >
          →
        </button>
        <p className="ml-2 text-sm font-medium text-[var(--wine-900)]">
          {formatDate(anchor)}
        </p>
      </div>

      {vista === "lista" ? (
        <ListaView events={events} />
      ) : vista === "semana" ? (
        <SemanaView
          events={events}
          anchor={anchor}
          holidayMap={holidayMap}
        />
      ) : (
        <MesView events={events} anchor={anchor} holidayMap={holidayMap} />
      )}
    </div>
  );
}

function ListaView({ events }: { events: AgendaEventRow[] }) {
  if (!events.length) {
    return (
      <p className="hint">No hay eventos en el rango seleccionado.</p>
    );
  }
  return (
    <ul className="grid gap-2">
      {events.map((e) => {
        const m = matterOf(e);
        return (
          <li key={e.id} className="surface rounded-md p-3">
            <div className="flex flex-wrap gap-2">
              <span className="badge">
                {labelOf(EVENT_TYPES, e.event_type)}
              </span>
              <span className="text-sm text-[var(--muted)]">
                {e.all_day
                  ? formatDate(e.starts_at)
                  : formatDateTime(e.starts_at)}
              </span>
            </div>
            <p className="mt-1 font-medium text-[var(--wine-900)]">{e.title}</p>
            {m ? (
              <Link
                href={`/asuntos/${m.id}`}
                className="text-sm text-[var(--gold-500)] hover:underline"
              >
                {m.code} · {m.title}
              </Link>
            ) : null}
            {e.location ? (
              <p className="text-xs text-[var(--muted)]">{e.location}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function eventsOnDay(events: AgendaEventRow[], iso: string) {
  return events.filter((e) => e.starts_at.slice(0, 10) === iso);
}

function MesView({
  events,
  anchor,
  holidayMap,
}: {
  events: AgendaEventRow[];
  anchor: string;
  holidayMap: Map<string, string>;
}) {
  const first = startOfMonth(anchor);
  const startPad = (first.getDay() + 6) % 7; // Monday=0
  const gridStart = addDays(first, -startPad);
  const today = toISODate(new Date());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs font-semibold uppercase text-[var(--muted)]">
        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === first.getMonth();
          const holiday = holidayMap.get(iso);
          const dayEvents = eventsOnDay(events, iso);
          return (
            <div
              key={iso}
              className={`agenda-day-cell ${iso === today ? "is-today" : ""} ${
                holiday ? "is-holiday" : ""
              } ${!inMonth ? "opacity-40" : ""}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{d.getDate()}</span>
                {holiday ? (
                  <span className="truncate text-[10px] text-[var(--wine-700)]">
                    {holiday}
                  </span>
                ) : null}
              </div>
              {dayEvents.slice(0, 3).map((e) => (
                <span
                  key={e.id}
                  className={`agenda-event-chip ${e.event_type}`}
                  title={e.title}
                >
                  {e.title}
                </span>
              ))}
              {dayEvents.length > 3 ? (
                <span className="text-[10px] text-[var(--muted)]">
                  +{dayEvents.length - 3}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SemanaView({
  events,
  anchor,
  holidayMap,
}: {
  events: AgendaEventRow[];
  anchor: string;
  holidayMap: Map<string, string>;
}) {
  const d = new Date(`${anchor}T12:00:00`);
  const mondayOffset = (d.getDay() + 6) % 7;
  const monday = addDays(d, -mondayOffset);
  const today = toISODate(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => {
        const iso = toISODate(day);
        const holiday = holidayMap.get(iso);
        const dayEvents = eventsOnDay(events, iso);
        return (
          <div
            key={iso}
            className={`agenda-day-cell ${iso === today ? "is-today" : ""} ${
              holiday ? "is-holiday" : ""
            }`}
          >
            <p className="text-xs font-semibold text-[var(--wine-900)]">
              {formatDate(iso)}
            </p>
            {holiday ? (
              <p className="text-[10px] text-[var(--wine-700)]">{holiday}</p>
            ) : null}
            <ul className="mt-1 grid gap-1">
              {dayEvents.map((e) => (
                <li key={e.id}>
                  <span className={`agenda-event-chip ${e.event_type}`}>
                    {e.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
