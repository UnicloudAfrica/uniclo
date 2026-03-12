import config from "../../config";

export type RegionContext = "admin" | "tenant" | "client" | "";

export interface RegionFallback {
  baseUrl: string;
  endpoint: string;
}

export interface RegionLike {
  region?: string;
  code?: string;
  id?: string | number;
  slug?: string;
  name?: string;
  label?: string;
  [key: string]: unknown;
}

export interface NormalizedRegion extends RegionLike {
  region: string;
  code: string;
  label: string;
}

export const resolveRegionEndpoint = (context: RegionContext = ""): string => {
  if (context === "client") return "/business/cloud-regions";
  if (context === "tenant") return "/cloud-regions";
  if (context === "admin") return "/regions";
  return "/regions";
};

export const resolveRegionFallback = (context: RegionContext = ""): RegionFallback | null => {
  if (context === "client" || context === "tenant") {
    return {
      baseUrl: config.baseURL,
      endpoint: "/regions",
    };
  }
  return null;
};

const resolveRegionValue = (region: RegionLike): string | number =>
  region?.region ??
  region?.code ??
  region?.id ??
  region?.slug ??
  region?.name ??
  region?.label ??
  "";

const resolveRegionLabel = (region: RegionLike, fallback: string): string =>
  String(
    region?.label ??
      region?.name ??
      region?.region ??
      region?.code ??
      region?.id ??
      region?.slug ??
      fallback
  );

export const normalizeRegionList = (payload: unknown): NormalizedRegion[] => {
  const extractArray = (value: unknown): RegionLike[] | null =>
    Array.isArray(value) ? (value as RegionLike[]) : null;

  const payloadRecord =
    typeof payload === "object" && payload !== null ? (payload as { data?: unknown }) : {};
  const payloadData = payloadRecord.data;
  const nestedData =
    typeof payloadData === "object" && payloadData !== null && "data" in payloadData
      ? (payloadData as { data?: unknown }).data
      : undefined;

  const raw = extractArray(nestedData) ?? extractArray(payloadData) ?? extractArray(payload) ?? [];

  return raw
    .filter((region: RegionLike) => {
      // Filter out regions without a proper display name (raw codes only)
      const hasName = Boolean(region?.name || region?.label);
      const isActive = (region as any)?.is_active !== false;
      return hasName && isActive;
    })
    .map((region: RegionLike) => {
      const value = resolveRegionValue(region);
      if (!value) return null;
      const normalizedValue = String(value);
      const label = resolveRegionLabel(region, normalizedValue);
      return {
        ...region,
        region: region?.region ?? normalizedValue,
        code: region?.code ?? region?.region ?? normalizedValue,
        label,
      };
    })
    .filter((region): region is NormalizedRegion => Boolean(region));
};
