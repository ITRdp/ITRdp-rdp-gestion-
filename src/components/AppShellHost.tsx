import { AppShell } from "@/components/AppShell";
import { createClient } from "@/lib/supabase/server";
import type { AppNotification, Member } from "@/lib/types";

export async function AppShellHost({
  member,
  children,
}: {
  member: Member;
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("member_id", member.id)
    .order("created_at", { ascending: false })
    .limit(25);

  const notifications = (error ? [] : (data ?? [])) as AppNotification[];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <AppShell
      member={member}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </AppShell>
  );
}
