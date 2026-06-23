import { test, expect, type Locator } from "@playwright/test";

/**
 * DEEP journey: a tenant creates an end-customer ("client") through the real
 * form, including the **business KYC** step. With the Mono test fixture now OFF,
 * "Verify Business" makes a REAL Mono CAC lookup against the sandbox — so we use
 * Mono's recognized sandbox value (RC 0000000 = company "Neem"). Going live needs
 * only a credential swap (MONO_SECRET_KEY test -> live).
 */
async function pickFirst(select: Locator) {
  await expect(select).toBeEnabled({ timeout: 15000 });
  await expect
    .poll(async () => select.locator("option").count(), { timeout: 15000 })
    .toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
}

test("tenant creates a client with real Mono KYC verification", async ({ page }) => {
  test.setTimeout(120000);
  const email = `e2e-kyc-client-${Date.now()}@example.com`;

  await page.goto("/dashboard/clients/new");

  // --- Account contact ---
  await page.locator("#first_name").fill("E2E");
  await page.locator("#last_name").fill("KycClient");
  await page.locator("#email").fill(email);
  await page.locator("#phone").fill("+2348012345678"); // digits + leading +
  // --- Credentials ---
  await page.locator("#password").fill("Str0ng!Passw0rd9");
  await page.locator("#password_confirmation").fill("Str0ng!Passw0rd9");
  // --- Location (country -> state -> city cascade) ---
  await pickFirst(page.locator("#country_id"));
  await pickFirst(page.locator("#state_id"));
  const cityId = page.locator("#city_id");
  if (await cityId.count()) {
    await pickFirst(cityId).catch(() => {});
  } else {
    await page.locator("#city").fill("Lagos").catch(() => {});
  }
  await page.locator("#address").fill("1 Test Street");
  await page.locator("#zip_code").fill("100001");
  // --- Business details: Mono's recognized sandbox company (RC 0000000 = "Neem") ---
  await page.locator("#business_name").fill("Neem");
  await page.locator("#registration_number").fill("0000000");
  const companyType = page.locator("#company_type");
  if (await companyType.count()) await pickFirst(companyType).catch(() => {});
  const industry = page.locator("#industry");
  if (await industry.count()) await pickFirst(industry).catch(() => {});

  // --- Verify Business: REAL Mono CAC call (fixture off). WAIT for it to COMPLETE. ---
  const verifyDone = page.waitForResponse(
    (r) => r.url().includes("business-verifications") && r.request().method() === "POST",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: /verify business/i }).click();
  const verifyResp = await verifyDone;
  console.log("VERIFY_STATUS", verifyResp.status()); // diagnostic: real Mono verify result
  await page.waitForTimeout(2500); // let the FE store the verification token

  // --- Submit -> client created (server requires the verification token) ---
  const submitDone = page.waitForResponse(
    (r) => r.url().includes("/admin/clients") && r.request().method() === "POST",
    { timeout: 25000 },
  );
  await page.getByRole("button", { name: /^add client/i }).click();
  const submitResp = await submitDone;
  console.log("SUBMIT_STATUS", submitResp.status());
  console.log("SUBMIT_BODY", (await submitResp.text()).slice(0, 500));
  await expect(
    page.getByText(/added successfully|client added|created successfully/i).first(),
  ).toBeVisible({ timeout: 25000 });
});
