"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CourtSuggest({
  defaultValue,
  suggestions = [],
}: {
  defaultValue?: string | null;
  suggestions?: string[];
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const listId = useMemo(
    () => `court-suggest-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );
  const unique = useMemo(
    () =>
      [...new Set(suggestions.map((s) => s.trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "es"),
      ),
    [suggestions],
  );

  return (
    <div className="field">
      <Label htmlFor="court_name">Despacho</Label>
      <Input
        id="court_name"
        name="court_name"
        list={listId}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Juzgado / tribunal…"
        autoComplete="off"
      />
      <datalist id={listId}>
        {unique.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
