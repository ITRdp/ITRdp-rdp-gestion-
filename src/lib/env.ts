/**
 * Validación de variables de entorno al arrancar (servidor).
 * Falla con mensaje claro si faltan las obligatorias en producción.
 */

const REQUIRED_PUBLIC = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_URL",
] as const;

const REQUIRED_SERVER = ["SUPABASE_SERVICE_ROLE_KEY"] as const;

export type AppEnv = {
  siteUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string | undefined;
};

function missing(keys: readonly string[]) {
  return keys.filter((k) => {
    const v = process.env[k];
    return !v || !String(v).trim() || String(v).includes("placeholder");
  });
}

/** Origen canónico de la app (sin slash final). */
export function getSiteUrl(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (site) return site;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Valida env. En production exige SITE_URL + Supabase + service role.
 * En development/test avisa pero no aborta si solo faltan opcionales de prod.
 */
export function assertAppEnv(): AppEnv {
  const isProd = process.env.NODE_ENV === "production";
  // Durante `next build` NODE_ENV=production pero aún no hay secretos reales.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const pubMissing = missing(REQUIRED_PUBLIC);
  const srvMissing = missing(REQUIRED_SERVER);

  if (isProd && !isBuild) {
    const all = [...pubMissing, ...srvMissing];
    if (all.length) {
      throw new Error(
        `[RDP Gestión] Faltan variables de entorno obligatorias en producción: ${all.join(", ")}. ` +
          `Configúralas en Vercel (Production) y redespliega.`,
      );
    }
  } else if (pubMissing.length) {
    console.warn(
      `[RDP Gestión] Variables públicas incompletas (dev/build): ${pubMissing.join(", ")}`,
    );
  }

  return {
    siteUrl: getSiteUrl(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}
