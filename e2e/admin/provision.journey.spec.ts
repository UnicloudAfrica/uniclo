import { test } from "@playwright/test";

/**
 * Item 1 — verify an ADMIN can provision an instance through the UI.
 * Runs in the `admin` project (admin storageState). Walks AdminCreateInstance at
 * /admin-dashboard/create-instance — the shared instance wizard under the
 * /admin/v1 context. Stops at the payment/review step (no real VM). Instrumented
 * so one run reveals the admin entry: an admin provisions on behalf of a tenant
 * or client, so the customer context must be selected.
 */
const SHOTS = "e2e/screens";

test("admin configures an instance through the provisioning wizard", async ({ page }) => {
  test.setTimeout(180000);
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
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/admin-prov-${n}.png`, fullPage: true }).catch(() => {});

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

  // ---- WIZARD ----
  await page.goto("/admin-dashboard/create-instance");
  await page.waitForTimeout(3000);
  await shot("01-workflow");

  await step("workflow: Standard", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await page.waitForTimeout(800);
  // Admin provisions on behalf of a tenant or client — try both context pickers.
  console.log("ctx-tenant:", await pickSearchable(/select (a )?(tenant|customer)/i, /E2E Tenant/i));
  console.log("ctx-client:", await pickSearchable(/select (a )?(client|user)/i, /E2E Client/i));
  await page.waitForTimeout(500);
  await shot("02-context");
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);

  // region (native select)
  await step("region", async () => {
    const r = page.locator(`select:has(option:has-text("Select region"))`).first();
    await r.selectOption({ index: 1 }, { timeout: 8000 });
  });
  await page.waitForTimeout(2500);

  // availability zone -> zadara az1
  await step("AZ -> uni-ng-lag-az1 (zadara)", async () => {
    const nativeAz = page.locator(`select:has(option:has-text("availability zone")), select:has(option[value="uni-ng-lag-az1"])`).first();
    if (await nativeAz.count()) { await nativeAz.selectOption("uni-ng-lag-az1", { timeout: 5000 }); return; }
    const picked = await pickSearchable(/availability zone/i, /az1|az 1|zone 1/i);
    console.log("   AZ picked:", picked);
  });
  await page.waitForTimeout(2500);

  console.log("project:", await pickSearchable(/Select project/i));
  await page.waitForTimeout(5000);
  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1500);
  console.log("image:", await pickSearchable(/Select OS image/i));
  console.log("volume:", await pickSearchable(/Select volume type/i));
  await page.waitForTimeout(800);

  await step("name", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`admin-${Date.now()}`, { timeout: 8000 }); });
  await shot("03-configured");

  await step("continue->payment", async () => { await page.getByRole("button", { name: /continue to (payment|review)/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("04-payment");

  console.log("FINAL_TEXT =", (await page.locator("main").innerText().catch(() => page.locator("body").innerText())).replace(/\s+/g, " ").slice(0, 600));
  console.log("=== FAILED_REQUESTS (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 20).forEach((f) => console.log("  FR: " + f));
});
