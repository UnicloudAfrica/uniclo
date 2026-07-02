import { describe, it, expect } from "vitest";
import { getCurrencySymbol } from "../resource";

describe("getCurrencySymbol", () => {
  it("returns the correct symbol for known currencies", () => {
    expect(getCurrencySymbol("NGN")).toBe("₦");
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("AED")).toBe("د.إ");
  });

  it("falls back to the ISO code (not a hardcoded symbol) for unknown currencies", () => {
    // Platform money rule: never assume a currency for an unrecognised code.
    // A ZAR/KES amount must not render with a $ or ₦ prefix.
    expect(getCurrencySymbol("ZAR")).toBe("ZAR ");
    expect(getCurrencySymbol("KES")).toBe("KES ");
  });

  it("falls back to $ only when no code is supplied", () => {
    expect(getCurrencySymbol("")).toBe("$");
  });
});
