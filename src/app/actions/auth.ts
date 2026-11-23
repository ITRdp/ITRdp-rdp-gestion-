"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduce correo y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Credenciales incorrectas. Comprueba correo y contraseña." };
  }

  const { data: member } = await supabase
    .from("members")
    .select("enabled")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!member?.enabled) {
    await supabase.auth.signOut();
    return {
      error:
        "Tu cuenta no está habilitada. Un administrador debe activarte en members.",
    };
  }

  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
