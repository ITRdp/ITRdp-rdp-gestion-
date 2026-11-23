"use client";

import { useActionState } from "react";
import {
  createClientAndMatterAction,
  type ClientMatterState,
} from "@/app/actions/clients";
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
    <form action={formAction} className="surface fade-in grid gap-5 p-5 sm:p-6">
      <div>
        <h2 className="font-display text-xl text-[var(--wine)]">Nuevo cliente y asunto</h2>
        <p className="hint mt-1">
          Crea el cliente y abre el asunto en un solo paso. El abogado responsable
          del asunto no tiene por qué ser el encargado de las tareas posteriores.
        </p>
      </div>

      {state.error && (
        <div className="alert" role="alert">
          {state.error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label htmlFor="client_name">Cliente</label>
          <input id="client_name" name="client_name" required placeholder="Nombre o razón social" />
        </div>
        <div className="field">
          <label htmlFor="nif">NIF / CIF</label>
          <input id="nif" name="nif" placeholder="Opcional" />
        </div>
        <div className="field">
          <label htmlFor="phone">Teléfono</label>
          <input id="phone" name="phone" placeholder="Opcional" />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="client_email">Correo del cliente</label>
          <input id="client_email" name="client_email" type="email" placeholder="Opcional" />
        </div>
      </div>

      <hr className="rule" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field sm:col-span-2">
          <label htmlFor="title">Asunto</label>
          <input id="title" name="title" required placeholder="Título del asunto" />
        </div>
        <div className="field sm:col-span-2">
          <label htmlFor="description">Descripción</label>
          <textarea id="description" name="description" placeholder="Breve contexto del encargo" />
        </div>
        <div className="field">
          <label htmlFor="responsible_lawyer_id">Abogado responsable del asunto</label>
          <select
            id="responsible_lawyer_id"
            name="responsible_lawyer_id"
            defaultValue={currentMemberId}
            required
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="procedural_deadline">Vencimiento procesal</label>
          <input id="procedural_deadline" name="procedural_deadline" type="date" />
          <p className="hint">
            Plazo judicial o administrativo. No es la fecha de seguimiento de una tarea.
          </p>
        </div>
      </div>

      <div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creando…" : "Crear cliente y asunto"}
        </button>
      </div>
    </form>
  );
}
