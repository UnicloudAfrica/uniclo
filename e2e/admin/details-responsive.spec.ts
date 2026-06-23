import { test, type Page } from "@playwright/test";
import path from "path";

/** Capture tenant + client detail pages at desktop/tablet/mobile to catch text overflow. */
const SHOTS = path.join(__dirname, "..", "screens");
const suffix = process.env.SHOT_SUFFIX || "pre";
const enc = (s: string) => encodeURIComponent(Buffer.from(s).toString("base64"));
const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 900 },
  { name: "tablet", width: 820, height: 1100 },
  { name: "mobile", width: 390, height: 844 },
];

async function snap(page: Page, who: string, vp: string) {
  await page.screenshot({ path: path.join(SHOTS, `resp-${who}-${vp}-${suffix}.png`), fullPage: true }).catch(() => {});
}

test("capture detail pages across viewports", async ({ page }) => {
  test.setTimeout(180000);
  const t = enc(process.env.E2E_TENANT_IDENT || "B47F48");
  const c = enc(process.env.E2E_CLIENT_IDENT || "D1630F");

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`/admin-dashboard/partners/details?id=${t}&name=${encodeURIComponent("E2E Tenant")}`);
    await page.waitForTimeout(2800);
    await snap(page, "tenant", vp.name);
    await page.goto(`/admin-dashboard/clients/details?id=${c}&name=${encodeURIComponent("E2E Client")}`);
    await page.waitForTimeout(2800);
    await snap(page, "client", vp.name);
  }
});
