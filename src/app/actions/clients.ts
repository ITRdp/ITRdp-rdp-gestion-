"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { nitCheckDigit } from "@/lib/nit";
import { createClient } from "@/lib/supabase/server";
import type { DocumentType, PersonType } from "@/lib/types";

export type FormState = { error?: string; success?: string };
export type ClientMatterState = FormState;

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

export async function createClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  const personType = (str(formData, "person_type") || "juridica") as PersonType;
  const documentType = (str(formData, "document_type") || "NIT") as DocumentType;
  const documentNumber = nullStr(formData, "document_number");
  let documentDv = nullStr(formData, "document_dv");
  const name = str(formData, "name");
  const legalName = nullStr(formData, "legal_name") || name;

  if (!name) return { error: "El nombre o razón social es obligatorio." };

  if (documentType === "NIT" && documentNumber && !documentDv) {
    documentDv = nitCheckDigit(documentNumber);
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      legal_name: legalName,
      person_type: personType,
      document_type: documentType,
      document_number: documentNumber,
      document_dv: documentDv,
      city: nullStr(formData, "city"),
      department: nullStr(formData, "department"),
      address: nullStr(formData, "address"),
      email: nullStr(formData, "email"),
      phone: nullStr(formData, "phone"),
      notes: nullStr(formData, "notes"),
      created_by: member.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "No se pudo crear el cliente." };
  }

  const contactName = nullStr(formData, "contact_name");
  if (contactName) {
    await supabase.from("client_contacts").insert({
      client_id: data.id,
      full_name: contactName,
      role_title: nullStr(formData, "contact_role"),
      email: nullStr(formData, "contact_email"),
      phone: nullStr(formData, "contact_phone"),
      is_primary: true,
    });
  }

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

export async function updateClientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();
  const id = str(formData, "id");
  if (!id) return { error: "Cliente no válido." };

  const personType = (str(formData, "person_type") || "juridica") as PersonType;
  const documentType = (str(formData, "document_type") || "NIT") as DocumentType;
  const documentNumber = nullStr(formData, "document_number");
  let documentDv = nullStr(formData, "document_dv");
  const name = str(formData, "name");

  if (!name) return { error: "El nombre o razón social es obligatorio." };
  if (documentType === "NIT" && documentNumber && !documentDv) {
    documentDv = nitCheckDigit(documentNumber);
  }

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      legal_name: nullStr(formData, "legal_name") || name,
      person_type: personType,
      document_type: documentType,
      document_number: documentNumber,
      document_dv: documentDv,
      city: nullStr(formData, "city"),
      department: nullStr(formData, "department"),
      address: nullStr(formData, "address"),
      email: nullStr(formData, "email"),
      phone: nullStr(formData, "phone"),
      notes: nullStr(formData, "notes"),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { error: error.message };

  void member;
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: "Cliente actualizado." };
}

export async function softDeleteClientAction(clientId: string): Promise<FormState> {
  const member = await requireMember();
  if (member.role !== "admin") {
    return { error: "Solo un administrador puede eliminar clientes." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId);

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function addClientContactAction(formData: FormData): Promise<void> {
  await requireMember();
  const supabase = await createClient();
  const clientId = str(formData, "client_id");
  const fullName = str(formData, "full_name");
  if (!clientId || !fullName) return;

  await supabase.from("client_contacts").insert({
    client_id: clientId,
    full_name: fullName,
    role_title: nullStr(formData, "role_title"),
    email: nullStr(formData, "email"),
    phone: nullStr(formData, "phone"),
    notes: nullStr(formData, "notes"),
    is_primary: formData.get("is_primary") === "on",
  });

  revalidatePath(`/clientes/${clientId}`);
}

/** Compat: alta rápida cliente+asunto desde formularios legacy. */
export async function createClientAndMatterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();

  const clientName = str(formData, "client_name");
  const title = str(formData, "title");
  if (!clientName || !title) {
    return { error: "El nombre del cliente y el título del asunto son obligatorios." };
  }

  const docNumber = nullStr(formData, "nif") || nullStr(formData, "document_number");
  let dv = nullStr(formData, "document_dv");
  if (docNumber && !dv) dv = nitCheckDigit(docNumber);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      name: clientName,
      legal_name: clientName,
      person_type: "juridica",
      document_type: "NIT",
      document_number: docNumber,
      document_dv: dv,
      email: nullStr(formData, "client_email"),
      phone: nullStr(formData, "phone"),
      created_by: member.id,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    return { error: clientError?.message ?? "No se pudo crear el cliente." };
  }

  const { data: codeRow } = await supabase.rpc("next_matter_code");
  const code = (codeRow as string | null) ?? `RDP-${new Date().getFullYear()}-0001`;

  const { data: matter, error: matterError } = await supabase
    .from("matters")
    .insert({
      code,
      client_id: client.id,
      title,
      description: nullStr(formData, "description"),
      responsible_lawyer_id:
        str(formData, "responsible_lawyer_id") || member.id,
      procedural_deadline: nullStr(formData, "procedural_deadline"),
      created_by: member.id,
    })
    .select("id")
    .single();

  if (matterError || !matter) {
    return { error: matterError?.message ?? "No se pudo crear el asunto." };
  }

  await supabase.from("matter_team").insert({
    matter_id: matter.id,
    member_id: str(formData, "responsible_lawyer_id") || member.id,
    role_in_matter: "responsable",
  });

  revalidatePath("/asuntos");
  revalidatePath("/clientes");
  revalidatePath("/");
  redirect(`/asuntos/${matter.id}`);
}
