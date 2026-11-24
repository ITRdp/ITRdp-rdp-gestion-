"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  parseCounterparts,
  serializeCounterparts,
} from "@/lib/counterparts";

export function CounterpartsField({
  defaultValue,
}: {
  defaultValue?: string | null;
}) {
  const [items, setItems] = useState(() => parseCounterparts(defaultValue));
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");

  function add() {
    const n = name.trim();
    if (!n) return;
    setItems((prev) => [
      ...prev,
      { name: n, document: document.trim() || undefined },
    ]);
    setName("");
    setDocument("");
  }

  return (
    <div className="field sm:col-span-2">
      <Label>Contraparte(s)</Label>
      <input
        type="hidden"
        name="counterparts"
        value={serializeCounterparts(items)}
      />
      {items.length ? (
        <ul className="mb-2 flex flex-wrap gap-2">
          {items.map((c, i) => (
            <li
              key={`${c.name}-${i}`}
              className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[var(--wine-50)] px-2 py-1 text-sm"
            >
              <span className="font-medium">{c.name}</span>
              {c.document ? (
                <span className="text-xs text-[var(--muted)]">{c.document}</span>
              ) : null}
              <button
                type="button"
                className="rounded p-0.5 text-[var(--muted)] hover:text-[var(--danger)]"
                aria-label={`Quitar ${c.name}`}
                onClick={() =>
                  setItems((prev) => prev.filter((_, j) => j !== i))
                }
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre"
          className="min-w-[10rem] flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Input
          value={document}
          onChange={(e) => setDocument(e.target.value)}
          placeholder="Documento (opcional)"
          className="w-40"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" onClick={add}>
          Agregar
        </Button>
      </div>
    </div>
  );
}
