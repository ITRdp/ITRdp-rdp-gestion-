"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ClientMatterState = {
  error?: string;
};

export async function createClientAndMatterAction(
  _prev: ClientMatterState,
  formData: FormData,
): Promise<ClientMatterState> {
  const member = await requireMember();
  const supabase = await createClient();

  const clientName = String(formData.get("client_name") ?? "").trim();
  const nif = String(formData.get("nif") ?? "").trim() || null;
  const clientEmail = String(formData.get("client_email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const responsibleLawyerId =
    String(formData.get("responsible_lawyer_id") ?? "").trim() || member.id;
  const proceduralDeadline =
    String(formData.get("procedural_deadline") ?? "").trim() || null;

  if (!clientName || !title) {
    return { error: "El nombre del cliente y el título del asunto son obligatorios." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: clientName,
      nif,
      email: clientEmail,
      phone,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return { error: clientError?.message ?? "No se pudo crear el cliente." };
  }

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .insert({
      client_id: client.id,
      title,
      description,
      responsible_lawyer_id: responsibleLawyerId,
      procedural_deadline: proceduralDeadline,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (matterError || !matter) {
    return { error: matterError?.message ?? "No se pudo crear el asunto." };
  }

  revalidatePath("/asuntos");
  revalidatePath("/");
  redirect(`/asuntos/${matter.id}`);
}
