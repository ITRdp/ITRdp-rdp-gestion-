import Link from "next/link";
import { AppShellHost as AppShell } from "@/components/AppShellHost";
import { ClientForm } from "@/components/ClientForm";
import { EmptyState } from "@/components/EmptyState";
import { canManageClientsMatters, requireMember } from "@/lib/auth";
import { formatDocument } from "@/lib/nit";
import { createClient } from "@/lib/supabase/server";
import { labelOf, PERSON_TYPES } from "@/lib/catalogs";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; nuevo?: string }>;
}) {
  const member = await requireMember();
  const canWrite = canManageClientsMatters(member);
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const showForm = canWrite && params.nuevo === "1";
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,legal_name.ilike.%${q}%,document_number.ilike.%${q}%`,
    );
  }

  const { data: clients } = await query;

  return (
    <AppShell member={member}>
      <header className="fade-in mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
            Clientes
          </h1>
          <p className="mt-2 max-w-2xl text-[var(--muted)]">
            Personas naturales y jurídicas con documento colombiano (NIT con DV).
          </p>
        </div>
        {canWrite ? (
          <Link href="/clientes?nuevo=1" className="btn btn-primary text-sm">
            Nuevo cliente
          </Link>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            Solo abogados/admin crean clientes.
          </p>
        )}
      </header>

      <form className="mb-6 flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o documento…"
          className="h-10 flex-1 rounded-md border border-[var(--line)] bg-white px-3 text-sm"
        />
        <button type="submit" className="btn btn-secondary text-sm">
          Buscar
        </button>
      </form>

      {showForm ? (
        <div className="mb-8">
          <ClientForm />
        </div>
      ) : null}

      {!clients?.length ? (
        <EmptyState
          title="Aún no hay clientes"
          description="Crea el primero con el botón Nuevo cliente."
        />
      ) : (
        <ul className="grid gap-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clientes/${c.id}`}
                className="surface block rounded-md p-4 transition hover:border-[color-mix(in_srgb,var(--gold-400)_45%,transparent)]"
              >
                <div className="mb-1 flex flex-wrap gap-2">
                  <span className="badge">
                    {labelOf(PERSON_TYPES, c.person_type)}
                  </span>
                  <span className="badge badge-gold">
                    {formatDocument(
                      c.document_type,
                      c.document_number,
                      c.document_dv,
                    )}
                  </span>
                </div>
                <h2 className="font-display text-lg text-[var(--wine-900)]">
                  {c.name}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {[c.city, c.department].filter(Boolean).join(", ") || "Sin ciudad"}
                  {c.email ? ` · ${c.email}` : ""}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
