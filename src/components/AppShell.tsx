"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseBusiness,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  Search,
  SunMedium,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Member } from "@/lib/types";

const nav = [
  {
    href: "/",
    label: "Mi jornada",
    icon: SunMedium,
    match: (p: string) => p === "/" || p.startsWith("/jornada"),
  },
  {
    href: "/agenda",
    label: "Agenda",
    icon: CalendarDays,
    match: (p: string) => p.startsWith("/agenda"),
  },
  {
    href: "/asuntos",
    label: "Asuntos",
    icon: BriefcaseBusiness,
    match: (p: string) => p.startsWith("/asuntos"),
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
    match: (p: string) => p.startsWith("/clientes"),
  },
];

export function AppShell({
  member,
  children,
}: {
  member: Member;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const sidebar = (
    <aside
      className={cn(
        "relative flex h-full flex-col bg-[var(--wine-900)] text-[var(--surface)] transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className="pointer-events-none absolute inset-0 brand-texture" aria-hidden />
      <div className="relative border-b border-white/10 px-3 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/brand/monogram-gold.png"
            alt="RDP"
            width={36}
            height={40}
            className="h-9 w-auto"
            priority
          />
          {!collapsed && (
            <div className="min-w-0">
              <Image
                src="/brand/wordmark-white.png"
                alt="Rojas & De Paz Abogados S.A.S."
                width={160}
                height={48}
                className="h-8 w-auto max-w-[9.5rem] object-contain object-left"
              />
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--gold-400)]">
                Gestión
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="relative flex-1 space-y-1 px-2 py-4">
        {nav.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active ? "text-[var(--gold-400)]" : "text-white/60",
                )}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/10 p-2">
        <button
          type="button"
          className="hidden w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-white/70 transition hover:bg-white/5 hover:text-white md:flex"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronsLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[var(--surface)]">
      <div className="sticky top-0 hidden h-screen shrink-0 md:block">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--wine-900)_50%,black)]/40"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 shadow-2xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_92%,white)]/95 px-3 backdrop-blur sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            {mobileOpen ? <X /> : <Menu />}
          </Button>

          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-[var(--line)] bg-white px-3 text-left text-sm text-[var(--muted)] transition hover:border-[color-mix(in_srgb,var(--gold-400)_50%,transparent)] sm:max-w-md"
          >
            <Search className="h-4 w-4 text-[var(--gold-400)]" />
            <span className="truncate">Buscar asuntos o clientes…</span>
            <kbd className="ml-auto hidden rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted)] sm:inline">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-[var(--ink)]">
                {member.full_name}
              </p>
              <p className="text-xs capitalize text-[var(--muted)]">
                {member.role}
              </p>
            </div>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary" size="sm">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
