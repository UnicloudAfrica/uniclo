/**
 * SEC-032 regression tests: ensure the path-traversal guard in
 * ObjectStorageFileBrowser's navigateToFolder rejects any prefix containing
 * "..". We duplicate the logic here as a pure function so we can verify
 * behavior without mounting the full component.
 */
import { describe, it, expect } from "vitest";

// Mirrors the guard in ObjectStorageFileBrowser.tsx (navigateToFolder)
const isSafePrefix = (prefix: string): boolean => !prefix.includes("..");

describe("ObjectStorageFileBrowser path traversal guard (SEC-032)", () => {
  it("accepts normal folder prefixes", () => {
    expect(isSafePrefix("foo/")).toBe(true);
    expect(isSafePrefix("foo/bar/baz/")).toBe(true);
    expect(isSafePrefix("")).toBe(true);
  });

  it("rejects literal parent-directory references", () => {
    expect(isSafePrefix("../")).toBe(false);
    expect(isSafePrefix("foo/../")).toBe(false);
    expect(isSafePrefix("/../etc/passwd")).toBe(false);
  });

  it("rejects any substring containing `..`", () => {
    expect(isSafePrefix("a..b/")).toBe(false);
    expect(isSafePrefix("safe/../secret/")).toBe(false);
  });
});
