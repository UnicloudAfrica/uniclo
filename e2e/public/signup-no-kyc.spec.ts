import { test, expect } from "@playwright/test";

// Verify the inline KYC section is gone from the tenant sign-up form.
test("sign-up form no longer shows the inline business-verification section", async ({ page }) => {
  test.setTimeout(40000);
  await page.goto("/sign-up");
  await page.waitForTimeout(3000);
  await page.screenshot({ path: "e2e/screens/signup-no-kyc.png", fullPage: true }).catch(() => {});

  // Company Name stays; the KYC controls are gone.
  await expect(page.getByText("Company Name")).toBeVisible({ timeout: 12000 });
  await expect(page.getByText("Verify your business")).toHaveCount(0);
  await expect(page.getByText("Incorporation Number")).toHaveCount(0);
  await expect(page.getByText("Business Type")).toHaveCount(0);
});
