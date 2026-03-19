import type { LucideIcon } from "lucide-react";

export interface PricingTabDefinition {
  id: string;
  name: string;
  caption: string;
  productType: string;
  icon: LucideIcon;
  isGlobal?: boolean;
}

export interface TenantRegion {
  code: string;
  name: string;
  provider?: string;
  country_code?: string | null;
  [key: string]: unknown;
}

export interface PricingCatalogProduct {
  id?: string | number;
  name?: string;
  productable_name?: string;
  productable_label?: string;
  productable_type?: string;
  productable_id?: string | number;
  [key: string]: unknown;
}

export interface PricingAmount {
  price_usd?: number | null;
  price_local?: number | null;
  currency?: string | null;
  scope?: string | null;
  source?: string | null;
  [key: string]: unknown;
}

export interface PricingCatalogRow {
  id?: string | number | null;
  product?: PricingCatalogProduct | null;
  pricing?: {
    admin?: PricingAmount;
    tenant?: PricingAmount;
    effective?: PricingAmount;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export type OverrideScope = "region" | "country" | "availability_zone";

export interface ModalRowState {
  item: PricingCatalogRow;
  override: import("@/hooks/tenantHooks/tenantPricingHooks").TenantPricingOverride | null;
  overrideScope: OverrideScope;
}

export interface OverrideLookup {
  row: import("@/hooks/tenantHooks/tenantPricingHooks").TenantPricingOverride;
  scope: OverrideScope;
}

export const formatCurrency = (value: unknown, currency = "USD") => {
  if (value === null || value === undefined || value === "") return "\u2014";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "\u2014";
  return `${currency} ${amount.toFixed(2)}`;
};

export const extractRowsFromPayload = <TRow>(payload: unknown): TRow[] => {
  if (Array.isArray(payload)) return payload as TRow[];
  if (payload && typeof payload === "object") {
    const rows = (payload as { data?: unknown }).data;
    if (Array.isArray(rows)) return rows as TRow[];
  }
  return [];
};
