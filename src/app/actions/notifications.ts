"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(
  notificationId: string,
): Promise<void> {
  const member = await requireMember();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("member_id", member.id);
  revalidatePath("/");
}

export async function markAllNotificationsReadAction(): Promise<void> {
  const member = await requireMember();
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("member_id", member.id)
    .is("read_at", null);
  revalidatePath("/");
}
