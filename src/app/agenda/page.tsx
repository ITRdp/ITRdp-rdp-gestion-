import { Suspense } from "react";
import { AppShellHost as AppShell } from "@/components/AppShellHost";
import { AgendaViews } from "@/components/AgendaViews";
import { EventForm } from "@/components/EventForm";
import { requireMember } from "@/lib/auth";
import { toISODate } from "@/lib/business-days";
import { createClient } from "@/lib/supabase/server";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string; vista?: string }>;
}) {
  const member = await requireMember();
  const params = await searchParams;
  const anchor = (params.fecha || toISODate(new Date())).slice(0, 10);
  const supabase = await createClient();

  // Rango amplio: mes ± 7 días para mes/semana
  const from = new Date(`${anchor}T12:00:00`);
  from.setDate(1);
  from.setDate(from.getDate() - 7);
  const to = new Date(`${anchor}T12:00:00`);
  to.setMonth(to.getMonth() + 1);
  to.setDate(to.getDate() + 14);

  const [{ data: events }, { data: holidays }, { data: matters }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          `*, matters ( id, code, title )`,
        )
        .gte("starts_at", from.toISOString())
        .lte("starts_at", to.toISOString())
        .order("starts_at", { ascending: true }),
      supabase
        .from("non_business_days")
        .select("day, name")
        .gte("day", toISODate(from))
        .lte("day", toISODate(to)),
      supabase
        .from("matters")
        .select("id, code, title")
        .is("deleted_at", null)
        .order("code", { ascending: false })
        .limit(100),
    ]);

  return (
    <AppShell member={member}>
      <header className="fade-in mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Agenda
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Mes, semana y lista. Festivos Colombia (seed 2026–2027) marcados para
          validación.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <Suspense fallback={<div className="skeleton h-64 w-full" />}>
          <AgendaViews
            events={events ?? []}
            holidays={holidays ?? []}
            anchor={anchor}
          />
        </Suspense>
        <EventForm matters={matters ?? []} />
      </div>
    </AppShell>
  );
}
