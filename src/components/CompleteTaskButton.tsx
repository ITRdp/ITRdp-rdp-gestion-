"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { completeTaskAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";

export function CompleteTaskButton({
  taskId,
  matterId,
}: {
  taskId: string;
  matterId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await completeTaskAction(taskId, matterId);
            toast.success("Tarea marcada como completada");
          } catch {
            toast.error("No se pudo completar la tarea");
          }
        })
      }
    >
      {pending ? "Completando…" : "Marcar completada"}
    </Button>
  );
}
