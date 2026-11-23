"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "border border-[var(--line)] bg-[var(--surface-elevated)] text-[var(--ink)] shadow-lg",
          title: "text-[var(--wine-900)]",
          description: "text-[var(--muted)]",
        },
      }}
    />
  );
}
