import { test, expect } from "@playwright/test";

/**
 * TENANT margin calculator journey.
 *
 * /dashboard/discounts renders TenantDiscountManager → MarginCalculator. The
 * tenant enters a base amount + a client discount %, clicks "Calculate Margin",
 * and the preview block renders ("Client Pays", "You Owe Admin", currency figures).
 *
 * (The margin-preview hook used to double-unwrap its response envelope and always
 * threw; fixed in TenantDiscountManager, so this asserts the real preview.)
 */
test("tenant calculates a client-discount margin", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/dashboard/discounts");

  // Inputs are keyed by their placeholders ("100" base, "30" discount).
  const baseInput = page.getByPlaceholder("100");
  const discountInput = page.getByPlaceholder("30");
  await expect(baseInput).toBeVisible({ timeout: 20000 });
  await expect(discountInput).toBeVisible({ timeout: 15000 });

  await baseInput.fill("250");
  await discountInput.fill("20");

  const calcBtn = page.getByRole("button", { name: /calculate margin/i });
  await expect(calcBtn).toBeVisible({ timeout: 15000 });
  await calcBtn.click();

  // The preview block renders the margin breakdown on success. Labels come from
  // TenantDiscountManager's MarginCalculator: "Client Pays:" + "You Owe Admin:".
  await expect(page.getByText(/client pays/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/you owe admin/i).first()).toBeVisible({ timeout: 10000 });
});
