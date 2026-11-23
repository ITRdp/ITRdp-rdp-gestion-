import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Member } from "@/lib/types";

const demoMember: Member = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "ana.ruiz@despacho.co",
  full_name: "Ana Ruiz",
  role: "admin",
  enabled: true,
  created_at: "2026-01-10T10:00:00.000Z",
};

export default async function Fase2PreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_FASE2_PREVIEW !== "1"
  ) {
    notFound();
  }

  const { view = "clientes" } = await searchParams;

  return (
    <AppShell member={demoMember}>
      {view === "asuntos-kanban" ? (
        <KanbanPreview />
      ) : view === "ficha" ? (
        <FichaPreview />
      ) : view === "cliente" ? (
        <ClientePreview />
      ) : view === "asuntos" ? (
        <AsuntosTablaPreview />
      ) : (
        <ClientesPreview />
      )}
    </AppShell>
  );
}

function ClientesPreview() {
  return (
    <>
      <header className="mb-6">
        <p className="text-xs tracking-[0.2em] uppercase text-[var(--gold-400)]">
          Despacho
        </p>
        <h1 className="font-display mt-1 text-3xl text-[var(--wine-900)]">
          Clientes
        </h1>
      </header>
      <ul className="grid gap-3">
        <li className="surface rounded-md p-4">
          <span className="badge">Persona jurídica</span>
          <span className="badge badge-gold ml-2">NIT 900123456-1</span>
          <h2 className="font-display mt-2 text-lg text-[var(--wine-900)]">
            Constructora Andes S.A.S.
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Bogotá, Cundinamarca · contacto@andes-demo.co
          </p>
        </li>
        <li className="surface rounded-md p-4">
          <span className="badge">Persona natural</span>
          <span className="badge badge-gold ml-2">CC 1020304050</span>
          <h2 className="font-display mt-2 text-lg text-[var(--wine-900)]">
            María Gómez
          </h2>
          <p className="text-sm text-[var(--muted)]">Medellín, Antioquia</p>
        </li>
      </ul>
    </>
  );
}

function ClientePreview() {
  return (
    <>
      <p className="mb-4 text-sm text-[var(--gold-500)]">← Volver a clientes</p>
      <header className="mb-6">
        <span className="badge">Persona jurídica</span>
        <span className="badge badge-gold ml-2">NIT 900123456-1</span>
        <h1 className="font-display mt-3 text-3xl text-[var(--wine-900)]">
          Constructora Andes S.A.S.
        </h1>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-md p-4">
          <h2 className="font-display text-lg text-[var(--wine-900)]">Datos</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Calle 100 # 19-50 · Bogotá · +57 300 111 2233
          </p>
        </div>
        <div className="surface rounded-md p-4">
          <h2 className="font-display text-lg text-[var(--wine-900)]">Asuntos</h2>
          <p className="mt-2 text-sm">
            <Link href="#" className="text-[var(--wine-900)]">
              RDP-2026-0001 · Contrato de arrendamiento comercial
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

function AsuntosTablaPreview() {
  return (
    <>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-[var(--wine-900)]">
            Asuntos
          </h1>
          <p className="hint mt-1">Vista tabla · filtros en URL</p>
        </div>
        <button type="button" className="btn btn-primary text-sm">
          Nuevo asunto
        </button>
      </header>
      <div className="mb-3 flex gap-2">
        <span className="rounded bg-[var(--wine-900)] px-3 py-1 text-sm text-white">
          Tabla
        </span>
        <span className="rounded border border-[var(--line)] px-3 py-1 text-sm text-[var(--muted)]">
          Kanban
        </span>
      </div>
      <div className="surface overflow-x-auto rounded-md">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] bg-[var(--wine-50)] text-xs uppercase text-[var(--muted)]">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Asunto</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Etapa</th>
              <th className="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--line)]">
              <td className="px-3 py-2 font-medium text-[var(--wine-900)]">
                RDP-2026-0001
              </td>
              <td className="px-3 py-2">Contrato de arrendamiento comercial</td>
              <td className="px-3 py-2 text-[var(--muted)]">
                Constructora Andes S.A.S.
              </td>
              <td className="px-3 py-2">Actuación</td>
              <td className="px-3 py-2">Abierto</td>
            </tr>
            <tr>
              <td className="px-3 py-2 font-medium text-[var(--wine-900)]">
                RDP-2026-0002
              </td>
              <td className="px-3 py-2">Tutela laboral</td>
              <td className="px-3 py-2 text-[var(--muted)]">María Gómez</td>
              <td className="px-3 py-2">Audiencia</td>
              <td className="px-3 py-2">Abierto</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

function KanbanPreview() {
  const cols = ["Ingreso", "Análisis", "Actuación", "Audiencia"];
  return (
    <>
      <h1 className="font-display mb-4 text-3xl text-[var(--wine-900)]">
        Asuntos · Kanban
      </h1>
      <div className="grid gap-3 md:grid-cols-4">
        {cols.map((c, i) => (
          <div
            key={c}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-2"
          >
            <p className="mb-2 text-xs font-semibold uppercase text-[var(--muted)]">
              {c}
            </p>
            {i === 2 ? (
              <div className="surface rounded-md p-3 text-sm">
                <p className="font-medium text-[var(--wine-900)]">RDP-2026-0001</p>
                <p className="mt-1">Contrato de arrendamiento</p>
                <span className="badge mt-2">Abierto</span>
              </div>
            ) : i === 3 ? (
              <div className="surface rounded-md p-3 text-sm">
                <p className="font-medium text-[var(--wine-900)]">RDP-2026-0002</p>
                <p className="mt-1">Tutela laboral</p>
                <span className="badge badge-gold mt-2">Alta</span>
              </div>
            ) : (
              <p className="px-1 text-xs text-[var(--muted)]">Vacío</p>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function FichaPreview() {
  return (
    <>
      <p className="mb-4 text-sm text-[var(--gold-500)]">← Volver a asuntos</p>
      <header className="mb-6">
        <span className="badge">RDP-2026-0001</span>
        <span className="badge ml-2">Abierto</span>
        <span className="badge badge-gold ml-2">Actuación</span>
        <h1 className="font-display mt-3 text-3xl text-[var(--wine-900)]">
          Contrato de arrendamiento comercial
        </h1>
      </header>
      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="tiempo">Tiempo</TabsTrigger>
        </TabsList>
        <TabsContent value="resumen">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="surface rounded-md p-3 text-sm">
              <dt className="hint">Responsable</dt>
              <dd className="font-medium">Ana Ruiz</dd>
            </div>
            <div className="surface rounded-md p-3 text-sm">
              <dt className="hint">Cuantía</dt>
              <dd className="font-medium">$120.000.000</dd>
            </div>
          </dl>
        </TabsContent>
        <TabsContent value="agenda">
          <EmptyState title="Agenda (próximamente)" />
        </TabsContent>
      </Tabs>
    </>
  );
}
