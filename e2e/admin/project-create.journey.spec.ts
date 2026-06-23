import { test, expect } from "@playwright/test";

/**
 * DEEP journey (not a page-load smoke): the admin actually fills in the real
 * Create-Project form and submits it. Proof of a real create: on success the app
 * navigates to the new project's details page and shows the name we typed — which
 * only happens if the API created the record and returned its identifier.
 */
test("admin creates a project end-to-end", async ({ page }) => {
  const name = `E2E Deep Project ${Date.now()}`;

  await page.goto("/admin-dashboard/projects/create");

  // Name
  await page.fill("#name", name);

  // Region — wait for options to load from the API, then pick the first real one.
  const region = page.locator("#region");
  await expect(region.locator("option:not([disabled])").first()).toBeAttached({
    timeout: 15000,
  });
  await region.selectOption({ index: 1 });

  // Project type radio is visually hidden — click its label.
  await page.locator('label:has(input[name="projectType"][value="vpc"])').click();

  // Availability zone appears only for some regions.
  const az = page.locator("#az");
  if (await az.isVisible().catch(() => false)) {
    await az.selectOption({ index: 1 });
  }

  // Submit the real form.
  await page.getByRole("button", { name: /create project/i }).first().click();

  // Real creation succeeded: app routed to the new project's details with our name.
  await expect(page).toHaveURL(/projects\/details/, { timeout: 20000 });
  await expect(page.getByText(name).first()).toBeVisible();
});
