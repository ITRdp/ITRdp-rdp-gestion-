import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/lib/types";

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
