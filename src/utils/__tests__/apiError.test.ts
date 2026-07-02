import { describe, it, expect } from "vitest";
import { ApiError, isApiError, extractFieldErrors } from "../apiError";

describe("ApiError", () => {
  it("is an Error subclass that carries status + body + fieldErrors", () => {
    const err = new ApiError("boom", 409, { detail: "x" }, { name: ["required"] });
    expect(err).toBeInstanceOf(Error);
    expect(isApiError(err)).toBe(true);
    expect(err.message).toBe("boom"); // existing `catch (e) { e.message }` still works
    expect(err.status).toBe(409);
    expect(err.body).toEqual({ detail: "x" });
    expect(err.fieldErrors).toEqual({ name: ["required"] });
  });

  it("isApiError is false for a plain Error or non-error", () => {
    expect(isApiError(new Error("x"))).toBe(false);
    expect(isApiError("x")).toBe(false);
    expect(isApiError(undefined)).toBe(false);
  });
});

describe("extractFieldErrors", () => {
  it("pulls top-level Laravel validation errors", () => {
    expect(extractFieldErrors({ errors: { email: ["taken"], name: ["required"] } })).toEqual({
      email: ["taken"],
      name: ["required"],
    });
  });

  it("pulls errors nested under data", () => {
    expect(extractFieldErrors({ data: { errors: { region: ["bad"] } } })).toEqual({
      region: ["bad"],
    });
  });

  it("coerces a non-array message to an array", () => {
    expect(extractFieldErrors({ errors: { x: "single" } })).toEqual({ x: ["single"] });
  });

  it("returns undefined when there are no field errors", () => {
    expect(extractFieldErrors({ message: "no fields" })).toBeUndefined();
    expect(extractFieldErrors(null)).toBeUndefined();
    expect(extractFieldErrors({ errors: [] })).toBeUndefined();
  });
});
