import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import type { Member } from "@/lib/types";

const links = [
  { href: "/", label: "Mi jornada" },
  { href: "/asuntos", label: "Asuntos" },
];

export function AppNav({
  member,
  currentPath,
}: {
  member: Member;
  currentPath: string;
}) {
  return (
    <header className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--ivory)_88%,white)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="font-display text-2xl text-[var(--wine)]">
            RDP Gestión
          </Link>
          <span className="hidden text-xs tracking-[0.18em] uppercase text-[var(--gold)] sm:inline">
            Despacho
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? currentPath === "/" || currentPath.startsWith("/jornada")
                : currentPath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-[var(--wine)] underline decoration-[var(--gold)] underline-offset-8"
                    : "text-[var(--muted)] hover:text-[var(--wine)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-[var(--ink)]">{member.full_name}</p>
            <p className="text-xs capitalize text-[var(--muted)]">{member.role}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary text-sm">
              Salir
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
