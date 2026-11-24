"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActuacionState = {
  error?: string;
  success?: string;
};

export async function createActuacionAction(
  _prev: ActuacionState,
  formData: FormData,
): Promise<ActuacionState> {
  const member = await requireMember();
  const supabase = await createClient();

  const matterId = String(formData.get("matter_id") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const onedriveUrl = String(formData.get("onedrive_url") ?? "").trim() || null;

  if (!matterId || !description) {
    return { error: "La descripción de la actuación es obligatoria." };
  }

  if (onedriveUrl) {
    try {
      const u = new URL(onedriveUrl);
      if (!["http:", "https:"].includes(u.protocol)) {
        return { error: "El enlace de OneDrive debe ser una URL http(s) válida." };
      }
    } catch {
      return { error: "El enlace de OneDrive no es una URL válida." };
    }
  }

  const { error } = await supabase.from("actuaciones").insert({
    matter_id: matterId,
    author_id: member.id,
    description,
    onedrive_url: onedriveUrl,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/asuntos/${matterId}`);
  revalidatePath("/asuntos");
  return { success: "Actuación registrada." };
}
