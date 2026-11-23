import Link from "next/link";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export const metadata = { title: "Nueva contraseña · RDP Gestión" };

export default function RestablecerPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--wine-900)] px-4 py-12">
      <div className="brand-texture absolute inset-0" aria-hidden />
      <section className="surface relative z-10 w-full max-w-md rounded-lg p-6 sm:p-8">
        <h1 className="font-display text-2xl text-[var(--wine-900)]">
          Nueva contraseña
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Elige una contraseña segura para tu cuenta.
        </p>
        <div className="mt-6">
          <ResetPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-[var(--gold-500)] hover:underline">
            Volver al acceso
          </Link>
        </p>
      </section>
    </main>
  );
}
