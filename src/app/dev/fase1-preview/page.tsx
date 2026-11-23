import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { LoginForm } from "@/components/LoginForm";
import type { Member } from "@/lib/types";

/**
 * Vista de diseño Fase 1 con datos mock (sin Supabase).
 * Solo disponible fuera de producción, para capturas desktop/móvil.
 */
const demoMember: Member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana.ruiz@despacho.co",
  full_name: "Ana Ruiz",
  role: "admin",
  enabled: true,
  created_at: "2026-01-10T10:00:00.000Z",
};

export default async function Fase1PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; nav?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_FASE1_PREVIEW !== "1") {
    notFound();
  }

  const { view = "jornada", nav } = await searchParams;
  const showNav = nav === "1";

  if (view === "login") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[var(--wine-900)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(145deg, #340613 0%, #430E1B 48%, #511521 78%, #3a2a18 100%)",
          }}
        />
        <div className="brand-texture absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6">
          <div className="rise grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <section className="text-[var(--surface)]">
              <Image
                src="/brand/monogram-gold.png"
                alt="Monograma RDP"
                width={96}
                height={110}
                className="mb-6 h-20 w-auto sm:h-24"
                priority
              />
              <Image
                src="/brand/wordmark-white.png"
                alt="Rojas & De Paz Abogados S.A.S."
                width={420}
                height={120}
                className="h-14 w-auto max-w-full object-contain object-left sm:h-16"
                priority
              />
              <h1 className="font-display mt-6 text-4xl leading-tight sm:text-5xl">
                RDP Gestión
              </h1>
              <p className="mt-3 max-w-md text-base text-[color-mix(in_srgb,var(--surface)_82%,transparent)] sm:text-lg">
                Asuntos, actuaciones y seguimiento interno del despacho.
              </p>
            </section>
            <section className="surface rise rounded-lg p-6 sm:p-8">
              <h2 className="font-display mb-1 text-2xl text-[var(--wine-900)]">
                Acceso
              </h2>
              <p className="hint mb-6">Vista previa de diseño (sin sesión).</p>
              <LoginForm />
            </section>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AppShell member={demoMember}>
      {showNav ? (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          {[
            ["jornada", "Mi jornada"],
            ["asuntos", "Asuntos"],
            ["ficha", "Ficha"],
            ["login", "Login"],
          ].map(([id, label]) => (
            <Link
              key={id}
              href={`/dev/fase1-preview?view=${id}&nav=1`}
              className={`rounded-full border px-3 py-1 ${
                view === id
                  ? "border-[var(--gold-400)] text-[var(--wine-900)]"
                  : "border-[var(--line)] text-[var(--muted)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      ) : null}

      {view === "asuntos" ? (
        <AsuntosPreview />
      ) : view === "ficha" ? (
        <FichaPreview />
      ) : (
        <JornadaPreview />
      )}
    </AppShell>
  );
}

function JornadaPreview() {
  return (
    <>
      <header className="fade-in mb-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Hoy
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Mi jornada
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Tareas asignadas a ti, ordenadas por fecha de seguimiento.
        </p>
      </header>
      <section className="rise mb-10">
        <h2 className="font-display mb-4 text-xl text-[var(--wine-900)]">
          Pendientes (2)
        </h2>
        <ul className="grid gap-3">
          <li className="surface grid gap-3 rounded-md p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <div className="mb-2 flex flex-wrap gap-2">
                <span className="badge">Seguimiento 24 nov 2026</span>
                <span className="badge badge-gold">Venc. procesal 5 dic 2026</span>
              </div>
              <p className="font-medium text-[var(--ink)]">
                Revisar memorial de contestación
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Constructora Andes S.A.S. · Contrato de arrendamiento comercial
              </p>
            </div>
            <button type="button" className="btn btn-primary text-sm">
              Marcar completada
            </button>
          </li>
          <li className="surface rounded-md p-4">
            <span className="badge">Seguimiento 26 nov 2026</span>
            <p className="mt-2 font-medium text-[var(--ink)]">
              Confirmar audiencia con el cliente
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              María Gómez · Tutela laboral
            </p>
          </li>
        </ul>
      </section>
      <EmptyState
        title="Completadas recientemente"
        description="Las tareas finalizadas de esta jornada aparecerán aquí."
      />
    </>
  );
}

function AsuntosPreview() {
  return (
    <>
      <header className="fade-in mb-8">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Asuntos
        </h1>
      </header>
      <div className="surface mb-8 rounded-md p-5">
        <h2 className="font-display text-xl text-[var(--wine-900)]">
          Nuevo cliente y asunto
        </h2>
        <p className="hint mt-1">Formulario con etiquetas es-CO (NIT, +57…).</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label>Cliente</label>
            <input placeholder="Nombre o razón social" readOnly />
          </div>
          <div className="field">
            <label>NIT</label>
            <input placeholder="Opcional · ej. 900.123.456-7" readOnly />
          </div>
        </div>
      </div>
      <ul className="grid gap-3">
        <li className="surface rounded-md p-4">
          <span className="badge capitalize">abierto</span>
          <h3 className="font-display mt-2 text-lg text-[var(--wine-900)]">
            Contrato de arrendamiento comercial
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Constructora Andes S.A.S. · Responsable: Ana Ruiz
          </p>
        </li>
        <li className="surface rounded-md p-4">
          <span className="badge capitalize">abierto</span>
          <span className="badge badge-gold ml-2">Venc. procesal 5 dic 2026</span>
          <h3 className="font-display mt-2 text-lg text-[var(--wine-900)]">
            Tutela laboral
          </h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            María Gómez · Responsable: Luis Martín
          </p>
        </li>
      </ul>
    </>
  );
}

function FichaPreview() {
  return (
    <>
      <p className="mb-4 text-sm text-[var(--gold-500)]">← Volver a asuntos</p>
      <header className="fade-in mb-8">
        <span className="badge capitalize">abierto</span>
        <h1 className="font-display mt-3 text-3xl text-[var(--wine-900)] sm:text-4xl">
          Contrato de arrendamiento comercial
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Cliente: <strong className="text-[var(--ink)]">Constructora Andes S.A.S.</strong>{" "}
          · NIT 900.123.456-7
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="surface rounded-md p-3">
            <dt className="hint">Abogado responsable del asunto</dt>
            <dd className="font-medium">Ana Ruiz</dd>
          </div>
          <div className="surface rounded-md p-3">
            <dt className="hint">Alta del asunto</dt>
            <dd className="font-medium">Ana Ruiz · 10 nov 2026, 10:00 a. m.</dd>
          </div>
        </dl>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface rounded-md p-5">
          <h3 className="font-display text-lg text-[var(--wine-900)]">
            Registrar actuación
          </h3>
          <p className="hint mt-1">Documenta la gestión realizada.</p>
        </div>
        <section>
          <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
            Actuaciones
          </h2>
          <div className="surface rounded-md p-4">
            <p>Revisión del contrato y observaciones al arrendador.</p>
            <p className="mt-3 text-xs text-[var(--muted)]">
              Registrada por <strong>Luis Martín</strong> el 12 nov 2026, 3:20 p. m.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
