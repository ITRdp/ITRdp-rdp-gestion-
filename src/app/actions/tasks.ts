"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type TaskState = {
  error?: string;
  success?: string;
};

export async function createTaskAction(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const member = await requireMember();
  const supabase = await createClient();

  const matterId = String(formData.get("matter_id") ?? "").trim();
  const actuacionId = String(formData.get("actuacion_id") ?? "").trim() || null;
  const assigneeId = String(formData.get("assignee_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const followUpDate = String(formData.get("follow_up_date") ?? "").trim();

  if (!matterId || !assigneeId || !description || !followUpDate) {
    return {
      error:
        "Asigna un encargado, describe la tarea e indica la fecha de seguimiento.",
    };
  }

  const { error } = await supabase.from("tasks").insert({
    matter_id: matterId,
    actuacion_id: actuacionId,
    assignee_id: assigneeId,
    description,
    follow_up_date: followUpDate,
    created_by: member.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/");
  revalidatePath("/jornada");
  return { success: "Tarea asignada." };
}

export async function completeTaskAction(taskId: string, matterId: string) {
  const member = await requireMember();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "completada",
      completed_at: new Date().toISOString(),
      completed_by: member.id,
    })
    .eq("id", taskId)
    .eq("assignee_id", member.id)
    .eq("status", "pendiente");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  revalidatePath("/jornada");
  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/asuntos");
}
