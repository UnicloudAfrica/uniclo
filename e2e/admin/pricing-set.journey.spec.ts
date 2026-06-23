import { test, expect } from "@playwright/test";

/**
 * ADMIN compute base-price journey.
 *
 * The unified PricingShell at /admin-dashboard/pricing?product=compute renders
 * CatalogPane. Editing a compute SKU price is the core money operation an admin
 * performs: click the row's pencil ("Edit price"), an inline number input
 * appears in that row, type a new price, hit the row's Save. The success toast
 * "Saved {productName}." is the proof the price persisted.
 *
 * Region filter stays at "All regions" so rows load (compute pricing has data).
 */
test("admin edits a compute SKU base price", async ({ page }) => {
  test.setTimeout(120000);

  await page.goto("/admin-dashboard/pricing?product=compute");

  // The left rail groups external-API platforms (SlimDeploy / Shield /
  // AnyCloudFlow / StaqDB) under an "Integration products" heading.
  await expect(page.getByText("Integration products").first()).toBeVisible({ timeout: 30000 });

  // Wait for the catalog table to populate. The first edit pencil only renders
  // once rows are present.
  const editButton = page.locator('button[title="Edit price"]').first();
  await expect(editButton).toBeVisible({ timeout: 30000 });
  await editButton.click();

  // The inline editor swaps the price cell for a number input in that row.
  const priceInput = page.locator('input[type="number"]').first();
  await expect(priceInput).toBeVisible({ timeout: 15000 });
  await priceInput.fill("133.70");

  // Save the row (CatalogPane renders a ModernButton labelled exactly "Save").
  await page.getByRole("button", { name: /^save$/i }).first().click();

  // Core assertion: success toast text is "Saved {productName}."
  await expect(page.getByText(/^Saved/i).first()).toBeVisible({ timeout: 20000 });
});
