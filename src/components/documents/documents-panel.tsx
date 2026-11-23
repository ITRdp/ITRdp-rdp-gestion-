"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addDocumentLinkAction,
  softDeleteDocumentAction,
  uploadDocumentAction,
  getDocumentSignedUrl,
  type FormState,
} from "@/app/actions/documents";
import type { MatterDocument } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";

const initial: FormState = {};

function formatBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsPanel({
  matterId,
  documents,
}: {
  matterId: string;
  documents: MatterDocument[];
}) {
  const [tab, setTab] = useState<"upload" | "link">("link");
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadDocumentAction,
    initial,
  );
  const [linkState, linkAction, linkPending] = useActionState(
    addDocumentLinkAction,
    initial,
  );
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  async function openStorage(path: string) {
    setMsg(null);
    const res = await getDocumentSignedUrl(path);
    if (res.error || !res.url) {
      setMsg(res.error ?? "No se pudo abrir.");
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="surface rounded-md p-4">
        <div className="mb-4 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={tab === "link" ? "default" : "secondary"}
            onClick={() => setTab("link")}
          >
            Enlace OneDrive
          </Button>
          <Button
            type="button"
            size="sm"
            variant={tab === "upload" ? "default" : "secondary"}
            onClick={() => setTab("upload")}
          >
            Subir archivo
          </Button>
        </div>

        {tab === "link" ? (
          <form action={linkAction} className="grid gap-3">
            <input type="hidden" name="matter_id" value={matterId} />
            <input type="hidden" name="source" value="onedrive" />
            <div>
              <Label htmlFor="doc-title">Título</Label>
              <Input id="doc-title" name="title" required />
            </div>
            <div>
              <Label htmlFor="doc-url">URL OneDrive / SharePoint</Label>
              <Input
                id="doc-url"
                name="onedrive_url"
                type="url"
                required
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="doc-desc">Descripción</Label>
              <Textarea id="doc-desc" name="description" rows={2} />
            </div>
            {linkState.error ? (
              <p className="text-sm text-red-700">{linkState.error}</p>
            ) : null}
            {linkState.success ? (
              <p className="text-sm text-emerald-700">{linkState.success}</p>
            ) : null}
            <Button type="submit" disabled={linkPending}>
              {linkPending ? "Guardando…" : "Enlazar documento"}
            </Button>
          </form>
        ) : (
          <form action={uploadAction} className="grid gap-3">
            <input type="hidden" name="matter_id" value={matterId} />
            <div>
              <Label htmlFor="up-title">Título</Label>
              <Input id="up-title" name="title" required />
            </div>
            <div>
              <Label htmlFor="up-file">Archivo (máx. 50 MB)</Label>
              <Input id="up-file" name="file" type="file" required />
            </div>
            <div>
              <Label htmlFor="up-desc">Descripción</Label>
              <Textarea id="up-desc" name="description" rows={2} />
            </div>
            {uploadState.error ? (
              <p className="text-sm text-red-700">{uploadState.error}</p>
            ) : null}
            {uploadState.success ? (
              <p className="text-sm text-emerald-700">{uploadState.success}</p>
            ) : null}
            <Button type="submit" disabled={uploadPending}>
              {uploadPending ? "Subiendo…" : "Subir a Storage"}
            </Button>
            <p className="text-xs text-[var(--muted)]">
              Requiere bucket privado <code>matter-documents</code> en Supabase
              Storage. Si no está, usa enlace OneDrive.
            </p>
          </form>
        )}
      </section>

      <section>
        <h2 className="font-display mb-3 text-xl text-[var(--wine-900)]">
          Documentos del asunto
        </h2>
        {msg ? <p className="mb-2 text-sm text-red-700">{msg}</p> : null}
        {!documents.length ? (
          <EmptyState title="Sin documentos aún." />
        ) : (
          <ul className="grid gap-3">
            {documents.map((d) => (
              <li key={d.id} className="surface rounded-md p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[var(--ink)]">{d.title}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {d.source === "storage"
                        ? "Storage"
                        : d.source === "onedrive"
                          ? "OneDrive"
                          : "Enlace"}{" "}
                      · {formatDateTime(d.created_at)}
                      {d.file_size ? ` · ${formatBytes(d.file_size)}` : ""}
                    </p>
                    {d.description ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {d.description}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    {d.source === "storage" && d.storage_path ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => openStorage(d.storage_path!)}
                      >
                        Abrir
                      </Button>
                    ) : d.onedrive_url ? (
                      <Button asChild size="sm" variant="secondary">
                        <a
                          href={d.onedrive_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await softDeleteDocumentAction(d.id, matterId);
                        })
                      }
                    >
                      Archivar
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
