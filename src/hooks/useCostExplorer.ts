import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Empty default → relative URLs that hit Vite's proxy in dev (see vite.config.ts).
// Production should set VITE_API_BASE_URL to the API origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const publicApi = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { Accept: "application/json" },
});

export interface Region {
  id: number;
  code: string;
  name: string;
  country_code: string;
  availability_zones: { id: number; code: string; name: string; provider: string }[];
}

export interface CalculatorOptions {
  compute_flavors: { id: number; name: string; vcpus: number; memory_mb: number; price?: number }[];
  os_images: { id: number; name: string; display_name?: string; price?: number }[];
  block_storage: { id: number; name: string; price_per_gb?: number }[];
  bandwidth: { id: number; name: string; price?: number }[];
  floating_ips: { id: number; name: string; price?: number }[];
  cross_connects: { id: number; name: string; price?: number }[];
}

export interface AcfService {
  service_type: string;
  name: string;
  description: string;
  billing_model: "one_time" | "monthly_flat";
  unit_label: string;
  unit_price: number;
  pricing_tiers:
    | { min_units: number; max_units: number | null; price_usd: number; label: string }[]
    | null;
  is_one_time: boolean;
  is_recurring: boolean;
}

export interface MonitoringTier {
  service_type: string;
  name: string;
  description: string;
  price_per_host: number;
  features: string[];
}

export interface BrandingData {
  branding: {
    logo: string | null;
    favicon: string | null;
    brand: { primary_color: string; accent_color: string; palette?: Record<string, string> };
    company: { name: string; email?: string; website?: string; logo_href?: string };
  };
  tenant_id: string | null;
}

export const useFetchPublicRegions = () =>
  useQuery({
    queryKey: ["public-regions"],
    queryFn: async () => {
      const res = await publicApi.get("/cloud-regions");
      return (res.data?.data ?? []) as Region[];
    },
    staleTime: 60_000 * 10,
  });

export const useFetchCalculatorOptions = (region: string) =>
  useQuery({
    queryKey: ["calculator-options", region],
    queryFn: async () => {
      const res = await publicApi.get("/calculator-options", { params: { region } });
      return (res.data?.data ?? res.data) as CalculatorOptions;
    },
    enabled: !!region,
    staleTime: 60_000 * 5,
  });

export const useFetchPublicBranding = () =>
  useQuery({
    queryKey: ["public-branding", typeof window !== "undefined" ? window.location.hostname : ""],
    queryFn: async () => {
      const res = await publicApi.get("/branding", {
        params: { domain: window.location.hostname },
      });
      return (res.data?.data ?? null) as BrandingData | null;
    },
    staleTime: 60_000 * 30,
  });

// Product pricing — the master pricing source for ALL services
export const useFetchProductPricing = (region: string, productableType?: string) =>
  useQuery({
    queryKey: ["product-pricing", region, productableType],
    queryFn: async () => {
      const params: Record<string, string> = { region };
      if (productableType) params.productable_type = productableType;
      const res = await publicApi.get("/product-pricing", { params });
      return (res.data?.data ?? []) as Record<string, unknown>[];
    },
    enabled: !!region,
    staleTime: 60_000 * 5,
  });

// AnyCloudFlow services (migration, DR, backup) — uses product-pricing under the hood
export const useFetchAcfPublicServices = () =>
  useQuery({
    queryKey: ["public-acf-services"],
    queryFn: async () => {
      const res = await publicApi.get("/cost-explorer/services");
      return (res.data?.data ?? []) as AcfService[];
    },
    staleTime: 60_000 * 10,
  });

// Monitoring tiers
export const useFetchPublicMonitoringTiers = () =>
  useQuery({
    queryKey: ["public-monitoring-tiers"],
    queryFn: async () => {
      const res = await publicApi.get("/cost-explorer/monitoring-tiers");
      const data = res.data?.data ?? res.data;
      return (data?.tiers ?? []) as MonitoringTier[];
    },
    staleTime: 60_000 * 10,
  });
