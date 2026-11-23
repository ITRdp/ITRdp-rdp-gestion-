"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { updateMatterAction, type FormState } from "@/app/actions/matters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CounterpartsField } from "@/components/CounterpartsField";
import { CourtSuggest } from "@/components/CourtSuggest";
import { LocationFields } from "@/components/LocationFields";
import { DatePicker } from "@/components/ui/date-picker";
import { FormSelect } from "@/components/ui/select";
import {
  FEE_MODALITIES,
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_PROCEDURE_TYPES,
  MATTER_STATUSES,
  stagesForType,
} from "@/lib/catalogs";
import type { Client, Matter, Member } from "@/lib/types";

const initial: FormState = {};

export function MatterEditForm({
  matter,
  clients,
  members,
  courtSuggestions = [],
}: {
  matter: Matter;
  clients: Pick<Client, "id" | "name">[];
  members: Member[];
  courtSuggestions?: string[];
}) {
  const [state, formAction, pending] = useActionState(updateMatterAction, initial);
  const [area, setArea] = useState(matter.area);
  const [matterType, setMatterType] = useState(matter.matter_type);
  const [stage, setStage] = useState(matter.stage);
  const types = useMemo(() => [...MATTER_PROCEDURE_TYPES], []);
  const stages = stagesForType(matterType);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (!stages.some((s) => s.value === stage)) {
      setStage(stages[0]?.value ?? "estudio");
    }
  }, [matterType, stages, stage]);

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
          <FormSelect
            id="client_id"
            name="client_id"
            required
            defaultValue={matter.client_id}
            options={clients.map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="area">Área</Label>
          <FormSelect
            id="area"
            name="area"
            value={area}
            onValueChange={(v) => setArea(v as typeof area)}
            options={MATTER_AREAS.map((a) => ({ value: a.value, label: a.label }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="matter_type">Tipo</Label>
          <FormSelect
            id="matter_type"
            name="matter_type"
            value={matterType}
            onValueChange={setMatterType}
            options={types.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="stage">Etapa</Label>
          <FormSelect
            id="stage"
            name="stage"
            value={stage}
            onValueChange={setStage}
            options={stages.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="status">Estado</Label>
          <FormSelect
            id="status"
            name="status"
            defaultValue={matter.status}
            options={MATTER_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="priority">Prioridad</Label>
          <FormSelect
            id="priority"
            name="priority"
            defaultValue={matter.priority}
            options={MATTER_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="responsible_lawyer_id">Responsable</Label>
          <FormSelect
            id="responsible_lawyer_id"
            name="responsible_lawyer_id"
            defaultValue={matter.responsible_lawyer_id}
            required
            options={members.map((m) => ({ value: m.id, label: m.full_name }))}
          />
        </div>
        <CounterpartsField defaultValue={matter.counterparts} />
        <div className="field">
          <Label htmlFor="fee_modality">Modalidad de honorarios</Label>
          <FormSelect
            id="fee_modality"
            name="fee_modality"
            defaultValue={matter.fee_modality ?? ""}
            placeholder="Sin definir"
            options={FEE_MODALITIES.map((m) => ({ value: m.value, label: m.label }))}
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
        <CourtSuggest
          defaultValue={matter.court_name}
          suggestions={courtSuggestions}
        />
        <LocationFields
          cityDefault={matter.city}
          cityLabel="Ciudad"
          persistDepartment={false}
        />
        <div className="field">
          <Label htmlFor="procedural_deadline">Venc. procesal</Label>
          <DatePicker
            id="procedural_deadline"
            name="procedural_deadline"
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
          <DatePicker
            id="opened_at"
            name="opened_at"
            defaultValue={matter.opened_at ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="closed_at">Cierre</Label>
          <DatePicker
            id="closed_at"
            name="closed_at"
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
