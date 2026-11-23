"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin, requireMember } from "@/lib/auth";
import { MEMBER_ROLES } from "@/lib/catalogs";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/types";

export type FormState = { error?: string; success?: string };

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
function nullStr(form: FormData, key: string) {
  const v = str(form, key);
  return v || null;
}

function isRole(v: string): v is MemberRole {
  return MEMBER_ROLES.some((r) => r.value === v);
}

/** Invita / crea usuario Auth (service_role) + fila en members. Solo admin. */
export async function inviteMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const email = str(formData, "email").toLowerCase();
  const fullName = str(formData, "full_name");
  const roleRaw = str(formData, "role") || "abogado";
  const tempPassword = str(formData, "temp_password");

  if (!email || !fullName) {
    return { error: "Nombre y correo son obligatorios." };
  }
  if (!isRole(roleRaw)) {
    return { error: "Rol inválido." };
  }
  if (tempPassword && tempPassword.length < 8) {
    return { error: "La contraseña temporal debe tener al menos 8 caracteres." };
  }

  let service;
  try {
    service = createServiceClient();
  } catch {
    return {
      error:
        "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor. Configúrala para invitar miembros.",
    };
  }

  const password =
    tempPassword ||
    `Rdp-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

  const { data: created, error: createError } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

  if (createError || !created.user) {
    return {
      error:
        createError?.message?.includes("already") ||
        createError?.message?.includes("registered")
          ? "Ese correo ya existe en Auth. Usa otro o sincroniza el perfil manualmente."
          : createError?.message ?? "No se pudo crear el usuario en Auth.",
    };
  }

  const { error: memberError } = await service.from("members").upsert(
    {
      id: created.user.id,
      email,
      full_name: fullName,
      role: roleRaw,
      enabled: true,
      email_daily_digest: false,
      notify_in_app: true,
      must_change_password: true,
    },
    { onConflict: "id" },
  );

  if (memberError) {
    return {
      error: `Usuario Auth creado, pero falló members: ${memberError.message}`,
    };
  }

  revalidatePath("/admin");
  return {
    success: tempPassword
      ? `Miembro ${fullName} creado. Comparte la contraseña temporal de forma segura.`
      : `Miembro ${fullName} creado con contraseña temporal generada. Cámbiala en el primer acceso (Auth → Users).`,
  };
}

export async function updateMemberRoleAction(
  memberId: string,
  role: MemberRole,
): Promise<FormState> {
  await requireAdmin();
  if (!isRole(role)) return { error: "Rol inválido." };

  const supabase = await createClient();

  if (role !== "admin") {
    const { data: admins } = await supabase
      .from("members")
      .select("id")
      .eq("role", "admin")
      .eq("enabled", true);
    const onlyAdmin =
      (admins?.length ?? 0) === 1 && admins?.[0]?.id === memberId;
    if (onlyAdmin) {
      return {
        error: "No puedes quitar el rol admin al único administrador activo.",
      };
    }
  }

  const { error } = await supabase
    .from("members")
    .update({ role })
    .eq("id", memberId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: "Rol actualizado." };
}

export async function setMemberEnabledAction(
  memberId: string,
  enabled: boolean,
): Promise<FormState> {
  const admin = await requireAdmin();
  if (memberId === admin.id && !enabled) {
    return { error: "No puedes deshabilitarte a ti mismo." };
  }

  const supabase = await createClient();

  if (!enabled) {
    const { data: target } = await supabase
      .from("members")
      .select("role")
      .eq("id", memberId)
      .maybeSingle();
    if (target?.role === "admin") {
      const { data: admins } = await supabase
        .from("members")
        .select("id")
        .eq("role", "admin")
        .eq("enabled", true);
      if ((admins?.length ?? 0) <= 1) {
        return {
          error: "No puedes deshabilitar al único administrador activo.",
        };
      }
    }
  }

  const { error } = await supabase
    .from("members")
    .update({ enabled })
    .eq("id", memberId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: enabled ? "Miembro habilitado." : "Miembro deshabilitado." };
}

export async function addNonBusinessDayAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const day = str(formData, "day");
  const endsOn = nullStr(formData, "ends_on");
  const name = str(formData, "name");
  const kind = str(formData, "kind") || "festivo_nacional";
  const notes = nullStr(formData, "notes");

  if (!day || !name) return { error: "Fecha y nombre obligatorios." };
  if (endsOn && endsOn < day) {
    return { error: "La fecha fin debe ser ≥ a la fecha inicio." };
  }

  const days: string[] = [day];
  if (endsOn && endsOn !== day) {
    const cur = new Date(`${day}T12:00:00`);
    const end = new Date(`${endsOn}T12:00:00`);
    while (cur < end) {
      cur.setDate(cur.getDate() + 1);
      days.push(cur.toISOString().slice(0, 10));
    }
  }

  const rows = days.map((d, i) => ({
    day: d,
    name: days.length > 1 ? `${name} (${i + 1}/${days.length})` : name,
    kind,
    notes,
    ends_on: endsOn && endsOn !== day ? endsOn : null,
  }));

  const { error } = await supabase.from("non_business_days").insert(rows);

  if (error) {
    return {
      error: error.message.includes("duplicate")
        ? "Alguna fecha del rango ya está registrada."
        : error.message,
    };
  }
  revalidatePath("/admin");
  revalidatePath("/agenda");
  return {
    success:
      days.length > 1
        ? `Rango no hábil agregado (${days.length} días).`
        : "Día no hábil agregado.",
  };
}

export async function deleteNonBusinessDayAction(
  id: string,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("non_business_days")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/agenda");
  return { success: "Día eliminado." };
}

export async function updateStageDefAction(
  id: string,
  patch: { label?: string; enabled?: boolean; sort_order?: number },
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("matter_stage_defs")
    .update(patch)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/asuntos");
  return { success: "Etapa actualizada." };
}

export async function updateMyNotificationPrefsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const supabase = await createClient();
  const notifyInApp = formData.get("notify_in_app") === "on";
  const emailDaily = formData.get("email_daily_digest") === "on";

  const { error } = await supabase
    .from("members")
    .update({
      notify_in_app: notifyInApp,
      email_daily_digest: emailDaily,
    })
    .eq("id", member.id);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/");
  return {
    success: emailDaily
      ? "Preferencias guardadas. El resumen diario por correo está preparado pero aún no se envía automáticamente."
      : "Preferencias guardadas.",
  };
}
