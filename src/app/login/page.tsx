import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const disabledHint = params.error === "disabled";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #390A10 0%, #4a1520 42%, #775A19 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, rgba(253,252,251,0.18), transparent 35%), radial-gradient(circle at 80% 0%, rgba(253,252,251,0.12), transparent 30%)",
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-12 sm:px-6">
        <div className="rise grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="text-[var(--ivory)]">
            <p className="mb-3 text-xs tracking-[0.28em] uppercase text-[color-mix(in_srgb,var(--ivory)_70%,var(--gold))]">
              Despacho jurídico
            </p>
            <h1 className="font-display text-5xl leading-tight sm:text-6xl">
              RDP Gestión
            </h1>
            <p className="mt-4 max-w-md text-lg text-[color-mix(in_srgb,var(--ivory)_82%,transparent)]">
              Asuntos, actuaciones y seguimiento interno del despacho. Acceso
              exclusivo para miembros habilitados.
            </p>
          </section>

          <section className="surface rise p-6 shadow-[0_24px_60px_rgba(20,8,10,0.28)] sm:p-8">
            <h2 className="font-display mb-1 text-2xl text-[var(--wine)]">Acceso</h2>
            <p className="hint mb-6">Inicia sesión con tu cuenta del despacho.</p>
            <LoginForm disabledHint={disabledHint} />
          </section>
        </div>
      </div>
    </main>
  );
}
