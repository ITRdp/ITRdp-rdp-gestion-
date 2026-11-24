"use client";

import { useEffect } from "react";
import Link from "next/link";
import { captureException } from "@/lib/monitoring";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, { digest: error.digest });
  }, [error]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--wine-900)] px-4 text-center text-[var(--surface)]">
      <div className="brand-texture absolute inset-0 opacity-40" aria-hidden />
      <p className="relative text-sm uppercase tracking-[0.2em] text-[var(--gold-400)]">
        Error
      </p>
      <h1 className="font-display relative mt-2 text-4xl">Algo salió mal</h1>
      <p className="relative mt-3 max-w-md text-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
        Intenta de nuevo. Si el problema continúa, contacta a un administrador.
      </p>
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-[var(--gold-400)] px-5 py-2.5 text-sm font-semibold text-[var(--wine-900)]"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-md border border-white/30 px-5 py-2.5 text-sm"
        >
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
