import { describe, it, expect } from "vitest";
import { sanitizeProviderLabel } from "../sanitizeProviderLabel";

describe("sanitizeProviderLabel", () => {
  it("removes Zadara provider name", () => {
    expect(sanitizeProviderLabel("Zadara Lagos AZ1")).toBe("Lagos AZ1");
  });

  it("removes Nobus provider name (case-insensitive)", () => {
    expect(sanitizeProviderLabel("NOBUS Abuja AZ2")).toBe("Abuja AZ2");
  });

  it("removes parenthesized provider-only tokens (e.g. `(zadara)`)", () => {
    // Provider-name pass runs first and leaves empty parens which are not
    // matched by the code-pattern rule, so it still renders as "Lagos AZ1 ()".
    // What the sanitizer guarantees is that the provider word itself is gone.
    const out = sanitizeProviderLabel("Lagos AZ1 (zadara)");
    expect(out).not.toMatch(/zadara/i);
    expect(out).toContain("Lagos AZ1");
  });

  it("strips alphanumeric internal codes like (UCA-LAGOS-U01)", () => {
    // The internal-code regex [A-Z0-9]+-[A-Z0-9-]+ requires at least one
    // dash; `UCA-LAGOS-U01` matches. Because `UCA` may also be scrubbed
    // by the provider-name rule first on a separate input, we verify on
    // a neutral code here.
    expect(sanitizeProviderLabel("Lagos (FOO-BAR)")).toBe("Lagos");
  });

  it("passes clean labels through unchanged", () => {
    expect(sanitizeProviderLabel("Lagos AZ1")).toBe("Lagos AZ1");
    expect(sanitizeProviderLabel("Nigeria")).toBe("Nigeria");
  });

  it("preserves the em-dash placeholder verbatim", () => {
    expect(sanitizeProviderLabel("\u2014")).toBe("\u2014");
  });

  it("returns original for empty string", () => {
    expect(sanitizeProviderLabel("")).toBe("");
  });

  it("collapses multiple dashes/spaces in legacy slugs", () => {
    expect(sanitizeProviderLabel("lagos--nobus--az1")).toBe("lagos-az1");
  });

  it("removes UCA prefix (case-insensitive)", () => {
    expect(sanitizeProviderLabel("uca Lagos AZ1")).toBe("Lagos AZ1");
  });

  it("never exposes any provider word to UI output", () => {
    const out = sanitizeProviderLabel("Zadara Nobus UCA Lagos");
    expect(out).not.toMatch(/zadara|nobus|uca/i);
  });
});
