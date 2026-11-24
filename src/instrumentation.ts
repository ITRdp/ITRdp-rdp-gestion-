export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertAppEnv } = await import("@/lib/env");
    assertAppEnv();
  }
}
