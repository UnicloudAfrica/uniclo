import { describe, it, expect } from "vitest";

import { normalizeTag, normalizeTags } from "../instanceDetailsUtils";

describe("normalizeTag", () => {
  it("returns trimmed plain strings", () => {
    expect(normalizeTag("env:prod")).toBe("env:prod");
    expect(normalizeTag("  spaced  ")).toBe("spaced");
  });

  it("drops empty / whitespace-only / nullish values", () => {
    expect(normalizeTag("")).toBeNull();
    expect(normalizeTag("   ")).toBeNull();
    expect(normalizeTag(null)).toBeNull();
    expect(normalizeTag(undefined)).toBeNull();
  });

  it("formats {key,value} and {Key,Value} as 'key: value'", () => {
    expect(normalizeTag({ key: "env", value: "prod" })).toBe("env: prod");
    expect(normalizeTag({ Key: "Owner", Value: "ops" })).toBe("Owner: ops");
  });

  it("uses the value alone when there is no key", () => {
    expect(normalizeTag({ value: "standalone" })).toBe("standalone");
    expect(normalizeTag({ name: "team-a" })).toBe("team-a");
  });

  it("JSON-stringifies other objects but never yields [object Object]", () => {
    const result = normalizeTag({ foo: "bar" });
    expect(result).not.toBe("[object Object]");
    expect(result).toBe('{"foo":"bar"}');
  });

  it("coerces numbers and booleans", () => {
    expect(normalizeTag(42)).toBe("42");
    expect(normalizeTag(true)).toBe("true");
  });
});

describe("normalizeTags", () => {
  it("returns [] for nullish input", () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
  });

  it("splits comma-separated strings and drops blanks", () => {
    expect(normalizeTags("a, b , ,c")).toEqual(["a", "b", "c"]);
  });

  it("normalizes a mixed array with no [object Object] leak", () => {
    const input = ["plain", { key: "env", value: "prod" }, { value: "v" }, { weird: 1 }, ""];
    const out = normalizeTags(input);
    expect(out).toEqual(["plain", "env: prod", "v", '{"weird":1}']);
    expect(out.some((t) => t.includes("[object Object]"))).toBe(false);
  });

  it("renders a plain object tag map as 'key: value'", () => {
    expect(normalizeTags({ env: "prod", team: "a" })).toEqual([
      "env: prod",
      "team: a",
    ]);
  });

  it("drops internal provisioning keys from object tags", () => {
    // The exact shape the provisioner writes to instance.tags — all internal.
    const input = {
      key_name: "008899-zk1782148411930",
      created_eip_ids: ["8f6f3077-b55a-48f3-9b55-73274e966ef4"],
    };
    expect(normalizeTags(input)).toEqual([]);
  });

  it("keeps user object tags but strips internal keys when mixed", () => {
    const input = { env: "prod", key_name: "internal", created_eip_ids: [] };
    expect(normalizeTags(input)).toEqual(["env: prod"]);
  });
});
