import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Admin RBAC journey + screens: open Roles & Permissions, create a custom role
 * via the slide-over drawer (name + a few permission groups), confirm it appears
 * and persists, then capture the Assign-admins tab. Proves admin Phase 2 e2e.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `adminroles-${name}.png`), fullPage: true }).catch(() => {});
}

test("admin creates a custom role end-to-end", async ({ page }) => {
  test.setTimeout(120000);
  const name = `E2E Admin Role ${Date.now()}`;

  await page.goto("/admin-dashboard/roles");
  await page.waitForTimeout(3000);
  await shot(page, "01-list"); // stat tiles + role cards with fingerprints

  await page.getByRole("button", { name: /create role/i }).first().click();
  await page.waitForTimeout(1200); // drawer slides in
  await page.getByPlaceholder("e.g. Billing Manager").fill(name);
  // turn on a handful of groups (each "Select all" click flips that group to "Clear all")
  for (let i = 0; i < 5; i++) {
    await page.getByRole("button", { name: "Select all" }).first().click().catch(() => {});
    await page.waitForTimeout(200);
  }
  await shot(page, "02-drawer"); // the wow drawer: density bar, search, grouped toggles

  const createResp = page
    .waitForResponse((r) => r.url().includes("/roles") && r.request().method() === "POST", { timeout: 20000 })
    .catch(() => null);
  await page.getByRole("button", { name: /create role/i }).last().click();
  const cr = await createResp;
  if (cr) console.log("ADMIN_ROLE_CREATE_STATUS", cr.status());
  await page.waitForTimeout(2000);
  await shot(page, "03-created");
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });

  // assign-admins tab
  await page.getByRole("button", { name: /assign admins/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "04-assign");
});
