"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { updateMatterStageStatusAction } from "@/app/actions/matters";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  MATTER_AREAS,
  MATTER_PRIORITIES,
  MATTER_STAGES,
  MATTER_STATUSES,
  labelOf,
} from "@/lib/catalogs";
import { formatDate } from "@/lib/format";
import { formatCOP } from "@/lib/money";
import type { MatterStage, MatterStatus } from "@/lib/types";

export type MatterRow = {
  id: string;
  code: string;
  title: string;
  status: MatterStatus;
  stage: MatterStage;
  priority: string;
  area: string;
  procedural_deadline: string | null;
  amount_cop: number | null;
  clientName: string;
  responsibleName: string;
};

export function MattersBoard({ matters }: { matters: MatterRow[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("vista") === "kanban" ? "kanban" : "tabla";
  const [pending, startTransition] = useTransition();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    router.push(`/asuntos?${next.toString()}`);
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex rounded-md border border-[var(--line)] p-0.5">
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm ${
              view === "tabla"
                ? "bg-[var(--wine-900)] text-white"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setParam("vista", "tabla")}
          >
            Tabla
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm ${
              view === "kanban"
                ? "bg-[var(--wine-900)] text-white"
                : "text-[var(--muted)]"
            }`}
            onClick={() => setParam("vista", "kanban")}
          >
            Kanban
          </button>
        </div>

        <FilterSelect
          label="Estado"
          value={params.get("estado") ?? ""}
          onChange={(v) => setParam("estado", v)}
          options={MATTER_STATUSES.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Etapa"
          value={params.get("etapa") ?? ""}
          onChange={(v) => setParam("etapa", v)}
          options={MATTER_STAGES.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Área"
          value={params.get("area") ?? ""}
          onChange={(v) => setParam("area", v)}
          options={MATTER_AREAS.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
        <FilterSelect
          label="Prioridad"
          value={params.get("prioridad") ?? ""}
          onChange={(v) => setParam("prioridad", v)}
          options={MATTER_PRIORITIES.map((s) => ({
            value: s.value,
            label: s.label,
          }))}
        />
        <input
          className="h-9 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
          placeholder="Buscar título o código…"
          defaultValue={params.get("q") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setParam("q", (e.target as HTMLInputElement).value);
            }
          }}
        />
        {(params.get("estado") ||
          params.get("etapa") ||
          params.get("area") ||
          params.get("prioridad") ||
          params.get("q") ||
          params.get("cliente")) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push("/asuntos")}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {matters.length === 0 ? (
        <EmptyState
          title="Sin asuntos con estos filtros"
          description="Crea un asunto o ajusta los filtros de la URL."
        />
      ) : view === "kanban" ? (
        <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-4 xl:grid-cols-8">
          {MATTER_STAGES.map((stage) => {
            const col = matters.filter((m) => m.stage === stage.value);
            return (
              <div
                key={stage.value}
                className="min-w-[200px] rounded-md border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_80%,white)] p-2"
              >
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    {stage.label}
                  </p>
                  <span className="text-xs text-[var(--gold-500)]">
                    {col.length}
                  </span>
                </div>
                <ul className="grid gap-2">
                  {col.map((m) => (
                    <li key={m.id} className="surface rounded-md p-3 text-sm">
                      <Link
                        href={`/asuntos/${m.id}`}
                        className="font-medium text-[var(--wine-900)] hover:underline"
                      >
                        {m.code}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[var(--ink)]">
                        {m.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {m.clientName}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="badge capitalize">{m.status}</span>
                        <span className="badge badge-gold capitalize">
                          {m.priority}
                        </span>
                      </div>
                      <select
                        className="mt-2 w-full rounded border border-[var(--line)] bg-white px-2 py-1 text-xs"
                        disabled={pending}
                        value={m.stage}
                        onChange={(e) =>
                          startTransition(async () => {
                            await updateMatterStageStatusAction(m.id, {
                              stage: e.target.value as MatterStage,
                            });
                            router.refresh();
                          })
                        }
                      >
                        {MATTER_STAGES.map((s) => (
                          <option key={s.value} value={s.value}>
                            Mover a {s.label}
                          </option>
                        ))}
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="surface overflow-x-auto rounded-md">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--line)] bg-[var(--wine-50)] text-xs uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th className="px-3 py-2 font-semibold">Código</th>
                <th className="px-3 py-2 font-semibold">Asunto</th>
                <th className="px-3 py-2 font-semibold">Cliente</th>
                <th className="px-3 py-2 font-semibold">Área</th>
                <th className="px-3 py-2 font-semibold">Etapa</th>
                <th className="px-3 py-2 font-semibold">Estado</th>
                <th className="px-3 py-2 font-semibold">Prioridad</th>
                <th className="px-3 py-2 font-semibold">Responsable</th>
                <th className="px-3 py-2 font-semibold">Venc.</th>
                <th className="px-3 py-2 font-semibold">Cuantía</th>
              </tr>
            </thead>
            <tbody>
              {matters.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--gold-50)]/40"
                >
                  <td className="px-3 py-2 font-medium text-[var(--wine-900)]">
                    <Link href={`/asuntos/${m.id}`} className="hover:underline">
                      {m.code}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/asuntos/${m.id}`} className="hover:underline">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-[var(--muted)]">{m.clientName}</td>
                  <td className="px-3 py-2">{labelOf(MATTER_AREAS, m.area)}</td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-[var(--line)] bg-white px-1 py-0.5 text-xs"
                      disabled={pending}
                      value={m.stage}
                      onChange={(e) =>
                        startTransition(async () => {
                          await updateMatterStageStatusAction(m.id, {
                            stage: e.target.value as MatterStage,
                          });
                          router.refresh();
                        })
                      }
                    >
                      {MATTER_STAGES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="rounded border border-[var(--line)] bg-white px-1 py-0.5 text-xs capitalize"
                      disabled={pending}
                      value={m.status}
                      onChange={(e) =>
                        startTransition(async () => {
                          await updateMatterStageStatusAction(m.id, {
                            status: e.target.value as MatterStatus,
                          });
                          router.refresh();
                        })
                      }
                    >
                      {MATTER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {labelOf(MATTER_PRIORITIES, m.priority)}
                  </td>
                  <td className="px-3 py-2">{m.responsibleName}</td>
                  <td className="px-3 py-2">
                    {formatDate(m.procedural_deadline)}
                  </td>
                  <td className="px-3 py-2">{formatCOP(m.amount_cop)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="grid gap-1 text-xs text-[var(--muted)]">
      {label}
      <select
        className="h-9 rounded-md border border-[var(--line)] bg-white px-2 text-sm text-[var(--ink)]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
