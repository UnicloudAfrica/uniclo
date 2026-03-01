import { describe, it, expect } from "vitest";
import { getAsyncErrorMessage } from "./asyncError";

describe("getAsyncErrorMessage", () => {
  it("returns string errors directly", () => {
    expect(getAsyncErrorMessage("Network error")).toBe("Network error");
  });

  it("extracts message from Error instances", () => {
    expect(getAsyncErrorMessage(new Error("Something broke"))).toBe("Something broke");
  });

  it("extracts message from record.message", () => {
    expect(getAsyncErrorMessage({ message: "Server unavailable" })).toBe("Server unavailable");
  });

  it("extracts message from record.error", () => {
    expect(getAsyncErrorMessage({ error: "Forbidden" })).toBe("Forbidden");
  });

  it("extracts message from nested data.message", () => {
    expect(getAsyncErrorMessage({ data: { message: "Not found" } })).toBe("Not found");
  });

  it("extracts message from response.data.message (Axios-style)", () => {
    const axiosError = { response: { data: { message: "Unauthorized" } } };
    expect(getAsyncErrorMessage(axiosError)).toBe("Unauthorized");
  });

  it("returns fallback for null/undefined", () => {
    expect(getAsyncErrorMessage(null)).toBe("Something went wrong. Please try again.");
    expect(getAsyncErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("returns custom fallback when provided", () => {
    expect(getAsyncErrorMessage(null, "Custom fallback")).toBe("Custom fallback");
  });

  it("trims whitespace from string errors", () => {
    expect(getAsyncErrorMessage("  spaced out  ")).toBe("spaced out");
  });

  it("skips empty/whitespace-only strings", () => {
    expect(getAsyncErrorMessage("   ")).toBe("Something went wrong. Please try again.");
  });
});
