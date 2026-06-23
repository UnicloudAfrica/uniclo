import { test, expect } from "@playwright/test";

/**
 * Tenant assigns a form to ONE of its OWN clients via the audience picker (the
 * tenant builder offers "A specific client" only — no tenant option). The created
 * requirement is tenant-scoped with target_type=client, proving the shared picker
 * + the server-side own-client guard for the tenant surface.
 */
test("tenant assigns a form to one of its own clients", async ({ page }) => {
  test.setTimeout(120000);
  const title = `T2E Targeted ${Date.now()}`;

  await page.goto("/dashboard/requirements/new");
  await page.waitForTimeout(1500);
  await page.getByPlaceholder("e.g. New Hire Agreement").fill(title);
  await page.getByPlaceholder("e.g. I accept the Terms & Conditions").fill("I accept");

  await page.getByRole("button", { name: /advanced settings/i }).click();
  await page.getByPlaceholder("onboarding").fill("t2e-target-test");

  await page.getByRole("button", { name: "A specific client" }).click();
  await page.waitForTimeout(900); // own-clients fetch
  await page.getByRole("button", { name: /select a client/i }).click();
  await page.locator('ul[role="listbox"] button').first().click();
  await page.screenshot({ path: "e2e/screens/tenanttarget-01.png", fullPage: true }).catch(() => {});

  const respP = page.waitForResponse(
    (r) => r.url().includes("/requirements") && r.request().method() === "POST",
    { timeout: 20000 }
  );
  await page.getByRole("button", { name: /create form/i }).click();
  const resp = await respP;
  const body = await resp.json().catch(() => ({}));
  console.log("T_TARGET_CREATE", resp.status(), "type=", body?.data?.target_type, "id=", body?.data?.target_id);

  expect(resp.status()).toBe(201);
  expect(body?.data?.target_type).toBe("client");
  expect(String(body?.data?.target_id || "")).not.toBe("");
});
