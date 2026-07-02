import { describe, it, expect } from "vitest";
import { formatMoney } from "../formatMoney";

describe("formatMoney", () => {
  it("formats NGN with the naira symbol", () => {
    // en-NG + style:currency renders NGN as ₦.
    expect(formatMoney(1234.5, "NGN")).toBe("₦1,234.50");
  });

  it("defaults to NGN when no currency is passed", () => {
    expect(formatMoney(1000)).toBe("₦1,000.00");
  });

  it("formats a non-NGN currency from the code (never a hardcoded symbol)", () => {
    const usd = formatMoney(1234.5, "USD");
    // Symbol comes from the ISO code, not a literal ₦/$ switch.
    expect(usd).not.toContain("₦");
    expect(usd).toContain("1,234.50");
    // en-NG renders USD as "US$" — assert the amount + a $ glyph are present.
    expect(usd).toContain("$");
  });

  it("lower-cases codes are normalised", () => {
    expect(formatMoney(500, "ngn")).toBe("₦500.00");
  });

  it("falls back to a code prefix for a malformed currency code", () => {
    // A non-3-letter code makes Intl throw; the catch renders "CODE amount".
    expect(formatMoney(42, "ZZ")).toBe("ZZ 42.00");
  });

  it("coerces non-finite amounts to zero", () => {
    expect(formatMoney(Number.NaN, "NGN")).toBe("₦0.00");
  });
});
