import { test, expect } from "@playwright/test";

/**
 * The sub-tenant/client onboarding REVIEW queue moved from /dashboard/onboarding
 * (now the tenant's own self-onboarding step forms) to /dashboard/customer-onboarding,
 * a non-onboarding path so a COMPLETED tenant isn't bounced away by the onboarding guard.
 */
test("tenant onboarding review renders at /dashboard/customer-onboarding", async ({ page }) => {
  test.setTimeout(40000);
  await page.goto("/dashboard/customer-onboarding");
  await page.waitForTimeout(3500);
  await page.screenshot({ path: "e2e/screens/onboarding-review-moved.png", fullPage: true }).catch(() => {});

  // The review queue rendered (not redirected to the self-onboarding form / dashboard).
  // Use the heading role — "Onboarding Review" also appears as a sidebar item.
  await expect(page).toHaveURL(/\/dashboard\/customer-onboarding/);
  await expect(page.getByRole("heading", { name: "Onboarding Review" })).toBeVisible({ timeout: 12000 });
});
