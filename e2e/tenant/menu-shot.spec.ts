import { test } from "@playwright/test";
import path from "path";

// Quick visual capture of the tenant sidebar after flattening the redundant
// "Overview → Home" group into a top-level "Home" item.
test("tenant sidebar snapshot", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(__dirname, "..", "screens", "menu-tenant.png") });
});
