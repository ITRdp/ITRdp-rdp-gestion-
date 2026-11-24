"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import type { AppNotification } from "@/lib/types";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationsBell({
  notifications,
  unreadCount,
}: {
  notifications: AppNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={
          unreadCount
            ? `${unreadCount} notificaciones sin leer`
            : "Notificaciones"
        }
        onClick={() => setOpen((v) => !v)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--wine-700)] px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-md border border-[var(--line)] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-3 py-2">
            <p className="text-sm font-medium text-[var(--wine-900)]">
              Notificaciones
            </p>
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={pending}
                className="text-xs text-[var(--gold-500)] hover:underline"
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                  })
                }
              >
                Marcar todas
              </button>
            ) : null}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {!notifications.length ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--muted)]">
                Sin notificaciones.
              </li>
            ) : (
              notifications.map((n) => {
                const inner = (
                  <div className="grid gap-0.5">
                    <p
                      className={cn(
                        "text-sm",
                        n.read_at
                          ? "text-[var(--muted)]"
                          : "font-medium text-[var(--ink)]",
                      )}
                    >
                      {n.title}
                    </p>
                    {n.body ? (
                      <p className="line-clamp-2 text-xs text-[var(--muted)]">
                        {n.body}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-[var(--muted)]">
                      {formatDateTime(n.created_at)}
                    </p>
                  </div>
                );

                return (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-[var(--line)] last:border-0",
                      !n.read_at && "bg-[color-mix(in_srgb,var(--gold-400)_8%,white)]",
                    )}
                  >
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="block px-3 py-2.5 hover:bg-[var(--surface)]"
                        onClick={() => {
                          setOpen(false);
                          if (!n.read_at) {
                            startTransition(async () => {
                              await markNotificationReadAction(n.id);
                            });
                          }
                        }}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-[var(--surface)]"
                        onClick={() => {
                          if (!n.read_at) {
                            startTransition(async () => {
                              await markNotificationReadAction(n.id);
                            });
                          }
                        }}
                      >
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
