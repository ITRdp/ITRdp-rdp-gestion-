import Link from "next/link";
import { notFound } from "next/navigation";
import { addClientContactAction } from "@/app/actions/clients";
import { AppShell } from "@/components/AppShell";
import { ClientForm } from "@/components/ClientForm";
import { EmptyState } from "@/components/EmptyState";
import { NewMatterDrawer } from "@/components/NewMatterDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireMember } from "@/lib/auth";
import { labelOf, MATTER_STAGES, MATTER_STATUSES, PERSON_TYPES } from "@/lib/catalogs";
import { formatDocument } from "@/lib/nit";
import { createClient } from "@/lib/supabase/server";
import type { Client, Member } from "@/lib/types";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await requireMember();
  const supabase = await createClient();

  const [
    { data: client },
    { data: contacts },
    { data: matters },
    { data: members },
    { data: allClients },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("matters")
      .select(
        "id, code, title, status, stage, priority, procedural_deadline, responsible:members!matters_responsible_lawyer_id_fkey(full_name)",
      )
      .eq("client_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("members").select("*").eq("enabled", true).order("full_name"),
    supabase
      .from("clients")
      .select("id, name, document_number, document_dv")
      .is("deleted_at", null)
      .order("name"),
  ]);

  if (!client) notFound();

  return (
    <AppShell member={member}>
      <p className="mb-4">
        <Link
          href="/clientes"
          className="text-sm text-[var(--gold-500)] underline-offset-4 hover:underline"
        >
          ← Volver a clientes
        </Link>
      </p>

      <header className="fade-in mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="badge">
              {labelOf(PERSON_TYPES, client.person_type)}
            </span>
            <span className="badge badge-gold">
              {formatDocument(
                client.document_type,
                client.document_number,
                client.document_dv,
              )}
            </span>
          </div>
          <h1 className="font-display text-3xl text-[var(--wine-900)]">
            {client.name}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {[client.address, client.city, client.department]
              .filter(Boolean)
              .join(" · ") || "Sin dirección"}
          </p>
        </div>
        <NewMatterDrawer
          clients={(allClients ?? []) as Pick<
            Client,
            "id" | "name" | "document_number" | "document_dv"
          >[]}
          members={(members ?? []) as Member[]}
          currentMemberId={member.id}
          defaultClientId={client.id}
        />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Datos
          </h2>
          <ClientForm client={client as Client} mode="edit" />
        </section>

        <div className="grid gap-8">
          <section>
            <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
              Contactos
            </h2>
            {!contacts?.length ? (
              <EmptyState title="Sin contactos aún" />
            ) : (
              <ul className="mb-4 grid gap-2">
                {contacts.map((c) => (
                  <li key={c.id} className="surface rounded-md p-3 text-sm">
                    <p className="font-medium text-[var(--ink)]">
                      {c.full_name}
                      {c.is_primary ? (
                        <span className="badge badge-gold ml-2">Principal</span>
                      ) : null}
                    </p>
                    <p className="text-[var(--muted)]">
                      {[c.role_title, c.email, c.phone]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <form
              action={addClientContactAction}
              className="surface grid gap-3 rounded-md p-4"
            >
              <input type="hidden" name="client_id" value={client.id} />
              <p className="font-medium text-[var(--wine-900)]">Agregar contacto</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="field">
                  <Label htmlFor="full_name">Nombre</Label>
                  <Input id="full_name" name="full_name" required />
                </div>
                <div className="field">
                  <Label htmlFor="role_title">Cargo</Label>
                  <Input id="role_title" name="role_title" />
                </div>
                <div className="field">
                  <Label htmlFor="email">Correo</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="field">
                  <Label htmlFor="phone">Celular</Label>
                  <Input id="phone" name="phone" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input type="checkbox" name="is_primary" />
                Marcar como principal
              </label>
              <Button type="submit" size="sm" className="w-fit">
                Guardar contacto
              </Button>
            </form>
          </section>

          <section>
            <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
              Asuntos ({matters?.length ?? 0})
            </h2>
            {!matters?.length ? (
              <EmptyState title="Este cliente no tiene asuntos" />
            ) : (
              <ul className="grid gap-2">
                {matters.map((m) => {
                  const responsible = Array.isArray(m.responsible)
                    ? m.responsible[0]
                    : m.responsible;
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/asuntos/${m.id}`}
                        className="surface block rounded-md p-3 hover:border-[color-mix(in_srgb,var(--gold-400)_40%,transparent)]"
                      >
                        <p className="text-xs text-[var(--gold-500)]">{m.code}</p>
                        <p className="font-medium text-[var(--wine-900)]">
                          {m.title}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {labelOf(MATTER_STATUSES, m.status)} ·{" "}
                          {labelOf(MATTER_STAGES, m.stage)} ·{" "}
                          {responsible?.full_name ?? "—"}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
