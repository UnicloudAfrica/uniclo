import { test, expect, type Page } from "@playwright/test";
import path from "path";

/**
 * Admin Requirement Builder journey: open Requirements, create a consent
 * requirement (the no-code Input Gate definition) with a checkbox field, confirm
 * the POST persists and the new requirement appears in the list. Proves #70.
 */
const SHOTS = path.join(__dirname, "..", "screens");
async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `adminreq-${name}.png`), fullPage: true }).catch(() => {});
}

test("admin builds a consent requirement end-to-end", async ({ page }) => {
  test.setTimeout(120000);
  const title = `E2E Consent ${Date.now()}`;

  await page.goto("/admin-dashboard/requirements");
  await page.waitForTimeout(2500);
  await shot(page, "01-list");

  await page.getByRole("button", { name: /new requirement/i }).first().click();
  await page.waitForURL(/requirements\/new/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Name the form. The first question is already an "Agreement" tick box.
  await page.getByPlaceholder("e.g. New Hire Agreement").fill(title);
  await page.getByPlaceholder("e.g. I accept the Terms & Conditions").fill("I accept the Terms");
  await page.getByPlaceholder("I agree to the Terms & Conditions.").fill("I accept the Terms & Conditions.");

  // Advanced → test-specific placement so this doesn't gate the shared `onboarding`.
  await page.getByRole("button", { name: /advanced settings/i }).click();
  await page.getByPlaceholder("onboarding").fill("e2e-builder-test");
  await shot(page, "02-builder");

  const createResp = page
    .waitForResponse((r) => r.url().includes("/requirements") && r.request().method() === "POST", { timeout: 20000 })
    .catch(() => null);
  await page.getByRole("button", { name: /create form/i }).click();
  const cr = await createResp;
  if (cr) console.log("ADMIN_REQUIREMENT_CREATE_STATUS", cr.status());
  expect(cr?.status()).toBe(201);

  // Back on the list, the new requirement is shown.
  await page.waitForURL(/requirements$/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 10000 });
  await shot(page, "03-listed");
});
