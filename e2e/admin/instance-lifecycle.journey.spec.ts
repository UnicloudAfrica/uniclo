import { test, expect } from "@playwright/test";

/**
 * DEEP journey for the admin instance details page (the feature this session
 * centered on). Not a page-load smoke — it verifies the page shows the instance's
 * REAL seeded data, that Connect opens the SSH console surface, and that Destroy
 * actually changes the instance's state to terminated.
 */
const ACTIVE = "E2EACT"; // seeded active instance (name/IP/status below)
const DELETE_ME = "E2EDEL"; // seeded disposable instance, reset to active each run

const detailsUrl = (id: string) =>
  `/admin-dashboard/cube-instances/details?identifier=${id}`;

test.describe("admin · instance lifecycle (deep)", () => {
  test("details render the instance's real data", async ({ page }) => {
    await page.goto(detailsUrl(ACTIVE));

    await expect(page.getByText("E2E Active Instance").first()).toBeVisible();
    await expect(page.getByText("10.0.0.10").first()).toBeVisible(); // seeded primary IP
    await expect(page.getByText(/^active$/i).first()).toBeVisible(); // status label
  });

  test("Connect opens the SSH console terminal surface", async ({ page }) => {
    await page.goto(detailsUrl(ACTIVE));

    await page.getByRole("button", { name: /^connect$/i }).first().click();
    // The embedded SSH console mounts and begins a session (it can't reach the
    // fake host, but the terminal surface + session attempt prove the wiring).
    await expect(
      page
        .getByText(/console -|requesting session|opening secure channel|connecting/i)
        .first(),
    ).toBeVisible({ timeout: 15000 });
  });

  test("Destroy changes the instance state to terminated", async ({ page }) => {
    page.on("dialog", (d) => d.accept()); // destroy uses a native confirm()

    await page.goto(detailsUrl(DELETE_ME));
    await page.getByRole("button", { name: /^more$/i }).first().click();
    const destroyItem = page.getByRole("menuitem", { name: /destroy/i });
    if (await destroyItem.count()) {
      await destroyItem.click();
    } else {
      await page.getByRole("button", { name: /destroy/i }).first().click();
    }

    // Re-open details; the instance is no longer active — state moved to terminated.
    await page.waitForTimeout(2000);
    await page.goto(detailsUrl(DELETE_ME));
    await expect(page.getByText(/terminated|deleted/i).first()).toBeVisible({
      timeout: 15000,
    });
  });
});
