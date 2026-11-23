"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addNonBusinessDayAction,
  deleteNonBusinessDayAction,
  inviteMemberAction,
  setMemberEnabledAction,
  updateMemberRoleAction,
  updateMyNotificationPrefsAction,
  updateStageDefAction,
  type FormState,
} from "@/app/actions/admin";
import type {
  MatterStageDef,
  Member,
  MemberRole,
  NonBusinessDay,
} from "@/lib/types";
import { formatDate } from "@/lib/format";
import {
  DOCUMENT_TYPES,
  EVENT_TYPES,
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_PROCEDURE_TYPES,
  MATTER_STAGES,
  MATTER_STATUSES,
  MEMBER_ROLES,
  PERSON_TYPES,
  TASK_STATUSES,
} from "@/lib/catalogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";

const initial: FormState = {};

const HOLIDAY_KINDS = [
  { value: "festivo_nacional", label: "Festivo nacional" },
  { value: "festivo_religioso", label: "Festivo religioso" },
  { value: "puente", label: "Puente" },
  { value: "otro", label: "Otro" },
];

export function InviteMemberForm() {
  const [state, action, pending] = useActionState(inviteMemberAction, initial);
  return (
    <form action={action} className="surface grid gap-3 rounded-md p-4">
      <h3 className="font-medium text-[var(--ink)]">Invitar / crear miembro</h3>
      <p className="text-xs text-[var(--muted)]">
        Se crea la cuenta y el perfil. En el primer acceso deberá cambiar la
        contraseña.
      </p>
      <div>
        <Label htmlFor="full_name">Nombre completo</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div>
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">Rol</Label>
        <select
          id="role"
          name="role"
          defaultValue="abogado"
          className="flex h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm"
        >
          {MEMBER_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="temp_password">
          Contraseña inicial (opcional, mín. 8)
        </Label>
        <Input
          id="temp_password"
          name="temp_password"
          type="password"
          autoComplete="new-password"
        />
        <p className="hint mt-1">
          Si la omites, se genera una temporal. El miembro la cambiará al entrar.
        </p>
      </div>
      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear miembro"}
      </Button>
    </form>
  );
}

export function MembersTable({
  members,
  currentId,
}: {
  members: Member[];
  currentId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section>
      <h3 className="font-display mb-3 text-xl text-[var(--wine-900)]">
        Miembros
      </h3>
      {msg ? <p className="mb-2 text-sm text-[var(--muted)]">{msg}</p> : null}
      {!members.length ? (
        <EmptyState title="Sin miembros." />
      ) : (
        <div className="overflow-x-auto rounded-md border border-[var(--line)]">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Correo</th>
                <th className="px-3 py-2">Rol</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-[var(--line)]">
                  <td className="px-3 py-2 font-medium">{m.full_name}</td>
                  <td className="px-3 py-2 text-[var(--muted)]">{m.email}</td>
                  <td className="px-3 py-2">
                    <select
                      className="h-8 rounded-md border border-[var(--line)] bg-white px-2 text-sm"
                      defaultValue={m.role}
                      disabled={pending}
                      onChange={(e) => {
                        const role = e.target.value as MemberRole;
                        const label =
                          MEMBER_ROLES.find((r) => r.value === role)?.label ??
                          role;
                        if (
                          !window.confirm(
                            `¿Cambiar el rol de ${m.full_name} a «${label}»?`,
                          )
                        ) {
                          e.target.value = m.role;
                          return;
                        }
                        startTransition(async () => {
                          const res = await updateMemberRoleAction(m.id, role);
                          setMsg(res.error ?? res.success ?? null);
                        });
                      }}
                    >
                      {MEMBER_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={
                        m.enabled
                          ? "text-emerald-700"
                          : "text-[var(--muted)]"
                      }
                    >
                      {m.enabled ? "Habilitado" : "Deshabilitado"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pending || m.id === currentId}
                      onClick={() => {
                        const next = !m.enabled;
                        if (
                          !window.confirm(
                            next
                              ? `¿Habilitar a ${m.full_name}?`
                              : `¿Deshabilitar a ${m.full_name}? No podrá iniciar sesión.`,
                          )
                        ) {
                          return;
                        }
                        startTransition(async () => {
                          const res = await setMemberEnabledAction(m.id, next);
                          setMsg(res.error ?? res.success ?? null);
                        });
                      }}
                    >
                      {m.enabled ? "Deshabilitar" : "Habilitar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function HolidaysAdmin({ days }: { days: NonBusinessDay[] }) {
  const [state, action, pending] = useActionState(
    addNonBusinessDayAction,
    initial,
  );
  const [delPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={action} className="surface grid gap-3 rounded-md p-4">
        <h3 className="font-medium text-[var(--ink)]">Agregar día no hábil</h3>
        <div>
          <Label htmlFor="day">Fecha</Label>
          <Input id="day" name="day" type="date" required />
        </div>
        <div>
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="kind">Tipo</Label>
          <select
            id="kind"
            name="kind"
            defaultValue="festivo_nacional"
            className="flex h-10 w-full rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          >
            {HOLIDAY_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="notes">Notas</Label>
          <Input id="notes" name="notes" />
        </div>
        {state.error ? (
          <p className="text-sm text-red-700">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-emerald-700">{state.success}</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Agregar"}
        </Button>
      </form>

      <section>
        <h3 className="font-display mb-3 text-xl text-[var(--wine-900)]">
          Calendario no hábil
        </h3>
        {msg ? <p className="mb-2 text-sm text-red-700">{msg}</p> : null}
        {!days.length ? (
          <EmptyState title="Sin días registrados." />
        ) : (
          <ul className="grid max-h-[28rem] gap-2 overflow-y-auto">
            {days.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--line)] bg-white/70 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{d.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatDate(d.day)} · {d.kind}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={delPending}
                  onClick={() =>
                    startTransition(async () => {
                      const res = await deleteNonBusinessDayAction(d.id);
                      if (res.error) setMsg(res.error);
                    })
                  }
                >
                  Eliminar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function StagesAdmin({ stages }: { stages: MatterStageDef[] }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const byType = MATTER_PROCEDURE_TYPES.map((t) => ({
    ...t,
    rows: stages.filter((s) => s.matter_type === t.value),
  }));

  return (
    <section className="grid gap-4">
      <div>
        <h3 className="font-display text-xl text-[var(--wine-900)]">
          Etapas por tipo de asunto
        </h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          «Gestiones adicionales» va antes de Cierre y se puede saltar a ella
          desde cualquier etapa previa en la ficha. «En pausa» es un estado, no
          una etapa.
        </p>
        {msg ? <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p> : null}
      </div>
      {!stages.length ? (
        <EmptyState
          title="Sin etapas en base de datos"
          description="Aplica 20261123140000_prelanzamiento_stages.sql y luego 20261123150000_etapas_acordadas.sql."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {byType.map((t) => (
            <div key={t.value} className="surface rounded-md p-4">
              <h4 className="mb-2 font-medium text-[var(--wine-900)]">
                {t.label}
              </h4>
              <ul className="grid gap-2 text-sm">
                {t.rows.map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-center gap-2 border-b border-[var(--line)] pb-2 last:border-0"
                  >
                    <code className="text-xs text-[var(--muted)]">
                      {s.stage_key}
                    </code>
                    <Input
                      className="h-8 flex-1"
                      defaultValue={s.label}
                      disabled={pending}
                      onBlur={(e) => {
                        const label = e.target.value.trim();
                        if (!label || label === s.label) return;
                        startTransition(async () => {
                          const res = await updateStageDefAction(s.id, {
                            label,
                          });
                          setMsg(res.error ?? res.success ?? null);
                        });
                      }}
                    />
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        defaultChecked={s.enabled}
                        disabled={pending}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          startTransition(async () => {
                            const res = await updateStageDefAction(s.id, {
                              enabled,
                            });
                            setMsg(res.error ?? res.success ?? null);
                          });
                        }}
                      />
                      Activa
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function CatalogsReference() {
  const blocks: { title: string; items: { value: string; label: string }[] }[] =
    [
      { title: "Personas", items: [...PERSON_TYPES] },
      { title: "Documentos", items: [...DOCUMENT_TYPES] },
      { title: "Áreas", items: [...MATTER_AREAS] },
      { title: "Tipos de trámite", items: [...MATTER_PROCEDURE_TYPES] },
      { title: "Estados de asunto", items: [...MATTER_STATUSES] },
      { title: "Etapas (clave)", items: [...MATTER_STAGES] },
      { title: "Prioridades", items: [...MATTER_PRIORITIES] },
      { title: "Estados de tarea", items: [...TASK_STATUSES] },
      { title: "Tipos de evento", items: [...EVENT_TYPES] },
    ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <p className="sm:col-span-2 text-sm text-[var(--muted)]">
        Referencia de catálogos en código. Las etapas editables están arriba
        (tabla <code>matter_stage_defs</code>). Días no hábiles: pestaña Festivos.
      </p>
      {blocks.map((b) => (
        <section key={b.title} className="surface rounded-md p-4">
          <h3 className="mb-2 font-medium text-[var(--wine-900)]">{b.title}</h3>
          <ul className="grid gap-1 text-sm">
            {b.items.map((i) => (
              <li key={i.value} className="flex justify-between gap-2">
                <span>{i.label}</span>
                <code className="text-xs text-[var(--muted)]">{i.value}</code>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function NotificationPrefsForm({ member }: { member: Member }) {
  const [state, action, pending] = useActionState(
    updateMyNotificationPrefsAction,
    initial,
  );

  return (
    <form action={action} className="surface max-w-lg grid gap-4 rounded-md p-4">
      <h3 className="font-medium text-[var(--ink)]">Preferencias de aviso</h3>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="notify_in_app"
          defaultChecked={member.notify_in_app !== false}
          className="mt-1"
        />
        <span>
          <strong>Notificaciones in-app</strong>
          <br />
          <span className="text-[var(--muted)]">
            Campana en la barra superior (tareas, comentarios, asignaciones).
          </span>
        </span>
      </label>
      <input type="hidden" name="email_daily_digest" value="off" />
      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-emerald-700">{state.success}</p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Guardar preferencias"}
      </Button>
    </form>
  );
}
