"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; success?: string };

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

export async function startTimerAction(matterId: string): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  const { data: open } = await supabase
    .from("time_entries")
    .select("id, matter_id")
    .eq("member_id", member.id)
    .is("ended_at", null)
    .maybeSingle();

  if (open) {
    return {
      error:
        "Ya tienes un cronómetro activo. Deténlo antes de iniciar otro.",
    };
  }

  const { error } = await supabase.from("time_entries").insert({
    matter_id: matterId,
    member_id: member.id,
    started_at: new Date().toISOString(),
    description: "Sesión de trabajo",
  });

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/reportes");
  revalidatePath("/");
  return { success: "Cronómetro iniciado." };
}

export async function stopTimerAction(entryId: string): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("time_entries")
    .select("id, matter_id, member_id, ended_at")
    .eq("id", entryId)
    .maybeSingle();

  if (!entry || entry.ended_at) {
    return { error: "Entrada no válida o ya cerrada." };
  }
  if (entry.member_id !== member.id && member.role !== "admin") {
    return { error: "No puedes detener el cronómetro de otro miembro." };
  }

  const { error } = await supabase
    .from("time_entries")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", entryId);

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${entry.matter_id}`);
  revalidatePath("/reportes");
  revalidatePath("/");
  return { success: "Tiempo registrado." };
}

export async function addManualTimeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();
  const matterId = str(formData, "matter_id");
  const minutes = Number(str(formData, "duration_minutes"));
  const description = nullStr(formData, "description") || "Tiempo manual";

  if (!matterId || !Number.isFinite(minutes) || minutes <= 0) {
    return { error: "Indica minutos válidos (> 0)." };
  }

  const ended = new Date();
  const started = new Date(ended.getTime() - minutes * 60_000);

  const { error } = await supabase.from("time_entries").insert({
    matter_id: matterId,
    member_id: member.id,
    description,
    started_at: started.toISOString(),
    ended_at: ended.toISOString(),
    duration_minutes: Math.round(minutes),
    billable: formData.get("billable") !== "off",
  });

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/reportes");
  return { success: "Tiempo manual guardado." };
}
