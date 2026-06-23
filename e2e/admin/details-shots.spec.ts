import { test, type Page } from "@playwright/test";
import path from "path";

/** Capture full-page shots of the tenant + client admin detail pages (before/after redesign). */
const SHOTS = path.join(__dirname, "..", "screens");
const suffix = process.env.SHOT_SUFFIX || "before";
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `redesign-${name}-${suffix}.png`), fullPage: true }).catch(() => {});
}
const enc = (s: string) => encodeURIComponent(Buffer.from(s).toString("base64"));

test("capture tenant + client detail pages", async ({ page }) => {
  test.setTimeout(90000);
  const t = process.env.E2E_TENANT_IDENT || "B47F48";
  const c = process.env.E2E_CLIENT_IDENT || "D1630F";

  await page.goto(`/admin-dashboard/partners/details?id=${enc(t)}&name=${encodeURIComponent("E2E Tenant")}`);
  await page.waitForTimeout(3500);
  await shot(page, "tenant");

  await page.goto(`/admin-dashboard/clients/details?id=${enc(c)}&name=${encodeURIComponent("E2E Client")}`);
  await page.waitForTimeout(3500);
  await shot(page, "client");
});
