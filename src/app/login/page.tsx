import Image from "next/image";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const disabledHint = params.error === "disabled";

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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, rgba(212,159,105,0.18), transparent 34%), radial-gradient(circle at 88% 8%, rgba(251,249,248,0.1), transparent 28%)",
        }}
      />

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
            <h1 className="font-display mt-6 text-4xl leading-tight text-[var(--surface)] sm:text-5xl">
              RDP Gestión
            </h1>
            <p className="mt-3 max-w-md text-base text-[color-mix(in_srgb,var(--surface)_82%,transparent)] sm:text-lg">
              Asuntos, actuaciones y seguimiento interno del despacho. Acceso
              exclusivo para miembros habilitados.
            </p>
          </section>

          <section className="surface rise rounded-lg p-6 shadow-[0_24px_60px_rgba(20,8,10,0.35)] sm:p-8">
            <h2 className="font-display mb-1 text-2xl text-[var(--wine-900)]">
              Acceso
            </h2>
            <p className="hint mb-6">
              Inicia sesión con tu cuenta del despacho.
            </p>
            <LoginForm disabledHint={disabledHint} />
          </section>
        </div>
      </div>
    </main>
  );
}
