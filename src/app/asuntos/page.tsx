import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { MattersBoard, type MatterRow } from "@/components/MattersBoard";
import { NewMatterDrawer } from "@/components/NewMatterDrawer";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Client, Member, MatterStage, MatterStatus } from "@/lib/types";

export default async function AsuntosPage({
  searchParams,
}: {
  searchParams: Promise<{
    vista?: string;
    estado?: string;
    etapa?: string;
    area?: string;
    prioridad?: string;
    q?: string;
    cliente?: string;
  }>;
}) {
  const member = await requireMember();
  const params = await searchParams;
  const supabase = await createClient();

  let mattersQuery = supabase
    .from("matters")
    .select(
      `
      id,
      code,
      title,
      status,
      stage,
      priority,
      area,
      procedural_deadline,
      amount_cop,
      clients ( name ),
      responsible:members!matters_responsible_lawyer_id_fkey ( full_name )
    `,
    )
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (params.estado) mattersQuery = mattersQuery.eq("status", params.estado);
  if (params.etapa) mattersQuery = mattersQuery.eq("stage", params.etapa);
  if (params.area) mattersQuery = mattersQuery.eq("area", params.area);
  if (params.prioridad) {
    mattersQuery = mattersQuery.eq("priority", params.prioridad);
  }
  if (params.q) {
    mattersQuery = mattersQuery.or(
      `title.ilike.%${params.q}%,code.ilike.%${params.q}%`,
    );
  }

  const [{ data: matters }, { data: members }, { data: clients }] =
    await Promise.all([
      mattersQuery,
      supabase.from("members").select("*").eq("enabled", true).order("full_name"),
      supabase
        .from("clients")
        .select("id, name, document_number, document_dv")
        .is("deleted_at", null)
        .order("name"),
    ]);

  const clienteFilter = params.cliente?.trim().toLowerCase() ?? "";

  const rows: MatterRow[] = (matters ?? [])
    .map((matter) => {
      const client = Array.isArray(matter.clients)
        ? matter.clients[0]
        : matter.clients;
      const responsible = Array.isArray(matter.responsible)
        ? matter.responsible[0]
        : matter.responsible;
      return {
        id: matter.id as string,
        code: matter.code as string,
        title: matter.title as string,
        status: matter.status as MatterStatus,
        stage: matter.stage as MatterStage,
        priority: matter.priority as string,
        area: matter.area as string,
        procedural_deadline: matter.procedural_deadline as string | null,
        amount_cop: matter.amount_cop as number | null,
        clientName: client?.name ?? "Cliente",
        responsibleName: responsible?.full_name ?? "—",
      };
    })
    .filter((m) =>
      clienteFilter
        ? m.clientName.toLowerCase().includes(clienteFilter)
        : true,
    );

  return (
    <AppShell member={member}>
      <header className="fade-in mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
            Despacho
          </p>
          <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
            Asuntos
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Tabla y Kanban por etapa. Filtros reflejados en la URL.
          </p>
        </div>
        <NewMatterDrawer
          clients={(clients ?? []) as Pick<
            Client,
            "id" | "name" | "document_number" | "document_dv"
          >[]}
          members={(members ?? []) as Member[]}
          currentMemberId={member.id}
        />
      </header>

      <Suspense fallback={<div className="skeleton h-40 w-full" />}>
        <MattersBoard matters={rows} />
      </Suspense>
    </AppShell>
  );
}
