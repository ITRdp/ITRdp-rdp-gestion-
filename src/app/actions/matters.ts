"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { parseCOPInput } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type {
  MatterArea,
  MatterPriority,
  MatterStage,
  MatterStatus,
} from "@/lib/types";

export type FormState = { error?: string; success?: string };

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

async function allocateCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const { data, error } = await supabase.rpc("next_matter_code");
  if (!error && data) return String(data);
  const year = new Date().getFullYear();
  return `RDP-${year}-${String(Date.now()).slice(-4)}`;
}

export async function createMatterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  let clientId = str(formData, "client_id");
  const newClientName = nullStr(formData, "new_client_name");

  if (!clientId && newClientName) {
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        name: newClientName,
        legal_name: newClientName,
        person_type: "juridica",
        document_type: "NIT",
        document_number: nullStr(formData, "new_client_nit"),
        created_by: member.id,
      })
      .select("id")
      .single();
    if (error || !client) {
      return { error: error?.message ?? "No se pudo crear el cliente." };
    }
    clientId = client.id;
  }

  const title = str(formData, "title");
  if (!clientId || !title) {
    return { error: "Cliente y título del asunto son obligatorios." };
  }

  const radicadoRaw = nullStr(formData, "radicado");
  const radicado =
    radicadoRaw && /^\d{23}$/.test(radicadoRaw.replace(/\D/g, ""))
      ? radicadoRaw.replace(/\D/g, "")
      : radicadoRaw
        ? null
        : null;
  if (radicadoRaw && !radicado) {
    return { error: "El radicado debe tener exactamente 23 dígitos." };
  }

  const responsible =
    str(formData, "responsible_lawyer_id") || member.id;
  const code = await allocateCode(supabase);

  const { data: matter, error } = await supabase
    .from("matters")
    .insert({
      code,
      client_id: clientId,
      title,
      description: nullStr(formData, "description"),
      area: (str(formData, "area") || "comercial") as MatterArea,
      matter_type: str(formData, "matter_type") || "consultoria",
      stage: (str(formData, "stage") || "solicitud") as MatterStage,
      status: (str(formData, "status") || "abierto") as MatterStatus,
      priority: (str(formData, "priority") || "media") as MatterPriority,
      responsible_lawyer_id: responsible,
      counterparts: nullStr(formData, "counterparts"),
      fee_modality: nullStr(formData, "fee_modality"),
      radicado,
      court_name: nullStr(formData, "court_name"),
      city: nullStr(formData, "city"),
      amount_cop: parseCOPInput(str(formData, "amount_cop")),
      fees_cop: parseCOPInput(str(formData, "fees_cop")),
      opened_at: nullStr(formData, "opened_at") || new Date().toISOString().slice(0, 10),
      procedural_deadline: nullStr(formData, "procedural_deadline"),
      created_by: member.id,
    })
    .select("id")
    .single();

  if (error || !matter) {
    return { error: error?.message ?? "No se pudo crear el asunto." };
  }

  await supabase.from("matter_team").upsert(
    {
      matter_id: matter.id,
      member_id: responsible,
      role_in_matter: "responsable",
    },
    { onConflict: "matter_id,member_id" },
  );

  const teamRaw = str(formData, "team_member_ids");
  if (teamRaw) {
    const ids = teamRaw.split(",").map((x) => x.trim()).filter(Boolean);
    for (const mid of ids) {
      if (mid === responsible) continue;
      await supabase.from("matter_team").upsert(
        {
          matter_id: matter.id,
          member_id: mid,
          role_in_matter: "colaborador",
        },
        { onConflict: "matter_id,member_id" },
      );
    }
  }

  revalidatePath("/asuntos");
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);
  redirect(`/asuntos/${matter.id}`);
}

export async function updateMatterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const id = str(formData, "id");
  if (!id) return { error: "Asunto no válido." };

  const radicadoRaw = nullStr(formData, "radicado");
  const radicado =
    radicadoRaw && /^\d{23}$/.test(radicadoRaw.replace(/\D/g, ""))
      ? radicadoRaw.replace(/\D/g, "")
      : radicadoRaw
        ? null
        : null;
  if (radicadoRaw && !radicado) {
    return { error: "El radicado debe tener exactamente 23 dígitos." };
  }

  const status = (str(formData, "status") || "abierto") as MatterStatus;
  const closedAt =
    status === "cerrado" || status === "archivado"
      ? nullStr(formData, "closed_at") || new Date().toISOString().slice(0, 10)
      : null;

  const { error } = await supabase
    .from("matters")
    .update({
      title: str(formData, "title"),
      description: nullStr(formData, "description"),
      client_id: str(formData, "client_id"),
      area: (str(formData, "area") || "comercial") as MatterArea,
      matter_type: str(formData, "matter_type") || "consultoria",
      stage: (str(formData, "stage") || "solicitud") as MatterStage,
      status,
      priority: (str(formData, "priority") || "media") as MatterPriority,
      responsible_lawyer_id: str(formData, "responsible_lawyer_id"),
      counterparts: nullStr(formData, "counterparts"),
      fee_modality: nullStr(formData, "fee_modality"),
      radicado,
      court_name: nullStr(formData, "court_name"),
      city: nullStr(formData, "city"),
      amount_cop: parseCOPInput(str(formData, "amount_cop")),
      fees_cop: parseCOPInput(str(formData, "fees_cop")),
      opened_at: nullStr(formData, "opened_at"),
      closed_at: closedAt,
      procedural_deadline: nullStr(formData, "procedural_deadline"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { error: error.message };

  revalidatePath("/asuntos");
  revalidatePath(`/asuntos/${id}`);
  return { success: "Asunto actualizado." };
}

export async function updateMatterStageStatusAction(
  matterId: string,
  patch: { stage?: MatterStage; status?: MatterStatus },
): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.stage) update.stage = patch.stage;
  if (patch.status) {
    update.status = patch.status;
    if (patch.status === "cerrado" || patch.status === "archivado") {
      update.closed_at = new Date().toISOString().slice(0, 10);
    }
  }

  const { error } = await supabase
    .from("matters")
    .update(update)
    .eq("id", matterId)
    .is("deleted_at", null);

  if (error) return { error: error.message };
  revalidatePath("/asuntos");
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Actualizado." };
}

export async function softDeleteMatterAction(matterId: string): Promise<FormState> {
  const member = await requireMember();
  if (member.role !== "admin") {
    return { error: "Solo un administrador puede archivar/eliminar asuntos." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("matters")
    .update({
      deleted_at: new Date().toISOString(),
      status: "archivado",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matterId);

  if (error) return { error: error.message };
  revalidatePath("/asuntos");
  redirect("/asuntos");
}
