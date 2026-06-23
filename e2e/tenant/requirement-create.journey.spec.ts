import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Tenant Requirement Builder journey: a tenant opens its own "Onboarding Forms",
 * builds a consent form with the SAME shared builder as the admin, and confirms
 * the POST persists (to tenant/v1/requirements, scope forced to the tenant) and
 * the form appears in the list. Proves the shared builder works for tenants.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `tenantreq-${name}.png`), fullPage: true }).catch(() => {});
}

test("tenant builds its own onboarding form end-to-end", async ({ page }) => {
  test.setTimeout(120000);
  const title = `T2E Tenant Form ${Date.now()}`;

  await page.goto("/dashboard/requirements");
  await page.waitForTimeout(2500);
  await shot(page, "01-list");

  await page.getByRole("button", { name: /new form/i }).first().click();
  await page.waitForURL(/requirements\/new/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Same shared builder — the first question is already an "Agreement" tick box.
  await page.getByPlaceholder("e.g. New Hire Agreement").fill(title);
  await page.getByPlaceholder("e.g. I accept the Terms & Conditions").fill("I accept the partner terms");
  await page.getByPlaceholder("I agree to the Terms & Conditions.").fill("I accept the partner terms.");

  await page.getByRole("button", { name: /advanced settings/i }).click();
  await page.getByPlaceholder("onboarding").fill("e2e-tenant-form-test");
  await shot(page, "02-builder");

  const createResp = page
    .waitForResponse((r) => r.url().includes("/requirements") && r.request().method() === "POST", { timeout: 20000 })
    .catch(() => null);
  await page.getByRole("button", { name: /create form/i }).click();
  const cr = await createResp;
  if (cr) console.log("TENANT_REQUIREMENT_CREATE_STATUS", cr.status());
  expect(cr?.status()).toBe(201);

  await page.waitForURL(/requirements$/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
  await shot(page, "03-listed");
});
