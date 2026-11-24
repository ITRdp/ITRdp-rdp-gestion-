"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { EventType } from "@/lib/types";

export type FormState = { error?: string; success?: string };

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

export async function createEventAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  const title = str(formData, "title");
  const startsAt = str(formData, "starts_at");
  if (!title || !startsAt) {
    return { error: "Título e inicio son obligatorios." };
  }

  const allDay = formData.get("all_day") === "on";
  const { error } = await supabase.from("events").insert({
    title,
    description: nullStr(formData, "description"),
    starts_at: allDay ? `${startsAt.slice(0, 10)}T12:00:00` : startsAt,
    ends_at: nullStr(formData, "ends_at"),
    all_day: allDay,
    location: nullStr(formData, "location"),
    event_type: (str(formData, "event_type") || "otro") as EventType,
    matter_id: nullStr(formData, "matter_id"),
    created_by: member.id,
  });

  if (error) return { error: error.message };

  revalidatePath("/agenda");
  revalidatePath("/");
  const matterId = nullStr(formData, "matter_id");
  if (matterId) revalidatePath(`/asuntos/${matterId}`);
  return { success: "Evento creado." };
}

export async function deleteEventAction(eventId: string): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };
  revalidatePath("/agenda");
  revalidatePath("/");
  return { success: "Evento eliminado." };
}
