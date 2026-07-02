import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Producer↔consumer contract guard for the AnyCloudFlow replication + the
 * per-instance backup actions on the admin instance-details Protection tab.
 *
 * The full page is too heavy to mount in jsdom (recharts + provisioning poll),
 * so this locks the BE-parity invariants at the source level. They are pure
 * string-literal contracts the router/validator enforce, so a static assertion
 * catches a regression character-for-character — which is what the repo's
 * field-name-parity checklist requires.
 *
 * Two DISTINCT backup/replication contracts live on this tab (the two paths
 * were split so instance backup runs on the stateful protection subsystem):
 *
 *  1. Generic AnyCloudFlow integration path — used ONLY for DR replication
 *     (enable / disable / failover) + the replication-status hook.
 *     Consumer: IntegrationReplicationController / IntegrationBackupController
 *     ::resolveResource(), which maps ONLY the PLURAL "instances" segment to
 *     Instance::class (api/…/Integration/IntegrationBackupController.php).
 *     The old singular "instance" fell through to `default => null` → 404.
 *
 *  2. Dedicated per-instance backup path — enable / trigger / update / disable
 *     go through the instanceHooks mutations, which POST to
 *     /cube-instance/{identifier}/protection/backup* handled by
 *     InstanceProtectionController::enable(). That validator wants
 *     `frequency` in:daily,weekly,monthly (api/…/InstanceProtectionController
 *     .php) — NOT the generic-ACF `schedule_type`, which it would silently
 *     drop. So the enable-backup config sent from this page must carry
 *     `frequency`, and must NOT regress to the ACF-only `schedule_type` key.
 */

const SOURCE = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), "../AdminInstancesDetails.tsx"),
  "utf8",
);

describe("AdminInstancesDetails — Protection action BE-parity contract", () => {
  it("never sends the singular resourceType that the ACF route cannot resolve", () => {
    expect(SOURCE).not.toMatch(/resourceType:\s*["']instance["']/);
    expect(SOURCE).not.toMatch(/["']anycloudflow["'],\s*["']instance["']/);
  });

  it("sends the plural resourceType at every ACF call site", () => {
    // DR replication actions (enable / disable / failover) use the object form.
    const pluralObjectForm = SOURCE.match(/resourceType:\s*["']instances["']/g) ?? [];
    // The replication-status hook uses the positional form.
    const pluralPositionalForm = SOURCE.match(/["']anycloudflow["'],\s*["']instances["']/g) ?? [];

    // Every ACF ("anycloudflow") reference is either the integrationKey of an
    // object-form action or the positional status-hook call — all must be
    // plural. Guard against a partial migration leaving any singular site.
    const anycloudflowRefs = SOURCE.match(/["']anycloudflow["']/g) ?? [];
    expect(anycloudflowRefs.length).toBeGreaterThan(0);
    expect(pluralObjectForm.length + pluralPositionalForm.length).toBe(
      anycloudflowRefs.length,
    );
  });

  it("builds the enable-backup config with the BE-required frequency field", () => {
    // The non-customized branch must post `frequency` (InstanceProtectionController).
    expect(SOURCE).toMatch(/frequency:\s*["']daily["']/);
    // The old generic-ACF-only `schedule_type` key must NOT reappear here.
    expect(SOURCE).not.toMatch(/config:\s*\{\s*schedule_type:/);
  });

  it("uses a frequency value within the InstanceProtectionController enum", () => {
    const match = SOURCE.match(/frequency:\s*["'](\w+)["']/);
    expect(match).not.toBeNull();
    expect(["daily", "weekly", "monthly"]).toContain(match![1]);
  });
});
