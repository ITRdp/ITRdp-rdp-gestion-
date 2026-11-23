import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";
import { MEMBER_ROLES } from "@/lib/catalogs";

export { MEMBER_ROLES };

export async function requireMember(): Promise<Member> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: member, error } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (error || !member) {
    await supabase.auth.signOut();
    redirect("/login?error=disabled");
  }

  return member as Member;
}

export async function requireAdmin(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "admin") {
    redirect("/?error=forbidden");
  }
  return member;
}

export async function requireLawyerOrAdmin(): Promise<Member> {
  const member = await requireMember();
  if (member.role !== "admin" && member.role !== "abogado") {
    redirect("/?error=forbidden");
  }
  return member;
}

export function isAdmin(member: Member) {
  return member.role === "admin";
}

export function isLawyerOrAdmin(member: Member) {
  return member.role === "admin" || member.role === "abogado";
}

export function canManageClientsMatters(member: Member) {
  return isLawyerOrAdmin(member);
}
