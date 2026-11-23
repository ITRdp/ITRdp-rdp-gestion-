"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Lectura por defecto; botón Editar revela el formulario. */
export function EditGate({
  title = "Datos",
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-[var(--wine-900)]">{title}</h2>
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
          Editar
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-[var(--wine-900)]">{title}</h2>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
      {children}
    </div>
  );
}
