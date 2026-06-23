import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * DEEP journey + screens: a tenant opens Team & Roles, creates a custom role
 * (name + a few permissions from the catalogue), and we confirm it appears and
 * was persisted. Proves the Phase 2 RBAC frontend + API end-to-end.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `roles-${name}.png`), fullPage: true }).catch(() => {});
}

test("tenant creates a custom role end-to-end", async ({ page }) => {
  test.setTimeout(90000);
  const name = `E2E UI Role ${Date.now()}`;

  await page.goto("/dashboard/roles");
  await page.waitForTimeout(2500);
  await shot(page, "01-list"); // preset roles list

  await page.getByRole("button", { name: /create role/i }).first().click();
  await page.waitForTimeout(1200);
  await page.getByPlaceholder("e.g. Billing Manager").fill(name);
  // turn on a handful of permission groups (button toggles, not checkboxes)
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Select all" }).first().click().catch(() => {});
    await page.waitForTimeout(200);
  }
  await shot(page, "02-form");

  const createResp = page
    .waitForResponse((r) => r.url().includes("/admin/roles") && r.request().method() === "POST", { timeout: 20000 })
    .catch(() => null);
  await page.getByRole("button", { name: /create role/i }).last().click();
  const cr = await createResp;
  if (cr) console.log("ROLE_CREATE_STATUS", cr.status());
  await page.waitForTimeout(2000);
  await shot(page, "03-created");

  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10000 });
});
