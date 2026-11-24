"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Lectura por defecto; botón Editar revela el formulario. */
export function EditGate({
  title = "Datos",
  preview,
  children,
}: {
  title?: string;
  /** Contenido de solo lectura cuando no se edita. */
  preview?: ReactNode;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-[var(--wine-900)]">{title}</h2>
        <Button
          type="button"
          variant={editing ? "ghost" : "secondary"}
          size="sm"
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Cancelar" : "Editar"}
        </Button>
      </div>
      {editing ? children : (preview ?? null)}
    </div>
  );
}
