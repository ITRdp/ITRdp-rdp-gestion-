import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/auth";
import { toCsv } from "@/lib/csv";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  await requireMember();
  const supabase = await createClient();
  const kind = req.nextUrl.searchParams.get("kind") ?? "tiempo";

  if (kind === "tiempo") {
    const { data, error } = await supabase
      .from("time_entries")
      .select(
        `
        started_at, ended_at, duration_minutes, billable, description,
        matter:matters!time_entries_matter_id_fkey ( code, title ),
        member:members!time_entries_member_id_fkey ( full_name, email )
      `,
      )
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((r) => {
      const matter = Array.isArray(r.matter) ? r.matter[0] : r.matter;
      const mem = Array.isArray(r.member) ? r.member[0] : r.member;
      return [
        matter?.code ?? "",
        matter?.title ?? "",
        mem?.full_name ?? "",
        mem?.email ?? "",
        r.description ?? "",
        r.started_at,
        r.ended_at,
        r.duration_minutes ?? "",
        r.billable ? "sí" : "no",
      ];
    });

    const csv = toCsv(
      [
        "codigo_asunto",
        "asunto",
        "miembro",
        "email",
        "descripcion",
        "inicio",
        "fin",
        "minutos",
        "facturable",
      ],
      rows,
    );
    return csvResponse(csv, "rdp-tiempo.csv");
  }

  if (kind === "asuntos") {
    const { data, error } = await supabase
      .from("matters")
      .select(
        `
        code, title, status, stage, priority, area, procedural_deadline,
        opened_at, created_at,
        clients ( name, document_type, document_number ),
        responsible:members!matters_responsible_lawyer_id_fkey ( full_name )
      `,
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((m) => {
      const client = Array.isArray(m.clients) ? m.clients[0] : m.clients;
      const resp = Array.isArray(m.responsible)
        ? m.responsible[0]
        : m.responsible;
      return [
        m.code,
        m.title,
        client?.name ?? "",
        client?.document_type ?? "",
        client?.document_number ?? "",
        m.status,
        m.stage,
        m.priority,
        m.area,
        resp?.full_name ?? "",
        m.procedural_deadline ?? "",
        m.opened_at ?? "",
        m.created_at,
      ];
    });

    const csv = toCsv(
      [
        "codigo",
        "titulo",
        "cliente",
        "tipo_doc",
        "numero_doc",
        "estado",
        "etapa",
        "prioridad",
        "area",
        "responsable",
        "vencimiento_procesal",
        "apertura",
        "creado",
      ],
      rows,
    );
    return csvResponse(csv, "rdp-asuntos.csv");
  }

  if (kind === "actividad") {
    const { data, error } = await supabase
      .from("activity_log")
      .select(
        `
        created_at, action, entity_type, summary,
        matter:matters!activity_log_matter_id_fkey ( code, title ),
        actor:members!activity_log_actor_id_fkey ( full_name, email )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((a) => {
      const matter = Array.isArray(a.matter) ? a.matter[0] : a.matter;
      const actor = Array.isArray(a.actor) ? a.actor[0] : a.actor;
      return [
        a.created_at,
        matter?.code ?? "",
        matter?.title ?? "",
        a.entity_type,
        a.action,
        a.summary,
        actor?.full_name ?? "",
        actor?.email ?? "",
      ];
    });

    const csv = toCsv(
      [
        "fecha",
        "codigo_asunto",
        "asunto",
        "entidad",
        "accion",
        "resumen",
        "actor",
        "email_actor",
      ],
      rows,
    );
    return csvResponse(csv, "rdp-actividad.csv");
  }

  return NextResponse.json(
    { error: "kind inválido. Usa tiempo|asuntos|actividad." },
    { status: 400 },
  );
}

function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
