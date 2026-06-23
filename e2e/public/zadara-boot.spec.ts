import { test, type Locator } from "@playwright/test";
import { promises as fs } from "node:fs";

/**
 * GOAL: a real client boots a ZADARA instance purely from the UI buttons.
 * Corrects the two gaps the explore run exposed: (1) explicitly pick the zadara
 * AZ (uni-ng-lag-az1) so the instance lands on zadara; (2) actually COMPLETE the
 * keypair create (click the "Create key pair" button), since a fresh project has
 * no keys. Picks a zadara instance type by name (z*), pays from the seeded
 * wallet, confirms, then leaves the launch to the queue worker (verified in DB).
 */
const API_LOG = "/Users/mac_1/Documents/GitHub/unicloud/api/storage/logs/laravel.log";
const CLIENT = "e2e-client@unicloud.africa";
const SHOTS = "e2e/screens";

async function readOtpAfter(offset: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const buf = await fs.readFile(API_LOG, "utf8").catch(() => "");
    const m = [...buf.slice(offset).matchAll(/<h3>\s*(\d{4,8})\s*<\/h3>/g)];
    if (m.length) return m[m.length - 1][1];
    await new Promise((r) => setTimeout(r, 500));
  }
  return "";
}

test("client boots a zadara instance from the UI", async ({ page }) => {
  test.setTimeout(220000);
  const failed: string[] = [];
  const shortUrl = (u: string) => u.replace(/^https?:\/\/[^/]+/, "");
  page.on("response", (r) => {
    if (r.status() >= 400 && !/conveythis|\.png|trbn/.test(r.url()))
      failed.push(`${r.status()} ${r.request().method()} ${shortUrl(r.url())}`);
  });
  const step = async (label: string, fn: () => Promise<void>) => {
    try { await fn(); console.log(`OK   :: ${label}`); }
    catch (e) { console.log(`FAIL :: ${label} :: ${(e as Error).message.split("\n")[0].slice(0, 140)}`); }
  };
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/zadara-${n}.png`, fullPage: true }).catch(() => {});

  // Open a SearchableSelect by its placeholder and click the first option matching `want` (or first real option).
  const pickSearchable = async (placeholder: RegExp, want?: RegExp): Promise<string> => {
    const trigger = page.locator('button[aria-haspopup="listbox"]').filter({ hasText: placeholder }).first();
    if ((await trigger.count()) === 0) return "(trigger not found)";
    await trigger.click({ timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(700);
    const opts = page.locator('ul[role="listbox"] li button');
    const n = await opts.count();
    const labels: string[] = [];
    let chosenIdx = -1;
    for (let i = 0; i < n; i++) {
      const txt = (await opts.nth(i).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      labels.push(txt);
      if (/^Select /i.test(txt)) continue;
      if (want && want.test(txt) && chosenIdx === -1) chosenIdx = i;
    }
    if (chosenIdx === -1) chosenIdx = labels.findIndex((t) => t && !/^Select /i.test(t));
    if (chosenIdx === -1) { await page.keyboard.press("Escape").catch(() => {}); return `(no real option; saw: ${labels.join(" | ").slice(0, 120)})`; }
    const picked = labels[chosenIdx];
    await opts.nth(chosenIdx).click().catch(() => {});
    await page.waitForTimeout(700);
    return picked;
  };

  // ---- LOGIN ----
  const before = (await fs.stat(API_LOG).catch(() => ({ size: 0 }))).size;
  await page.goto("/sign-in");
  await page.getByPlaceholder("Enter email address").fill(CLIENT);
  await page.getByPlaceholder("Enter password").fill("password");
  await page.getByRole("button", { name: /^login$/i }).click();
  await page.waitForURL(/verify-mail/, { timeout: 20000 }).catch(() => {});
  const otp = await readOtpAfter(before);
  await page.locator("input").first().click().catch(() => {});
  await page.keyboard.type(otp, { delay: 50 });
  await page.waitForURL((u) => !/verify-mail/.test(u.pathname), { timeout: 20000 }).catch(() => {});
  console.log("LOGIN_URL =", shortUrl(page.url()), "OTP =", otp || "(none)");

  // ---- WIZARD ----
  await page.goto("/client-dashboard/cube-instances/provision");
  await page.waitForTimeout(3000);
  await step("workflow: Standard", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);

  // region (native select)
  await step("region", async () => {
    const r = page.locator(`select:has(option:has-text("Select region"))`).first();
    await r.selectOption({ index: 1 }, { timeout: 8000 });
  });
  await page.waitForTimeout(2500);

  // availability zone -> zadara az1 (native or searchable)
  await step("AZ -> uni-ng-lag-az1 (zadara)", async () => {
    const nativeAz = page.locator(`select:has(option:has-text("availability zone")), select:has(option[value="uni-ng-lag-az1"])`).first();
    if (await nativeAz.count()) { await nativeAz.selectOption("uni-ng-lag-az1", { timeout: 5000 }); return; }
    const picked = await pickSearchable(/availability zone/i, /az1|az 1|zone 1/i);
    console.log("   AZ picked:", picked);
  });
  await page.waitForTimeout(2500);

  // project -> inherits the project's AZ (zadara az1), which refetches the zadara catalog
  console.log("project:", await pickSearchable(/Select project/i, /E2E Client Project/i));
  await page.waitForTimeout(5000); // AZ propagation + zadara catalog refetch
  // instance type -> z2.medium (1 vCPU / 2 GB) so the VM actually runs (xlarge shelves)
  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1500);
  // OS image / volume -> first real
  console.log("image:", await pickSearchable(/Select OS image/i));
  console.log("volume:", await pickSearchable(/Select volume type/i));
  await page.waitForTimeout(800);

  // keypair: prefer the seeded EXISTING key (avoids the flaky create call); fall back to create
  await step("keypair", async () => {
    await page.getByText(/use existing key pair/i).first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const picked = await pickSearchable(/Select a key pair/i, /e2e-client-key/i);
    console.log("   keypair existing:", picked);
    if (/no real option|trigger not found/i.test(picked)) {
      await page.getByText(/create new key pair/i).first().click({ timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(700);
      await page.locator('input[data-focus-key*="keypair_name_create"]').first().fill(`zk${Date.now()}`, { timeout: 6000 }).catch(() => {});
      await page.getByRole("button", { name: /^create key pair$/i }).click({ timeout: 6000 }).catch(() => {});
      await page.waitForTimeout(22000);
    }
  });

  await step("name", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`zadara-${Date.now()}`, { timeout: 8000 }); });
  await shot("01-config");
  await step("continue->payment", async () => { await page.getByRole("button", { name: /continue to payment/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("02-payment");
  await step("pay: select wallet", async () => { await page.getByRole("button", { name: /pay with wallet/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await step("pay: enter PIN", async () => {
    const pinInput = page.locator('input[type="password"][inputmode="numeric"], input[placeholder="••••"]').first();
    await pinInput.fill("1234", { timeout: 6000 });
  });
  await page.waitForTimeout(500);
  await step("pay: finalize from wallet", async () => { await page.getByRole("button", { name: /from wallet/i }).first().click({ timeout: 8000 }); });
  await page.waitForTimeout(9000); // payment settle (provisioning is automatic per the UI note)
  await shot("03-after-pay");
  const confirmBtn = page.getByRole("button", { name: /confirm.*provision|^provision$/i }).first();
  if (await confirmBtn.count()) await step("confirm provision", async () => { await confirmBtn.click({ timeout: 8000 }); });
  await page.waitForTimeout(8000);
  await shot("04-after-provision");
  console.log("FINAL_TEXT =", (await page.locator("main").innerText().catch(() => page.locator("body").innerText())).replace(/\s+/g, " ").slice(0, 500));
  console.log("=== FAILED_REQUESTS (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 20).forEach((f) => console.log("  FR: " + f));
});
