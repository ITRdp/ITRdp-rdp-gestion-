import Link from "next/link";
import { AppNav } from "@/components/AppNav";
import { NewClientMatterForm } from "@/components/NewClientMatterForm";
import { requireMember } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

export default async function AsuntosPage() {
  const member = await requireMember();
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

  return (
    <div className="min-h-screen">
      <AppNav member={member} currentPath="/asuntos" />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 py-8 sm:px-6">
        <header className="fade-in">
          <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold)]">
            Despacho
          </p>
          <h1 className="font-display mt-1 text-3xl text-[var(--wine)] sm:text-4xl">
            Asuntos
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Listado de asuntos abiertos y alta de nuevo cliente con su primer
            asunto.
          </p>
        </header>

        <NewClientMatterForm
          members={(members ?? []) as Member[]}
          currentMemberId={member.id}
        />

        <section className="rise">
          <h2 className="font-display mb-4 text-xl text-[var(--wine)]">
            Listado ({matters?.length ?? 0})
          </h2>

          {!matters?.length ? (
            <div className="surface p-6 text-[var(--muted)]">
              Todavía no hay asuntos. Crea el primero con el formulario superior.
            </div>
          ) : (
            <ul className="grid gap-3">
              {matters.map((matter) => {
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
                      className="surface block p-4 transition hover:border-[color-mix(in_srgb,var(--gold)_45%,transparent)]"
                    >
                      <div className="mb-2 flex flex-wrap gap-2">
                        <span className="badge capitalize">{matter.status}</span>
                        {matter.procedural_deadline && (
                          <span className="badge badge-gold">
                            Venc. procesal {formatDate(matter.procedural_deadline)}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg text-[var(--wine)]">
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
      </main>
    </div>
  );
}
