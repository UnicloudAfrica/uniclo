import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * DEEP journey: admin builds a real invoice through the 4-step wizard (Invoice
 * info -> Add items -> Review -> Confirmation) and we assert the success screen.
 * Default "unassigned" customer context, so no pre-seeded customer is needed.
 * The selects have no ids and their labels aren't htmlFor-linked, so we key off
 * each select's unique placeholder <option>; number fields are ModernInputs
 * (role=spinbutton / placeholder).
 */
const selectWithOption = (page: Page, optionText: string): Locator =>
  page.locator(`select:has(option:has-text(${JSON.stringify(optionText)}))`).first();

async function pickFirstReal(select: Locator) {
  await expect(select).toBeEnabled({ timeout: 15000 });
  // Wait until real options have loaded beyond the placeholder <option>.
  await expect
    .poll(async () => select.locator("option").count(), { timeout: 15000 })
    .toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
}

test("admin creates an invoice end-to-end", async ({ page }) => {
  const subject = `E2E Invoice ${Date.now()}`;

  await page.goto("/admin-dashboard/create-invoice");

  // --- Step 1: invoice info (default 'unassigned' context = no customer needed) ---
  await page.getByPlaceholder("Infrastructure invoice - Q1 2025").fill(subject);
  await page.getByPlaceholder("billing@client.com").fill("e2e-invoice@example.com");
  await page.getByPlaceholder("Client Company Name").fill("E2E Test Corp");
  await pickFirstReal(selectWithOption(page, "Select country"));
  await page.getByRole("button", { name: /continue to add items/i }).click();

  // --- Step 2: add one compute line item ---
  await pickFirstReal(selectWithOption(page, "Select a region"));
  await pickFirstReal(selectWithOption(page, "Select availability zone"));
  await pickFirstReal(selectWithOption(page, "Select compute instance"));
  await pickFirstReal(selectWithOption(page, "Select OS image"));
  await page.getByRole("spinbutton").nth(0).fill("1"); // Term (Months)
  await page.getByRole("spinbutton").nth(1).fill("1"); // Number of Instances
  await pickFirstReal(selectWithOption(page, "Select volume type"));
  await page.getByPlaceholder("100").fill("100"); // Storage Size (GB)
  await page.getByRole("button", { name: /add to invoice/i }).click();
  await page.getByRole("button", { name: /continue to review/i }).click();

  // --- Step 3: generate the invoice ---
  await page.getByRole("button", { name: /generate invoice/i }).click();

  // --- Step 4: confirmation screen proves the invoice was created ---
  await expect(
    page
      .getByText(/invoice generated successfully|invoice created successfully/i)
      .first(),
  ).toBeVisible({ timeout: 25000 });
});
