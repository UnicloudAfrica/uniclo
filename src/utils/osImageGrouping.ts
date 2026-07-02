import type { Option } from "@/types/InstanceConfiguration";

/**
 * Build a grouped display label for an OS image option from its distro family
 * and version (e.g. "Ubuntu 22.04"). Falls back to the provider-supplied name
 * when the catalog row has no os_distro (older images, custom uploads).
 */
export function osImageFamilyLabel(
  osDistro: string | null | undefined,
  osVersion: string | null | undefined,
  fallback: string,
): string {
  const distro = String(osDistro ?? "").trim();
  if (!distro) return fallback;
  const family = distro.charAt(0).toUpperCase() + distro.slice(1);
  const version = String(osVersion ?? "").trim();
  return version ? `${family} ${version}` : family;
}

const distroOf = (option: Option): string =>
  String((option.raw as { os_distro?: unknown } | null | undefined)?.os_distro ?? "").toLowerCase();

const versionOf = (option: Option): string =>
  String((option.raw as { os_version?: unknown } | null | undefined)?.os_version ?? "");

/**
 * Sort OS-image options so distro families cluster together (alphabetical) with
 * the newest version first inside each family. A flat searchable dropdown then
 * reads as grouped — all Ubuntu rows together (24.04, 22.04, 20.04), then Debian,
 * etc. — without needing a custom grouped-select component.
 */
export function compareOsImageOptions(a: Option, b: Option): number {
  const distroA = distroOf(a);
  const distroB = distroOf(b);
  if (distroA !== distroB) {
    return distroA.localeCompare(distroB);
  }
  return versionOf(b).localeCompare(versionOf(a), undefined, { numeric: true });
}
