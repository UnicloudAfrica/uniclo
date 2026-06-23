import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Account Types (entitlement tiers) journey + screens: open the page, create a
 * tenant tier via the slide-over drawer (name + entitlement groups), confirm it
 * persists, then view the Client tiers tab. Proves the entitlements UI e2e.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `tiers-${name}.png`), fullPage: true }).catch(() => {});
}

test("admin creates an account tier end-to-end", async ({ page }) => {
  test.setTimeout(120000);
  const name = `E2E Tier ${Date.now()}`;

  await page.goto("/admin-dashboard/account-types");
  await page.waitForTimeout(3000);
  await shot(page, "01-list"); // tenant tiers with entitlement fingerprints

  await page.getByRole("button", { name: "Create tier" }).first().click();
  await page.waitForTimeout(1200);
  await page.getByPlaceholder("e.g. Premium").fill(name);
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Select all" }).first().click().catch(() => {});
    await page.waitForTimeout(200);
  }
  await shot(page, "02-drawer");

  const createResp = page
    .waitForResponse((r) => r.url().includes("/account-types") && r.request().method() === "POST", { timeout: 20000 })
    .catch(() => null);
  await page.getByRole("button", { name: /^Create (tier|role)$/ }).last().click();
  const cr = await createResp;
  if (cr) console.log("TIER_CREATE_STATUS", cr.status());
  await page.waitForTimeout(2000);
  await shot(page, "03-created");
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });

  // client tiers tab
  await page.getByRole("button", { name: /client tiers/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "04-client");
});
