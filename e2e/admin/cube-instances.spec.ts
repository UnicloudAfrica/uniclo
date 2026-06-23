import { test, expect } from "@playwright/test";

// Stable identifiers seeded by E2eSeeder (active + suspended cube instances).
const ACTIVE = "E2EACT";
const SUSPENDED = "E2ESUS";

const connectButton = (page: import("@playwright/test").Page) =>
  page.getByRole("button", { name: /connect/i });

test.describe("admin · cube-instances journey", () => {
  test("instances list renders for an authenticated admin", async ({ page }) => {
    await page.goto("/admin-dashboard/cube-instances");

    await expect(page).toHaveURL(/cube-instances/);
    await expect(page).not.toHaveURL(/\/(sign-in|verify-mail)/); // not bounced to login
    // Authenticated admin shell rendered (account control + Instances nav visible).
    await expect(
      page.getByRole("button", { name: /e2e-admin@unicloud\.africa/i }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Instances", exact: true })).toBeVisible();
  });

  test("active instance: details open and Connect (SSH) is enabled", async ({ page }) => {
    await page.goto(`/admin-dashboard/cube-instances/details?identifier=${ACTIVE}`);

    await expect(page).toHaveURL(/cube-instances\/details/);
    // Hero action toolbar rendered → details loaded from seeded data.
    await expect(connectButton(page)).toBeVisible();
    // Active instance → Connect/SSH is allowed.
    await expect(connectButton(page)).toBeEnabled();
  });

  test("suspended instance: status shown and Connect is disabled", async ({ page }) => {
    await page.goto(`/admin-dashboard/cube-instances/details?identifier=${SUSPENDED}`);

    await expect(page).toHaveURL(/cube-instances\/details/);
    await expect(connectButton(page)).toBeVisible();
    // Not active → console is gated off (the fix).
    await expect(connectButton(page)).toBeDisabled();
    // Status mapped correctly to "Suspended" (not trapped in "error").
    await expect(page.getByText(/suspended/i).first()).toBeVisible();
  });
});
