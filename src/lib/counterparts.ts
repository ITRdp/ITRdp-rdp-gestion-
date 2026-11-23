/** Helpers puros (server + client). Persistencia: "Nombre|doc; Nombre2|doc2". */

export type CounterpartItem = { name: string; document?: string };

export function parseCounterparts(
  raw: string | null | undefined,
): CounterpartItem[] {
  if (!raw?.trim()) return [];
  return raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [name, document] = part.split("|").map((s) => s.trim());
      return { name: name ?? "", document: document || undefined };
    })
    .filter((c) => c.name);
}

export function serializeCounterparts(items: CounterpartItem[]): string {
  return items
    .map((c) =>
      c.document?.trim()
        ? `${c.name.trim()}|${c.document.trim()}`
        : c.name.trim(),
    )
    .filter(Boolean)
    .join("; ");
}

export function formatCounterpartsDisplay(
  raw: string | null | undefined,
): string {
  const items = parseCounterparts(raw);
  if (!items.length) return "—";
  return items
    .map((c) => (c.document ? `${c.name} (${c.document})` : c.name))
    .join(" · ");
}
