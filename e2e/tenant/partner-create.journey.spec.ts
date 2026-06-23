import { test, expect, type Locator, type Page } from "@playwright/test";
import path from "path";

/**
 * DEEP journey + visual capture: a tenant creates a sub-tenant ("partner")
 * through the 4-step wizard (Account -> Business+Verify -> Address -> Uploads).
 * Screenshots every step into e2e/screens/ and logs the verify + submit statuses
 * so blockers are visible. Uses Mono's sandbox company (RC 0000000 = "Neem").
 */
const SHOTS = path.join(__dirname, "..", "screens");

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SHOTS, `partner-${name}.png`) }).catch(() => {});
}
async function pickFirst(select: Locator) {
  await expect(select).toBeEnabled({ timeout: 6000 });
  await expect.poll(async () => select.locator("option").count(), { timeout: 6000 }).toBeGreaterThan(1);
  await select.selectOption({ index: 1 });
}
const file = (name: string) => ({
  name,
  mimeType: name.endsWith(".pdf") ? "application/pdf" : "image/png",
  buffer: Buffer.from("E2E dummy document"),
});

test("tenant creates a sub-tenant (partner) end-to-end", async ({ page }) => {
  test.setTimeout(180000);
  const email = `e2e-partner-${Date.now()}@example.com`;

  await page.goto("/dashboard/partners/new");
  await page.waitForTimeout(1800);
  await shot(page, "01-account");

  // Step 1 — account
  await page.locator("#first_name").fill("E2E").catch(() => {});
  await page.locator("#last_name").fill("Partner").catch(() => {});
  await page.locator("#email").fill(email).catch(() => {});
  await page.locator("#password").fill("Str0ng!Passw0rd9").catch(() => {});
  await page.locator("#confirm-password").fill("Str0ng!Passw0rd9").catch(() => {});
  await page.locator("#domain").fill(`e2ep${Date.now()}`).catch(() => {}); // required, alphanumeric
  await page.locator("#status").selectOption("verified").catch(() => {}); // required Status select
  await page.getByRole("button", { name: /continue/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "02-business");

  // Step 2 — business info + verify (real Mono, RC 0000000 = "Neem")
  // Verification Type* is required and renders unselected — pick CAC_BASIC before verifying.
  await page.getByRole("combobox", { name: /verification type/i }).selectOption("CAC_BASIC").catch(() => {});
  await pickFirst(page.locator("#business_structure")).catch(() => {});
  await page.locator("#business_name").fill(`Neem E2E ${Date.now()}`).catch(() => {}); // unique tenant name (tenants.name is UNIQUE)
  await pickFirst(page.locator("#company_type")).catch(() => {});
  await pickFirst(page.locator("#industry")).catch(() => {});
  await page.locator("#registration_number").fill("0000000").catch(() => {});
  await page.getByPlaceholder(/business email/i).fill("partner-biz@example.com").catch(() => {}); // required
  await page.getByPlaceholder(/business phone/i).fill("+2348012345678").catch(() => {}); // required → enables Verify
  const verifyDone = page
    .waitForResponse((r) => r.url().includes("business-verifications") && r.request().method() === "POST", { timeout: 30000 })
    .catch(() => null);
  await page.getByRole("button", { name: /verify business/i }).first().click().catch(() => {});
  const vr = await verifyDone;
  if (vr) console.log("PARTNER_VERIFY_STATUS", vr.status());
  await page.waitForTimeout(2200);
  await shot(page, "03-verified");
  await page.getByRole("button", { name: /continue/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "04-address");

  // Step 3 — address
  await page.locator("#business_address").fill("1 Test Street").catch(() => {});
  await page.locator("#zip_code").fill("100001").catch(() => {});
  await pickFirst(page.locator("#country")).catch(() => {});
  await page.locator("#state").fill("Lagos").catch(() => {}); // State/Region is a free-text field, not a select
  await page.locator("#city").fill("Lagos").catch(() => {});
  await page.getByRole("button", { name: /continue/i }).click().catch(() => {});
  await page.waitForTimeout(1500);
  await shot(page, "05-uploads");

  // Step 4 — required document uploads
  await page.locator("#registration_document").setInputFiles(file("registration.pdf")).catch(() => {});
  await page.locator("#utility_bill_document").setInputFiles(file("utility.pdf")).catch(() => {});
  await page.locator("#tinCertificate").setInputFiles(file("tin.pdf")).catch(() => {});
  await page.locator("#nationalIdDocument").setInputFiles(file("national-id.pdf")).catch(() => {});
  await page.locator("#businessLogo").setInputFiles(file("logo.png")).catch(() => {});
  await page.waitForTimeout(1200);
  await shot(page, "06-ready");

  // Submit — wait for ANY partners POST (endpoint differs by context) and assert success.
  const submitDone = page
    .waitForResponse((r) => /partners/i.test(r.url()) && r.request().method() === "POST", { timeout: 30000 })
    .catch(() => null);
  await page.getByRole("button", { name: /create partner/i }).click().catch(() => {});
  const sr = await submitDone;
  if (sr) {
    console.log("PARTNER_SUBMIT_STATUS", sr.status());
    console.log("PARTNER_SUBMIT_BODY", (await sr.text().catch(() => "")).slice(0, 450));
  }
  await shot(page, "07-result");
  // Real gate: a created partner shows the success toast and closes the wizard.
  await expect(page.getByText(/partner workspace created/i)).toBeVisible({ timeout: 30000 });
});
