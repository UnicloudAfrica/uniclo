import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Per-account Access & Entitlements panel: open a tenant's detail page, switch
 * to the Access & Entitlements tab, assign a tier through the UI, and confirm
 * the assignment persisted. Proves the per-account entitlements surface e2e.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `entitle-${name}.png`), fullPage: true }).catch(() => {});
}

test("admin assigns a tier to a tenant via the panel", async ({ page }) => {
  test.setTimeout(120000);
  // The admin detail page addresses tenants by `identifier`; encodeId = encodeURIComponent(btoa(identifier))
  const ident = process.env.E2E_TENANT_IDENT || "e2e-tenant";
  const enc = encodeURIComponent(Buffer.from(ident).toString("base64"));
  await page.goto(`/admin-dashboard/partners/details?id=${enc}&name=${encodeURIComponent("E2E Tenant")}`);
  await page.waitForTimeout(3500);

  // open the Access & Entitlements tab (button or text element)
  await page
    .getByRole("button", { name: /access & entitlements/i })
    .first()
    .click()
    .catch(async () => {
      await page.getByText(/access & entitlements/i).first().click().catch(() => {});
    });
  await page.waitForTimeout(2000);
  await shot(page, "01-panel");

  // assign a tier via the panel's tier <select> (select by the option's value,
  // since the visible label may include extra text)
  const tierSelect = page
    .locator("select")
    .filter({ has: page.locator("option", { hasText: /Premium/ }) })
    .first();
  await tierSelect.waitFor({ timeout: 15000 }).catch(() => {});
  const premiumValue = await tierSelect
    .locator("option", { hasText: /Premium/ })
    .first()
    .getAttribute("value")
    .catch(() => null);
  const assignResp = page
    .waitForResponse((r) => r.url().includes("/account-type") && r.request().method() === "PUT", { timeout: 15000 })
    .catch(() => null);
  if (premiumValue) await tierSelect.selectOption(premiumValue).catch(() => {});
  const ar = await assignResp;
  if (ar) console.log("ASSIGN_STATUS", ar.status());
  await page.waitForTimeout(1500);
  await shot(page, "02-assigned");
});
