import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--wine-900)] px-4 text-center text-[var(--surface)]">
      <div className="brand-texture absolute inset-0 opacity-40" aria-hidden />
      <p className="relative text-sm uppercase tracking-[0.2em] text-[var(--gold-400)]">
        404
      </p>
      <h1 className="font-display relative mt-2 text-4xl">Página no encontrada</h1>
      <p className="relative mt-3 max-w-md text-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
        El enlace no existe o ya no está disponible en RDP Gestión.
      </p>
      <Link
        href="/"
        className="relative mt-8 rounded-md bg-[var(--gold-400)] px-5 py-2.5 text-sm font-semibold text-[var(--wine-900)]"
      >
        Ir a Mi jornada
      </Link>
    </main>
  );
}
