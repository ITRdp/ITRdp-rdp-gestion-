import type { MetadataRoute } from "next";

/** App interna: bloquear indexación. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
