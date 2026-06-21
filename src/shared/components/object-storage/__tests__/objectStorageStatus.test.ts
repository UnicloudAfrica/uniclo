import { describe, it, expect } from "vitest";
import { resolveObjectStorageReadiness } from "../objectStorageStatus";

describe("resolveObjectStorageReadiness", () => {
  it("is ready when the resource exposes a default_access_key", () => {
    expect(
      resolveObjectStorageReadiness({ status: "active", default_access_key: { id: 1 } }),
    ).toEqual({ ready: true, failed: false });
  });

  it("is ready when status is active", () => {
    expect(resolveObjectStorageReadiness({ status: "active" }).ready).toBe(true);
  });

  it("is not ready and not failed while provisioning", () => {
    expect(resolveObjectStorageReadiness({ status: "provisioning" })).toEqual({
      ready: false,
      failed: false,
    });
  });

  it("is failed for provision_failed", () => {
    expect(resolveObjectStorageReadiness({ status: "provision_failed" })).toEqual({
      ready: false,
      failed: true,
    });
  });

  it("honours a legacy access_keys array", () => {
    expect(resolveObjectStorageReadiness({ access_keys: [{ id: 1 }] }).ready).toBe(true);
  });

  it("handles a null account", () => {
    expect(resolveObjectStorageReadiness(null)).toEqual({ ready: false, failed: false });
  });
});
