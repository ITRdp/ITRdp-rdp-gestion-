import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { NewClientMatterForm } from "@/components/NewClientMatterForm";
import { requireMember } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

export default async function AsuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const member = await requireMember();
  const params = await searchParams;
  const clienteFilter = params.cliente?.trim().toLowerCase() ?? "";
  const supabase = await createClient();

  const [{ data: matters }, { data: members }] = await Promise.all([
    supabase
      .from("matters")
      .select(
        `
        id,
        title,
        status,
        procedural_deadline,
        created_at,
        responsible_lawyer_id,
        clients ( name ),
        responsible:members!matters_responsible_lawyer_id_fkey ( full_name )
      `,
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("members")
      .select("*")
      .eq("enabled", true)
      .order("full_name"),
  ]);

  const filtered = (matters ?? []).filter((matter) => {
    if (!clienteFilter) return true;
    const client = Array.isArray(matter.clients)
      ? matter.clients[0]
      : matter.clients;
    return (client?.name ?? "").toLowerCase().includes(clienteFilter);
  });

  return (
    <AppShell member={member}>
      <header className="fade-in mb-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Asuntos
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Listado de asuntos abiertos y alta de nuevo cliente con su primer
          asunto.
        </p>
        {clienteFilter ? (
          <p className="mt-2 text-sm text-[var(--wine-700)]">
            Filtro cliente: «{params.cliente}» ·{" "}
            <Link href="/asuntos" className="underline-offset-2 hover:underline">
              Quitar
            </Link>
          </p>
        ) : null}
      </header>

      <div className="grid gap-10">
        <NewClientMatterForm
          members={(members ?? []) as Member[]}
          currentMemberId={member.id}
        />

        <section className="rise">
          <h2 className="font-display mb-4 text-xl text-[var(--wine-900)]">
            Listado ({filtered.length})
          </h2>

          {!filtered.length ? (
            <EmptyState
              title="Todavía no hay asuntos"
              description="Crea el primero con el formulario superior."
            />
          ) : (
            <ul className="grid gap-3">
              {filtered.map((matter) => {
                const client = Array.isArray(matter.clients)
                  ? matter.clients[0]
                  : matter.clients;
                const responsible = Array.isArray(matter.responsible)
                  ? matter.responsible[0]
                  : matter.responsible;

                return (
                  <li key={matter.id}>
                    <Link
                      href={`/asuntos/${matter.id}`}
                      className="surface block rounded-md p-4 transition hover:border-[color-mix(in_srgb,var(--gold-400)_45%,transparent)]"
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="badge capitalize">{matter.status}</span>
                        {matter.procedural_deadline && (
                          <span className="badge badge-gold">
                            Venc. procesal{" "}
                            {formatDate(matter.procedural_deadline)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg text-[var(--wine-900)]">
                        {matter.title}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {client?.name ?? "Cliente"} · Responsable:{" "}
                        {responsible?.full_name ?? "—"} · Alta{" "}
                        {formatDate(matter.created_at)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
