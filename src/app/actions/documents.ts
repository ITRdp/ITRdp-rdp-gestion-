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

export async function addDocumentLinkAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();
  const matterId = str(formData, "matter_id");
  const title = str(formData, "title");
  const url = nullStr(formData, "onedrive_url");
  const source = str(formData, "source") === "enlace" ? "enlace" : "onedrive";

  if (!matterId || !title || !url) {
    return { error: "Título y URL son obligatorios." };
  }

  const { error } = await supabase.from("documents").insert({
    matter_id: matterId,
    title,
    description: nullStr(formData, "description"),
    source,
    onedrive_url: url,
    uploaded_by: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Documento enlazado." };
}

export async function uploadDocumentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();
  const matterId = str(formData, "matter_id");
  const title = str(formData, "title");
  const file = formData.get("file");

  if (!matterId || !title) {
    return { error: "Título obligatorio." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo." };
  }
  if (file.size > 50 * 1024 * 1024) {
    return { error: "El archivo no puede superar 50 MB." };
  }

  const safeName = file.name.replace(/[^\w.\-áéíóúñÁÉÍÓÚÑ ]+/gi, "_");
  const path = `${matterId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("matter-documents")
    .upload(path, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return {
      error:
        uploadError.message.includes("Bucket") ||
        uploadError.message.includes("not found")
          ? "Bucket matter-documents no configurado. Crea el bucket privado en Supabase Storage o usa enlace OneDrive."
          : uploadError.message,
    };
  }

  const { error } = await supabase.from("documents").insert({
    matter_id: matterId,
    title,
    description: nullStr(formData, "description"),
    source: "storage",
    storage_path: path,
    file_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: member.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Documento subido." };
}

export async function softDeleteDocumentAction(
  documentId: string,
  matterId: string,
): Promise<FormState> {
  await requireMember();
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) return { error: error.message };
  revalidatePath(`/asuntos/${matterId}`);
  return { success: "Documento archivado." };
}

export async function getDocumentSignedUrl(
  storagePath: string,
): Promise<{ url?: string; error?: string }> {
  await requireMember();
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("matter-documents")
    .createSignedUrl(storagePath, 60 * 30);
  if (error || !data?.signedUrl) {
    return { error: error?.message ?? "No se pudo firmar la URL." };
  }
  return { url: data.signedUrl };
}
