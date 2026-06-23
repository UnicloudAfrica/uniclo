import { test, type Page } from "@playwright/test";
import path from "path";

/** Click through every reworked detail tab at mobile + desktop and screenshot, to judge overflow + polish. */
const SHOTS = path.join(__dirname, "..", "screens");
const enc = (s: string) => encodeURIComponent(Buffer.from(s).toString("base64"));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");

const TENANT_TABS = ["Overview", "Clients", "Modules", "Onboarding", "Billing", "Network Policy", "POC Trials"];
const VPS = [
  { n: "mobile", w: 390, h: 844 },
  { n: "desktop", w: 1280, h: 900 },
];

async function snap(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `tabshot-${name}.png`), fullPage: true }).catch(() => {});
}

test("sweep tenant + client detail tabs", async ({ page }) => {
  test.setTimeout(300000);
  const t = enc(process.env.E2E_TENANT_IDENT || "B47F48");
  const c = enc(process.env.E2E_CLIENT_IDENT || "D1630F");

  for (const vp of VPS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(`/admin-dashboard/partners/details?id=${t}&name=${encodeURIComponent("E2E Tenant")}`);
    await page.waitForTimeout(3000);
    for (const tab of TENANT_TABS) {
      if (tab !== "Overview") {
        await page.locator("button.border-b-2", { hasText: tab }).first().click({ timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(2200);
      }
      await snap(page, `tenant-${slug(tab)}-${vp.n}`);
    }
    // client Modules tab (ClientModules component) at this viewport
    await page.goto(`/admin-dashboard/clients/details?id=${c}&name=${encodeURIComponent("E2E Client")}`);
    await page.waitForTimeout(3000);
    await page.locator("button.border-b-2", { hasText: "Modules" }).first().click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2200);
    await snap(page, `client-modules-${vp.n}`);
  }
});
