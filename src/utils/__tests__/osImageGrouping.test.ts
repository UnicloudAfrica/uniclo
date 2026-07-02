import { describe, it, expect } from "vitest";
import type { Option } from "@/types/InstanceConfiguration";
import { osImageFamilyLabel, compareOsImageOptions } from "../osImageGrouping";

const opt = (osDistro: string, osVersion: string): Option =>
  ({
    value: `${osDistro}-${osVersion}`,
    label: "",
    raw: { os_distro: osDistro, os_version: osVersion },
  }) as Option;

describe("osImageFamilyLabel", () => {
  it("capitalizes the distro family and appends the version", () => {
    expect(osImageFamilyLabel("ubuntu", "22.04", "fallback")).toBe("Ubuntu 22.04");
  });

  it("shows the family alone when there is no version", () => {
    expect(osImageFamilyLabel("debian", "", "fallback")).toBe("Debian");
  });

  it("falls back to the supplied name when the distro is missing", () => {
    expect(osImageFamilyLabel(null, "22.04", "Custom golden image")).toBe("Custom golden image");
  });
});

describe("compareOsImageOptions", () => {
  it("clusters families alphabetically", () => {
    expect(compareOsImageOptions(opt("debian", "12"), opt("ubuntu", "24.04"))).toBeLessThan(0);
  });

  it("orders the newest version first within a family", () => {
    expect(compareOsImageOptions(opt("ubuntu", "24.04"), opt("ubuntu", "20.04"))).toBeLessThan(0);
  });

  it("sorts a mixed list into grouped, version-descending order", () => {
    const sorted = [opt("ubuntu", "20.04"), opt("debian", "12"), opt("ubuntu", "24.04")].sort(
      compareOsImageOptions,
    );

    expect(sorted.map((o) => o.value)).toEqual(["debian-12", "ubuntu-24.04", "ubuntu-20.04"]);
  });
});
