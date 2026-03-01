import { describe, it, expect } from "vitest";
import type { ApiResponse, Country, Region } from "./resource";

describe("ApiResponse type", () => {
  it("accepts a typed data payload", () => {
    const response: ApiResponse<string[]> = {
      data: ["item1", "item2"],
      message: "Success",
      success: true,
    };
    expect(response.data).toEqual(["item1", "item2"]);
    expect(response.success).toBe(true);
  });

  it("works without data (optional)", () => {
    const response: ApiResponse = {
      message: "No content",
      success: true,
    };
    expect(response.data).toBeUndefined();
  });
});

describe("Resource type shapes", () => {
  it("Country has required fields", () => {
    const country: Country = { id: 1, name: "Nigeria", iso2: "NG" };
    expect(country.name).toBe("Nigeria");
    expect(country.iso2).toBe("NG");
  });

  it("Region has required fields", () => {
    const region: Region = { id: 1, name: "West Africa" };
    expect(region.name).toBe("West Africa");
  });
});
