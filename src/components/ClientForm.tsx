"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createClientAction,
  updateClientAction,
  type FormState,
} from "@/app/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationFields } from "@/components/LocationFields";
import { DOCUMENT_TYPES, PERSON_TYPES } from "@/lib/catalogs";
import { nitCheckDigit } from "@/lib/nit";
import type { Client } from "@/lib/types";

const initial: FormState = {};

export function ClientForm({
  client,
  mode = "create",
}: {
  client?: Client;
  mode?: "create" | "edit";
}) {
  const action = mode === "edit" ? updateClientAction : createClientAction;
  const [state, formAction, pending] = useActionState(action, initial);
  const [docType, setDocType] = useState(client?.document_type ?? "NIT");
  const [docNumber, setDocNumber] = useState(client?.document_number ?? "");
  const [dv, setDv] = useState(client?.document_dv ?? "");

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  useEffect(() => {
    if (docType === "NIT" && docNumber) {
      const calc = nitCheckDigit(docNumber);
      if (calc) setDv(calc);
    }
  }, [docType, docNumber]);

  return (
    <form action={formAction} className="surface grid gap-4 rounded-md p-5">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      {state.error ? (
        <div className="alert" role="alert">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <Label htmlFor="person_type">Tipo de persona</Label>
          <select
            id="person_type"
            name="person_type"
            defaultValue={client?.person_type ?? "juridica"}
          >
            {PERSON_TYPES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <Label htmlFor="name">Nombre / razón social</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={client?.name ?? ""}
            placeholder="Constructora Ejemplo S.A.S."
          />
          <input type="hidden" name="legal_name" value={client?.legal_name ?? ""} />
        </div>
        <div className="field">
          <Label htmlFor="trade_name">Nombre comercial (opcional)</Label>
          <Input
            id="trade_name"
            name="trade_name"
            defaultValue={client?.trade_name ?? ""}
            placeholder="Marca o nombre comercial"
          />
        </div>
        <div className="field">
          <Label htmlFor="document_type">Tipo de documento</Label>
          <select
            id="document_type"
            name="document_type"
            value={docType}
            onChange={(e) => setDocType(e.target.value as typeof docType)}
          >
            {DOCUMENT_TYPES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="field">
            <Label htmlFor="document_number">Número</Label>
            <Input
              id="document_number"
              name="document_number"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder={docType === "NIT" ? "900123456" : "Opcional"}
            />
          </div>
          {docType === "NIT" ? (
            <div className="field w-20">
              <Label htmlFor="document_dv">DV</Label>
              <Input
                id="document_dv"
                name="document_dv"
                value={dv}
                onChange={(e) => setDv(e.target.value)}
                maxLength={1}
              />
            </div>
          ) : (
            <input type="hidden" name="document_dv" value="" />
          )}
        </div>
        <LocationFields
          departmentDefault={client?.department}
          cityDefault={client?.city}
        />
        <div className="field sm:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            name="address"
            defaultValue={client?.address ?? ""}
          />
        </div>
        <div className="field">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            placeholder="contacto@empresa.co"
          />
        </div>
        <div className="field">
          <Label htmlFor="phone">Celular</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            placeholder="+57 300…"
          />
        </div>
        <div className="field sm:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            name="notes"
            defaultValue={client?.notes ?? ""}
            placeholder="Observaciones internas"
          />
        </div>
      </div>

      {mode === "create" ? (
        <>
          <hr className="rule" />
          <p className="hint">Contacto principal (opcional)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="field">
              <Label htmlFor="contact_name">Nombre</Label>
              <Input id="contact_name" name="contact_name" />
            </div>
            <div className="field">
              <Label htmlFor="contact_role">Cargo</Label>
              <Input id="contact_role" name="contact_role" />
            </div>
            <div className="field">
              <Label htmlFor="contact_email">Correo</Label>
              <Input id="contact_email" name="contact_email" type="email" />
            </div>
            <div className="field">
              <Label htmlFor="contact_phone">Celular</Label>
              <Input id="contact_phone" name="contact_phone" />
            </div>
          </div>
        </>
      ) : null}

      <Button type="submit" disabled={pending} className="w-fit">
        {pending
          ? "Guardando…"
          : mode === "edit"
            ? "Guardar cambios"
            : "Crear cliente"}
      </Button>
    </form>
  );
}
