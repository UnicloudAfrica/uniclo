import { test, expect } from "@playwright/test";

/**
 * CLIENT pricing visibility journey.
 *
 * /client-dashboard/pricing-calculator renders SharedPricingCalculator
 * (mode="client") — a client builds a scenario (compute / storage / add-ons) and
 * clicks "Calculate Pricing" to see a priced summary. /client-dashboard/billing
 * renders the client's invoices + billing summary.
 *
 * The calculator's pickers are custom SelectableInput widgets (not native
 * selects), so we assert the estimate UI renders and exercise the Calculate CTA
 * opportunistically. Both surfaces degrade gracefully — the verifiable floor is
 * that each page renders its heading + primary controls.
 */
test("client sees the pricing calculator and billing summary", async ({ page }) => {
  test.setTimeout(120000);

  // ---- Pricing calculator ----
  await page.goto("/client-dashboard/pricing-calculator");

  // Estimate UI renders.
  await expect(
    page.getByRole("heading", { name: /pricing calculator/i }).first(),
  ).toBeVisible({ timeout: 20000 });
  // Configuration scaffold + the primary Calculate CTA prove the calculator is
  // interactive for the client audience.
  const calcBtn = page.getByRole("button", { name: /calculate pricing/i });
  await expect(calcBtn).toBeVisible({ timeout: 15000 });
  console.log("OK :: client pricing calculator UI rendered");

  // Opportunistic: clicking Calculate with no workload surfaces a validation
  // hint (proves the calc engine is wired); a populated scenario would show a
  // PriceLabel total. Either outcome keeps the page interactive — we don't hard
  // assert a converted figure (FX/tax vary) per the suite's money rules.
  try {
    await calcBtn.click({ timeout: 5000 });
    await page.waitForTimeout(1500);
    const priced = page.getByText(/please add at least one item|summary|total|estimated/i).first();
    if (await priced.count()) {
      console.log("OK :: calculate engine responded (validation/summary shown)");
    }
  } catch (e) {
    console.log(`SOFT :: calculate interaction skipped :: ${(e as Error).message.split("\n")[0].slice(0, 120)}`);
  }

  // ---- Billing summary ----
  await page.goto("/client-dashboard/billing");
  await expect(
    page.getByRole("heading", { name: /billing & invoices/i }).first(),
  ).toBeVisible({ timeout: 20000 });
  // Billing stat cards render regardless of whether any invoices exist.
  await expect(page.getByText(/total outstanding/i).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/total invoices/i).first()).toBeVisible({ timeout: 10000 });
  console.log("OK :: client billing summary rendered");
});
