"use client";

import { useTransition } from "react";
import { softDeleteMatterAction } from "@/app/actions/matters";
import { Button } from "@/components/ui/button";

export function ConfirmArchiveButton({ matterId }: { matterId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      className="mt-4"
      onClick={() => {
        if (
          !window.confirm(
            "¿Archivar este asunto? Dejará de aparecer en listados activos.",
          )
        ) {
          return;
        }
        startTransition(async () => {
          await softDeleteMatterAction(matterId);
        });
      }}
    >
      {pending ? "Archivando…" : "Archivar asunto"}
    </Button>
  );
}
