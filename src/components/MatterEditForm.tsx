"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { updateMatterAction, type FormState } from "@/app/actions/matters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_STAGES,
  MATTER_STATUSES,
  MATTER_TYPES_BY_AREA,
} from "@/lib/catalogs";
import type { Client, Matter, Member } from "@/lib/types";

const initial: FormState = {};

export function MatterEditForm({
  matter,
  clients,
  members,
}: {
  matter: Matter;
  clients: Pick<Client, "id" | "name">[];
  members: Member[];
}) {
  const [state, formAction, pending] = useActionState(updateMatterAction, initial);
  const [area, setArea] = useState(matter.area);
  const types = useMemo(
    () => MATTER_TYPES_BY_AREA[area] ?? MATTER_TYPES_BY_AREA.otro,
    [area],
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="surface grid gap-4 rounded-md p-5">
      <input type="hidden" name="id" value={matter.id} />
      {state.error ? (
        <div className="alert" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" name="title" required defaultValue={matter.title} />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="client_id">Cliente</Label>
          <select
            id="client_id"
            name="client_id"
            required
            defaultValue={matter.client_id}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="area">Área</Label>
          <select
            id="area"
            name="area"
            value={area}
            onChange={(e) => setArea(e.target.value as typeof area)}
          >
            {MATTER_AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="matter_type">Tipo</Label>
          <select
            id="matter_type"
            name="matter_type"
            defaultValue={matter.matter_type}
          >
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="stage">Etapa</Label>
          <select id="stage" name="stage" defaultValue={matter.stage}>
            {MATTER_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" defaultValue={matter.status}>
            {MATTER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="priority">Prioridad</Label>
          <select id="priority" name="priority" defaultValue={matter.priority}>
            {MATTER_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="responsible_lawyer_id">Responsable</Label>
          <select
            id="responsible_lawyer_id"
            name="responsible_lawyer_id"
            defaultValue={matter.responsible_lawyer_id}
            required
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="counterparts">Contraparte(s)</Label>
          <Input
            id="counterparts"
            name="counterparts"
            defaultValue={matter.counterparts ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="radicado">Radicado</Label>
          <Input
            id="radicado"
            name="radicado"
            maxLength={23}
            defaultValue={matter.radicado ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="court_name">Despacho</Label>
          <Input
            id="court_name"
            name="court_name"
            defaultValue={matter.court_name ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" name="city" defaultValue={matter.city ?? ""} />
        </div>
        <div className="field">
          <Label htmlFor="procedural_deadline">Venc. procesal</Label>
          <Input
            id="procedural_deadline"
            name="procedural_deadline"
            type="date"
            defaultValue={matter.procedural_deadline ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="amount_cop">Cuantía COP</Label>
          <Input
            id="amount_cop"
            name="amount_cop"
            defaultValue={matter.amount_cop?.toString() ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="fees_cop">Honorarios COP</Label>
          <Input
            id="fees_cop"
            name="fees_cop"
            defaultValue={matter.fees_cop?.toString() ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="opened_at">Apertura</Label>
          <Input
            id="opened_at"
            name="opened_at"
            type="date"
            defaultValue={matter.opened_at ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="closed_at">Cierre</Label>
          <Input
            id="closed_at"
            name="closed_at"
            type="date"
            defaultValue={matter.closed_at ?? ""}
          />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            defaultValue={matter.description ?? ""}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
