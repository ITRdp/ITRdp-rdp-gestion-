"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { createMatterAction, type FormState } from "@/app/actions/matters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_STAGES,
  MATTER_STATUSES,
  MATTER_TYPES_BY_AREA,
} from "@/lib/catalogs";
import type { Client, Member } from "@/lib/types";

const initial: FormState = {};

export function NewMatterDrawer({
  clients,
  members,
  currentMemberId,
  defaultClientId,
}: {
  clients: Pick<Client, "id" | "name" | "document_number" | "document_dv">[];
  members: Member[];
  currentMemberId: string;
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("comercial");
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [state, formAction, pending] = useActionState(createMatterAction, initial);

  const types = useMemo(
    () => MATTER_TYPES_BY_AREA[area] ?? MATTER_TYPES_BY_AREA.otros,
    [area],
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button">
          <Plus className="h-4 w-4" />
          Nuevo asunto
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo asunto</SheetTitle>
          <p className="hint mt-1">
            El código <strong>RDP-YYYY-####</strong> se asigna automáticamente.
          </p>
        </SheetHeader>
        <SheetBody>
          <form action={formAction} className="grid gap-4 pb-8">
            {state.error ? (
              <div className="alert" role="alert">
                {state.error}
              </div>
            ) : null}

            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${
                  clientMode === "existing"
                    ? "bg-[var(--wine-900)] text-white"
                    : "border border-[var(--line)]"
                }`}
                onClick={() => setClientMode("existing")}
              >
                Cliente existente
              </button>
              <button
                type="button"
                className={`rounded-md px-3 py-1.5 ${
                  clientMode === "new"
                    ? "bg-[var(--wine-900)] text-white"
                    : "border border-[var(--line)]"
                }`}
                onClick={() => setClientMode("new")}
              >
                Crear en línea
              </button>
            </div>

            {clientMode === "existing" ? (
              <div className="field">
                <Label htmlFor="client_id">Cliente</Label>
                <select
                  id="client_id"
                  name="client_id"
                  required={clientMode === "existing"}
                  defaultValue={defaultClientId ?? ""}
                >
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.document_number
                        ? ` · ${c.document_number}${c.document_dv ? `-${c.document_dv}` : ""}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="field">
                  <Label htmlFor="new_client_name">Nuevo cliente</Label>
                  <Input
                    id="new_client_name"
                    name="new_client_name"
                    required={clientMode === "new"}
                    placeholder="Razón social o nombre"
                  />
                </div>
                <div className="field">
                  <Label htmlFor="new_client_nit">NIT (opcional)</Label>
                  <Input id="new_client_nit" name="new_client_nit" />
                </div>
              </div>
            )}

            <div className="field">
              <Label htmlFor="title">Título</Label>
              <Input id="title" name="title" required placeholder="Asunto" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field">
                <Label htmlFor="area">Área</Label>
                <select
                  id="area"
                  name="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
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
                <select id="matter_type" name="matter_type" defaultValue="general">
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <Label htmlFor="stage">Etapa</Label>
                <select id="stage" name="stage" defaultValue="ingreso">
                  {MATTER_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <Label htmlFor="status">Estado</Label>
                <select id="status" name="status" defaultValue="abierto">
                  {MATTER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <Label htmlFor="priority">Prioridad</Label>
                <select id="priority" name="priority" defaultValue="media">
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
            </div>

            <div className="field">
              <Label htmlFor="team_member_ids">Equipo (IDs, opcional)</Label>
              <Input
                id="team_member_ids"
                name="team_member_ids"
                placeholder="UUID separados por coma"
              />
              <p className="hint">
                Alternativa: añade miembros desde la ficha del asunto.
              </p>
            </div>

            <div className="field">
              <Label htmlFor="counterparts">Contraparte(s)</Label>
              <Input
                id="counterparts"
                name="counterparts"
                placeholder="Nombre(s) separados por coma"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="field">
                <Label htmlFor="radicado">Radicado (hasta 23 dígitos)</Label>
                <Input
                  id="radicado"
                  name="radicado"
                  inputMode="numeric"
                  maxLength={23}
                  placeholder="Opcional"
                />
              </div>
              <div className="field">
                <Label htmlFor="court_name">Despacho</Label>
                <Input id="court_name" name="court_name" />
              </div>
              <div className="field">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" name="city" />
              </div>
              <div className="field">
                <Label htmlFor="procedural_deadline">Venc. procesal</Label>
                <Input
                  id="procedural_deadline"
                  name="procedural_deadline"
                  type="date"
                />
              </div>
              <div className="field">
                <Label htmlFor="amount_cop">Cuantía (COP)</Label>
                <Input id="amount_cop" name="amount_cop" placeholder="0" />
              </div>
              <div className="field">
                <Label htmlFor="fees_cop">Honorarios (COP)</Label>
                <Input id="fees_cop" name="fees_cop" placeholder="0" />
              </div>
              <div className="field sm:col-span-2">
                <Label htmlFor="opened_at">Fecha de apertura</Label>
                <Input
                  id="opened_at"
                  name="opened_at"
                  type="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>

            <div className="field">
              <Label htmlFor="description">Descripción</Label>
              <textarea id="description" name="description" />
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? "Creando…" : "Crear asunto"}
            </Button>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
