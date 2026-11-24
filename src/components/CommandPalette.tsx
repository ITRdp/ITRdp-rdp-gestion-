"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, CalendarDays, Plus, Users } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type MatterHit = {
  id: string;
  title: string;
  code?: string;
  status: string;
  clientName: string | null;
};

type ClientHit = {
  id: string;
  name: string;
  nit: string | null;
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [matters, setMatters] = useState<MatterHit[]>([]);
  const [clients, setClients] = useState<ClientHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setMatters([]);
      setClients([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) {
        setMatters([]);
        setClients([]);
        return;
      }
      const data = (await res.json()) as {
        matters: MatterHit[];
        clients: ClientHit[];
      };
      setMatters(data.matters ?? []);
      setClients(data.clients ?? []);
    } catch {
      setMatters([]);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void search(query);
    }, 180);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setMatters([]);
      setClients([]);
    }
  }, [open]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar asuntos o clientes…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading ? (
          <div className="space-y-2 p-3" aria-live="polite">
            <p className="text-xs text-[var(--muted)]">Buscando…</p>
            <div className="skeleton h-8 w-full" />
            <div className="skeleton h-8 w-4/5" />
          </div>
        ) : null}
        <CommandEmpty>
          {loading
            ? " "
            : query.trim()
              ? "Sin resultados"
              : "Escribe para buscar o elige una acción rápida"}
        </CommandEmpty>
        {!query.trim() ? (
          <CommandGroup heading="Acciones rápidas">
            <CommandItem value="nuevo-asunto" onSelect={() => go("/asuntos")}>
              <Plus className="text-[var(--wine-700)]" />
              Nuevo asunto
            </CommandItem>
            <CommandItem value="nuevo-cliente" onSelect={() => go("/clientes")}>
              <Users className="text-[var(--wine-700)]" />
              Nuevo cliente
            </CommandItem>
            <CommandItem value="ir-agenda" onSelect={() => go("/agenda")}>
              <CalendarDays className="text-[var(--wine-700)]" />
              Ir a Agenda
            </CommandItem>
          </CommandGroup>
        ) : null}
        {matters.length > 0 && (
          <CommandGroup heading="Asuntos">
            {matters.map((m) => (
              <CommandItem
                key={m.id}
                value={`asunto-${m.code ?? ""}-${m.title}-${m.clientName ?? ""}`}
                onSelect={() => go(`/asuntos/${m.id}`)}
              >
                <Briefcase className="text-[var(--gold-400)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.title}</p>
                  <p className="truncate text-xs text-[var(--muted)]">
                    {m.code ? `${m.code} · ` : ""}
                    {m.clientName ?? "Cliente"} · {m.status}
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {clients.length > 0 && (
          <CommandGroup heading="Clientes">
            {clients.map((c) => (
              <CommandItem
                key={c.id}
                value={`cliente-${c.name}`}
                onSelect={() => go(`/clientes/${c.id}`)}
              >
                <Users className="text-[var(--wine-700)]" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.nit ? (
                    <p className="truncate text-xs text-[var(--muted)]">
                      Doc. {c.nit}
                    </p>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
