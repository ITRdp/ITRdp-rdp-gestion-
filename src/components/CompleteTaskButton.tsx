"use client";

import { useTransition } from "react";
import { completeTaskAction } from "@/app/actions/tasks";

export function CompleteTaskButton({
  taskId,
  matterId,
}: {
  taskId: string;
  matterId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="btn btn-primary text-sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await completeTaskAction(taskId, matterId);
        })
      }
    >
      {pending ? "Completando…" : "Marcar completada"}
    </button>
  );
}
