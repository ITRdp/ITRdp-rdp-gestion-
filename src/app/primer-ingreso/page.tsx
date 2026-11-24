import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Primer ingreso · RDP Gestión" };

export default async function PrimerIngresoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("members")
    .select("must_change_password, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!member?.must_change_password) redirect("/");

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--wine-900)] px-4 py-12">
      <div className="brand-texture absolute inset-0" aria-hidden />
      <section className="surface relative z-10 w-full max-w-md rounded-lg p-6 sm:p-8">
        <h1 className="font-display text-2xl text-[var(--wine-900)]">
          Bienvenido{member.full_name ? `, ${member.full_name}` : ""}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Por seguridad, cambia la contraseña temporal antes de continuar.
        </p>
        <div className="mt-6">
          <ResetPasswordForm submitLabel="Guardar y entrar" />
        </div>
      </section>
    </main>
  );
}
