import { NextResponse } from "next/server";
import { requireMember } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireMember();
  } catch {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 1) {
    return NextResponse.json({ matters: [], clients: [] });
  }

  const supabase = await createClient();
  const pattern = `%${q}%`;

  const [{ data: matters }, { data: clients }] = await Promise.all([
    supabase
      .from("matters")
      .select("id, code, title, status, clients ( name )")
      .is("deleted_at", null)
      .or(`title.ilike.${pattern},code.ilike.${pattern}`)
      .limit(8),
    supabase
      .from("clients")
      .select("id, name, document_type, document_number, document_dv")
      .is("deleted_at", null)
      .or(
        `name.ilike.${pattern},legal_name.ilike.${pattern},document_number.ilike.${pattern}`,
      )
      .limit(8),
  ]);

  return NextResponse.json({
    matters: (matters ?? []).map((m) => {
      const client = Array.isArray(m.clients) ? m.clients[0] : m.clients;
      return {
        id: m.id,
        title: m.title,
        code: m.code,
        status: m.status,
        clientName: client?.name ?? null,
      };
    }),
    clients: (clients ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      nit:
        c.document_type === "NIT" && c.document_number
          ? `${c.document_number}${c.document_dv ? `-${c.document_dv}` : ""}`
          : c.document_number,
    })),
  });
}
