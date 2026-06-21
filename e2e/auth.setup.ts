import { test as setup, expect, type Page } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";

// Playwright loads this file as CommonJS (no "type":"module" in package.json),
// so __dirname is available natively — don't use import.meta here.
// MAIL_MAILER=log writes the login OTP to the API log as "<h3> 123456 </h3>".
const API_LOG =
  process.env.E2E_API_LOG ?? path.resolve(__dirname, "../../api/storage/logs/laravel.log");

const PASSWORD = "password";

const ACCOUNTS = {
  admin: "e2e-admin@unicloud.africa",
  tenant: "e2e-tenant@unicloud.africa",
  client: "e2e-client@unicloud.africa",
} as const;

async function logSize(): Promise<number> {
  try {
    return (await fs.stat(API_LOG)).size;
  } catch {
    return 0;
  }
}

/** Poll the API log for an OTP written after `offset` bytes. */
async function readOtpAfter(offset: number): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const buf = await fs.readFile(API_LOG, "utf8");
      const fresh = buf.slice(offset);
      const matches = [...fresh.matchAll(/<h3>\s*(\d{4,8})\s*<\/h3>/g)];
      if (matches.length > 0) return matches[matches.length - 1][1];
    } catch {
      // log not present yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(
    `OTP not found in API log (${API_LOG}). Is the API running with MAIL_MAILER=log?`,
  );
}

async function authenticate(page: Page, email: string): Promise<void> {
  const before = await logSize();

  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill(email);
  await page.getByPlaceholder("Enter password").fill(PASSWORD);
  await page.getByRole("button", { name: /^login$/i }).click();

  // Password step succeeds -> OTP page.
  await page.waitForURL(/verify-mail/, { timeout: 20_000 });

  const otp = await readOtpAfter(before);

  // Six single-character boxes that auto-advance and AUTO-SUBMIT on the final
  // digit (VerificationCodeInput onComplete). Focus the first box and type.
  await page.locator("input").first().click();
  await page.keyboard.type(otp, { delay: 50 });

  // Auto-submit usually navigates us off /verify-mail. If it doesn't, click Verify.
  try {
    await page.waitForURL((url) => !/verify-mail/.test(url.pathname), { timeout: 10_000 });
  } catch {
    const verify = page.getByRole("button", { name: /verify|account/i });
    if (await verify.count()) await verify.click();
  }

  // Authenticated once we've left the auth pages (landing differs per audience).
  await expect(page, "should be authenticated (off the auth pages)").not.toHaveURL(
    /\/(sign-in|verify-mail)/,
    { timeout: 20_000 },
  );
}

for (const [role, email] of Object.entries(ACCOUNTS)) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await authenticate(page, email);
    await page.context().storageState({ path: `e2e/.auth/${role}.json` });
  });
}
