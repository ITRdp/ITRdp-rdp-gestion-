import { test, expect } from "@playwright/test";
import { nitCheckDigit } from "../src/lib/nit";
import { todayISO, APP_TIME_ZONE } from "../src/lib/format";
import {
  formatCounterpartsDisplay,
  parseCounterparts,
} from "../src/lib/counterparts";
import { humanizeActivitySummary } from "../src/lib/stage-labels";

test.describe("críticos @critical", () => {
  test("login muestra recuperar contraseña", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Acceso" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Olvidaste tu contraseña/i }),
    ).toBeVisible();
  });

  test("flujo olvidaste → formulario", async ({ page }) => {
    await page.goto("/olvidaste");
    await expect(
      page.getByRole("heading", { name: /Recuperar contraseña/i }),
    ).toBeVisible();
    await page.getByLabel("Correo").fill("demo@example.com");
    await page.getByRole("button", { name: /Enviar enlace/i }).click();
  });

  test("NIT válido e inválido (unidad)", async () => {
    const nit = "900123456";
    const dv = nitCheckDigit(nit);
    expect(dv).toMatch(/^\d$/);
    expect(nitCheckDigit("abc")).toBeNull();
  });

  test("todayISO respeta Bogotá", async () => {
    const iso = todayISO();
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const bogota = new Intl.DateTimeFormat("en-CA", {
      timeZone: APP_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    expect(iso).toBe(bogota);
  });

  test("preview prelanzamiento reportes usa lining nums (ruta pública)", async ({
    page,
  }) => {
    await page.goto("/dev/fase4-preview?view=reportes");
    await expect(page.getByRole("heading", { name: "Reportes" })).toBeVisible();
  });

  test("ruta desconocida exige acceso (app interna)", async ({ page }) => {
    await page.goto("/ruta-que-no-existe-rdp");
    await expect(page).toHaveURL(/\/login/);
  });

  test("parseCounterparts es usable en server (sin use client)", async () => {
    const items = parseCounterparts("Acme|900; Beta");
    expect(items).toHaveLength(2);
    expect(formatCounterpartsDisplay("Acme|900")).toContain("Acme");
    expect(
      humanizeActivitySummary("Asunto actualizado (etapa ingreso → solicitud)"),
    ).toMatch(/Ingreso → Solicitud/);
  });
});

