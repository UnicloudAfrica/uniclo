import { test } from "@playwright/test";

/**
 * Item 1 — verify a TENANT can provision an instance through the UI.
 * Runs in the `tenant` project (tenant storageState). Walks the shared instance
 * wizard at /dashboard/create-instance (WorkflowSelection -> Configuration ->
 * Payment). It renders the SAME AdminInstanceConfigurationCard the proven client
 * path uses, so this confirms the tenant context routing (/tenant/v1) serves the
 * catalog + pricing. Stops at the payment step — no real VM is booted.
 *
 * Instrumented (per-step OK/FAIL + screenshots) so a single run reveals where the
 * tenant entry (workflow + customer context) differs from the client wizard.
 */
const SHOTS = "e2e/screens";

test("tenant configures an instance through the provisioning wizard", async ({ page }) => {
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
  const shot = (n: string) => page.screenshot({ path: `${SHOTS}/tenant-prov-${n}.png`, fullPage: true }).catch(() => {});

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

  // ---- WIZARD ----
  await page.goto("/dashboard/create-instance");
  await page.waitForTimeout(3000);
  await shot("01-workflow");

  await step("workflow: Standard", async () => { await page.getByText("Standard Workflow").first().click({ timeout: 8000 }); });
  await page.waitForTimeout(800);
  // Customer context: a tenant provisions for itself (default) or a client. If a
  // context picker requires a customer, pick the seeded E2E Client; else proceed.
  console.log("context:", await pickSearchable(/select (a )?(client|customer|user)/i, /E2E Client/i));
  await page.waitForTimeout(500);
  await step("continue->config", async () => { await page.getByRole("button", { name: /continue to configuration/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(1500);
  await shot("02-config-top");

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

  // project: first real option (tenant may have none -> reported as "no real option")
  console.log("project:", await pickSearchable(/Select project/i));
  await page.waitForTimeout(5000); // AZ propagation + catalog refetch
  console.log("type:", await pickSearchable(/Select instance type/i, /z2\.medium/i));
  await page.waitForTimeout(1500);
  console.log("image:", await pickSearchable(/Select OS image/i));
  console.log("volume:", await pickSearchable(/Select volume type/i));
  await page.waitForTimeout(800);

  await step("name", async () => { await page.getByPlaceholder("Enter cube-instance name").first().fill(`tenant-${Date.now()}`, { timeout: 8000 }); });
  await shot("03-configured");

  // Verification goal: reach an orderable, priced state (the payment step).
  await step("continue->payment", async () => { await page.getByRole("button", { name: /continue to (payment|review)/i }).click({ timeout: 8000 }); });
  await page.waitForTimeout(2500);
  await shot("04-payment");

  console.log("FINAL_TEXT =", (await page.locator("main").innerText().catch(() => page.locator("body").innerText())).replace(/\s+/g, " ").slice(0, 600));
  console.log("=== FAILED_REQUESTS (" + failed.length + ") ===");
  [...new Set(failed)].slice(0, 20).forEach((f) => console.log("  FR: " + f));
});
