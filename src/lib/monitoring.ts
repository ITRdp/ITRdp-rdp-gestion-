/** Monitoreo opcional (Sentry u otro). Sin DSN no hace nada. */

export function captureException(error: unknown, context?: Record<string, unknown>) {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[monitoring]", error, context);
    }
    return;
  }
  // Integración completa: añadir @sentry/nextjs y llamar Sentry.captureException.
  console.error("[monitoring:sentry-pending]", error, context);
}
