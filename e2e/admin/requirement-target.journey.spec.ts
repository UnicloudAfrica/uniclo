import { test, expect } from "@playwright/test";

/**
 * Admin assigns a form to ONE specific client via the audience picker, and the
 * created requirement carries target_type=client + a target_id — proving
 * per-individual targeting end-to-end (builder → API).
 */
test("admin assigns a form to one specific client", async ({ page }) => {
  test.setTimeout(120000);
  const title = `E2E Targeted ${Date.now()}`;

  await page.goto("/admin-dashboard/requirements/new");
  await page.waitForTimeout(1500);
  await page.getByPlaceholder("e.g. New Hire Agreement").fill(title);
  await page.getByPlaceholder("e.g. I accept the Terms & Conditions").fill("I accept");

  // Test-specific placement so this doesn't gate the shared `onboarding`.
  await page.getByRole("button", { name: /advanced settings/i }).click();
  await page.getByPlaceholder("onboarding").fill("e2e-target-test");

  // Audience → a specific client → pick the first one from the searchable picker.
  await page.getByRole("button", { name: "A specific client" }).click();
  await page.waitForTimeout(900); // options fetch
  await page.getByRole("button", { name: /select a client/i }).click();
  await page.locator('ul[role="listbox"] button').first().click();
  await page.screenshot({ path: "e2e/screens/admintarget-01.png", fullPage: true }).catch(() => {});

  const respP = page.waitForResponse(
    (r) => r.url().includes("/requirements") && r.request().method() === "POST",
    { timeout: 20000 }
  );
  await page.getByRole("button", { name: /create form/i }).click();
  const resp = await respP;
  const body = await resp.json().catch(() => ({}));
  console.log("TARGET_CREATE", resp.status(), "type=", body?.data?.target_type, "id=", body?.data?.target_id);

  expect(resp.status()).toBe(201);
  expect(body?.data?.target_type).toBe("client");
  expect(String(body?.data?.target_id || "")).not.toBe("");
});
