import { test, expect } from "@playwright/test";

/**
 * TENANT integration markup journey.
 *
 * /dashboard/pricing?product=anycloudflow renders IntegrationPricingPane in
 * role=tenant. AnyCloudFlow is the populated integration product (seeded by
 * E2eSeeder via AnyCloudFlowPricingSeeder). The tenant view scopes overrides
 * to the CURRENT tenant — there is no "Apply tenant overrides for" picker;
 * every service row exposes its own InlinePriceEditor
 * (data-testid="tenant-override-<id>") floored at the platform default.
 *
 * This asserts the real money operation end-to-end: set an override (toast
 * "Override saved") then clear it (toast "Override cleared"), leaving the
 * tenant back on the platform default so the run is idempotent.
 */
test("tenant sets and clears an integration price override", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/dashboard/pricing?product=anycloudflow");

  // Pane heading proves the role=tenant pane mounted.
  await expect(
    page.getByRole("heading", { name: /anycloudflow services/i }),
  ).toBeVisible({ timeout: 20000 });

  // The fixed model: a tenant edits its OWN prices — no tenant selector.
  await expect(
    page.locator('select:has(option:has-text("Select a tenant"))'),
  ).toHaveCount(0);

  // Override editor renders directly (one per integration service).
  const cell = page.locator('[data-testid^="tenant-override-"]').first();
  await expect(cell).toBeVisible({ timeout: 20000 });

  const input = cell.locator('[data-testid$="-input"]');
  await expect(input).toBeEnabled({ timeout: 15000 });

  // If a previous run left an override, clear it so we start from the
  // platform default (keeps the journey idempotent).
  const clearBefore = cell.locator('[data-testid$="-clear"]');
  if (await clearBefore.count()) {
    await clearBefore.click();
    await expect(page.getByText(/override cleared/i).first()).toBeVisible({ timeout: 15000 });
  }

  // 100000 is safely >= any admin default (min-floor validation passes).
  await input.fill("100000");
  await cell.locator('[data-testid$="-save"]').click();
  await expect(page.getByText(/override saved/i).first()).toBeVisible({ timeout: 20000 });

  // The override now exists → the revert control appears; clear it.
  const clearAfter = cell.locator('[data-testid$="-clear"]');
  await expect(clearAfter).toBeVisible({ timeout: 15000 });
  await clearAfter.click();
  await expect(page.getByText(/override cleared/i).first()).toBeVisible({ timeout: 15000 });
});
