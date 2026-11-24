"use client";

import { useActionState } from "react";
import {
  createClientAndMatterAction,
  type ClientMatterState,
} from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { FormSelect } from "@/components/ui/select";
import type { Member } from "@/lib/types";

const initial: ClientMatterState = {};

export function NewClientMatterForm({
  members,
  currentMemberId,
}: {
  members: Member[];
  currentMemberId: string;
}) {
  const [state, formAction, pending] = useActionState(
    createClientAndMatterAction,
    initial,
  );

  return (
    <form
      action={formAction}
      className="surface fade-in grid gap-5 rounded-md p-5 sm:p-6"
    >
      <div>
        <h2 className="font-display text-xl text-[var(--wine-900)]">
          Nuevo cliente y asunto
        </h2>
        <p className="hint mt-1">
          Crea el cliente y abre el asunto en un solo paso. El abogado
          responsable del asunto no tiene por qué ser el encargado de las
          tareas posteriores.
        </p>
      </div>

      {state.error && (
        <div className="alert" role="alert">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <Label htmlFor="client_name">Cliente</Label>
          <Input
            id="client_name"
            name="client_name"
            required
            placeholder="Nombre o razón social"
          />
        </div>
        <div className="field">
          <Label htmlFor="nif">NIT (número, sin DV)</Label>
          <Input id="nif" name="nif" placeholder="Opcional · ej. 900123456" />
        </div>
        <div className="field">
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" name="phone" placeholder="Opcional · +57 …" />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="client_email">Correo del cliente</Label>
          <Input
            id="client_email"
            name="client_email"
            type="email"
            placeholder="Opcional · nombre@empresa.co"
          />
        </div>
      </div>

      <hr className="rule" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <Label htmlFor="title">Asunto</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Título del asunto"
          />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            name="description"
            placeholder="Breve contexto del encargo"
          />
        </div>
        <div className="field">
          <Label htmlFor="responsible_lawyer_id">
            Abogado responsable del asunto
          </Label>
          <FormSelect
            id="responsible_lawyer_id"
            name="responsible_lawyer_id"
            defaultValue={currentMemberId}
            required
            options={members.map((m) => ({
              value: m.id,
              label: m.full_name,
            }))}
          />
        </div>
        <div className="field">
          <Label htmlFor="procedural_deadline">Vencimiento procesal</Label>
          <DatePicker
            id="procedural_deadline"
            name="procedural_deadline"
          />
          <p className="hint">
            Plazo judicial o administrativo. No es la fecha de seguimiento de
            una tarea.
          </p>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creando…" : "Crear cliente y asunto"}
        </Button>
      </div>
    </form>
  );
}
