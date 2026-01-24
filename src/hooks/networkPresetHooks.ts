import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Network } from "lucide-react";
import { useApiContext } from "./useApiContext";
import { DEFAULT_PRESETS, NetworkPreset } from "../shared/components/network/NetworkPresetSelector";

type ApiPreset = {
  id?: string;
  name?: string;
  description?: string;
  has_internet_gateway?: boolean;
  subnet_count?: number;
  security_group_count?: number;
  subnets?: Array<{ public?: boolean }>;
  requires_eip?: boolean;
};

const fallbackIcon = React.createElement(Network, { className: "w-5 h-5" });

const getApiPrefix = (context: string) => {
  if (context === "admin") return "";
  if (context === "tenant") return "/admin";
  return "/business";
};

const mapPreset = (preset: ApiPreset, fallback?: NetworkPreset): NetworkPreset => {
  const id = String(preset.id ?? fallback?.id ?? "");
  const hasPublicSubnet = Array.isArray(preset.subnets)
    ? preset.subnets.some((subnet) => Boolean(subnet?.public))
    : false;
  const isPublic =
    Boolean(preset.has_internet_gateway) || hasPublicSubnet || Boolean(fallback?.isPublic);
  const requiresEip =
    typeof preset.requires_eip === "boolean" ? preset.requires_eip : Boolean(fallback?.requiresEip);
  const subnetCount = Number(preset.subnet_count ?? 0);
  const securityGroupCount = Number(preset.security_group_count ?? 0);
  const features = fallback?.features ?? [
    subnetCount ? `${subnetCount} subnet${subnetCount === 1 ? "" : "s"}` : "Subnets on demand",
    securityGroupCount
      ? `${securityGroupCount} security group${securityGroupCount === 1 ? "" : "s"}`
      : "Security groups included",
    isPublic ? "Internet Gateway enabled" : "Private routing only",
  ];

  return {
    id,
    name: preset.name ?? fallback?.name ?? id,
    description: preset.description ?? fallback?.description ?? "",
    icon: fallback?.icon ?? fallbackIcon,
    features,
    recommended: fallback?.recommended,
    isPublic,
    requiresEip,
  };
};

const mergePresets = (items: ApiPreset[] | null | undefined): NetworkPreset[] => {
  const defaultsById = new Map(DEFAULT_PRESETS.map((preset) => [preset.id, preset]));
  const merged: NetworkPreset[] = [];

  if (Array.isArray(items)) {
    items.forEach((item) => {
      const id = String(item.id ?? "");
      if (!id) {
        return;
      }
      const fallback = defaultsById.get(id);
      merged.push(mapPreset(item, fallback));
      defaultsById.delete(id);
    });
  }

  defaultsById.forEach((preset) => {
    merged.push(preset);
  });

  return merged;
};

export const useNetworkPresets = (options: { enabled?: boolean } = {}) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const prefix = getApiPrefix(context);

  return useQuery({
    queryKey: ["network-presets", context],
    queryFn: async () => {
      const { data } = await axios.get(`${apiBaseUrl}${prefix}/network-presets`, {
        headers: authHeaders,
        withCredentials: true,
      });
      const payload = data?.data ?? data ?? [];
      return mergePresets(payload as ApiPreset[]);
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    placeholderData: DEFAULT_PRESETS,
    enabled: (options.enabled ?? true) && isAuthenticated,
  });
};
