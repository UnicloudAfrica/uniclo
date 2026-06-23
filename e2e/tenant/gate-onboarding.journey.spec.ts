import { test, expect } from "@playwright/test";

/**
 * Part B2: the gate-driven onboarding page (dual-run) renders the onboarding
 * steps that were migrated onto the Dynamic Input Gate (placement
 * `onboarding-steps`). A business tenant lands on the page and the gate prompts
 * the first migrated step ("Business Profile").
 */
test("tenant sees gate-driven onboarding steps", async ({ page }) => {
  test.setTimeout(60000);

  await page.goto("/dashboard/gate-onboarding");
  await page.waitForTimeout(5000);
  await page.screenshot({ path: "e2e/screens/gateonboarding-01.png", fullPage: true }).catch(() => {});

  // The migrated KYC step renders in the gate-driven checklist (exact match — the
  // page description also contains the phrase "verify your business").
  await expect(page.getByText("Verify your business", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("Business Profile", { exact: true })).toBeVisible();
});
