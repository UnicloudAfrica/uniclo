import { test, expect } from "@playwright/test";

test.describe("admin · cube-instances", () => {
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

  test("opening an instance shows the details page", async ({ page }) => {
    await page.goto("/admin-dashboard/cube-instances");

    const manage = page.getByRole("button", { name: /^manage$/i }).first();
    if ((await manage.count()) === 0) {
      test.skip(true, "No instances seeded to open — list-only assertion covered above");
    }

    await manage.click();
    await expect(page).toHaveURL(/cube-instances\/details/);
    // The details shell renders its tabs (Overview is the default).
    await expect(page.getByRole("button", { name: /overview/i }).first()).toBeVisible();
  });
});
