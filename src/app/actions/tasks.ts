"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { addBusinessDays, holidaySet } from "@/lib/business-days";
import { todayISO } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ChecklistItem, TaskPriority, TaskStatus } from "@/lib/types";

export type TaskState = {
  error?: string;
  success?: string;
};

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

function parseChecklist(raw: string | null): ChecklistItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChecklistItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item, i) => ({
      id: String(item.id ?? i + 1),
      text: String(item.text ?? ""),
      done: Boolean(item.done),
    }));
  } catch {
    return raw
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, i) => ({ id: String(i + 1), text, done: false }));
  }
}

function parseMentions(body: string, members: { id: string; full_name: string }[]) {
  const ids: string[] = [];
  for (const m of members) {
    const handle = m.full_name.split(/\s+/)[0]?.toLowerCase();
    if (!handle) continue;
    if (body.toLowerCase().includes(`@${handle}`)) ids.push(m.id);
  }
  return ids;
}

export async function createTaskAction(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const member = await requireMember();
  const supabase = await createClient();

  const matterId = str(formData, "matter_id");
  const assigneeId = str(formData, "assignee_id");
  const description = str(formData, "description");
  let followUpDate = str(formData, "follow_up_date");
  const templateId = nullStr(formData, "template_id");

  let priority = (str(formData, "priority") || "media") as TaskPriority;
  let checklist = parseChecklist(nullStr(formData, "checklist"));

  let templateDescription = "";
  if (templateId) {
    const { data: tpl } = await supabase
      .from("task_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle();
    if (tpl) {
      templateDescription = tpl.description ?? "";
      priority = (tpl.priority as TaskPriority) || priority;
      if (!checklist.length) {
        checklist = (tpl.checklist as ChecklistItem[]) ?? [];
      }
      if (!followUpDate) {
        const { data: holidays } = await supabase
          .from("non_business_days")
          .select("day");
        const set = holidaySet(holidays ?? []);
        followUpDate = addBusinessDays(
          todayISO(),
          tpl.default_follow_up_offset_days ?? 3,
          set,
        );
      }
    }
  }

  const finalDescription = description || templateDescription;

  if (!matterId || !assigneeId || !finalDescription || !followUpDate) {
    return {
      error:
        "Asigna un encargado, describe la tarea e indica la fecha de seguimiento.",
    };
  }

  const { error } = await supabase.from("tasks").insert({
    matter_id: matterId,
    actuacion_id: nullStr(formData, "actuacion_id"),
    assignee_id: assigneeId,
    description: finalDescription,
    follow_up_date: followUpDate,
    due_business_date: nullStr(formData, "due_business_date"),
    priority,
    checklist,
    status: "pendiente",
    created_by: member.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/");
  revalidatePath("/jornada");
  revalidatePath("/agenda");
  return { success: "Tarea asignada." };
}

export async function updateTaskStatusAction(
  taskId: string,
  matterId: string,
  status: TaskStatus,
): Promise<TaskState> {
  const member = await requireMember();
  const supabase = await createClient();

  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (status === "completada") {
    patch.completed_at = new Date().toISOString();
    patch.completed_by = member.id;
  } else {
    patch.completed_at = null;
    patch.completed_by = null;
  }

  const { error } = await supabase.from("tasks").update(patch).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/");
  revalidatePath("/jornada");
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Estado actualizado." };
}

export async function completeTaskAction(taskId: string, matterId: string) {
  const result = await updateTaskStatusAction(taskId, matterId, "completada");
  if (result.error) throw new Error(result.error);
}

export async function updateTaskChecklistAction(
  taskId: string,
  matterId: string,
  checklist: ChecklistItem[],
): Promise<TaskState> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ checklist, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/");
  return { success: "Checklist actualizado." };
}

export async function addTaskCommentAction(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const member = await requireMember();
  const supabase = await createClient();
  const taskId = str(formData, "task_id");
  const matterId = str(formData, "matter_id");
  const body = str(formData, "body");
  if (!taskId || !body) return { error: "Escribe un comentario." };

  const { data: members } = await supabase
    .from("members")
    .select("id, full_name")
    .eq("enabled", true);

  const mentioned = parseMentions(body, members ?? []);

  const { error } = await supabase.from("task_comments").insert({
    task_id: taskId,
    author_id: member.id,
    body,
    mentioned_member_ids: mentioned,
  });

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Comentario publicado." };
}

export async function createTaskTemplateAction(
  _prev: TaskState,
  formData: FormData,
): Promise<TaskState> {
  const member = await requireMember();
  const supabase = await createClient();
  const name = str(formData, "name");
  const description = str(formData, "description");
  if (!name || !description) {
    return { error: "Nombre y descripción son obligatorios." };
  }

  const { error } = await supabase.from("task_templates").insert({
    name,
    description,
    priority: (str(formData, "priority") || "media") as TaskPriority,
    checklist: parseChecklist(nullStr(formData, "checklist")),
    default_follow_up_offset_days:
      Number(str(formData, "default_follow_up_offset_days") || "3") || 3,
    area: nullStr(formData, "area"),
    created_by: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/asuntos");
  revalidatePath("/");
  return { success: "Plantilla creada." };
}
