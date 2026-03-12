/**
 * Client Instance Hooks — Client-specific instance hooks.
 *
 * Core instance CRUD has been consolidated into shared/hooks/resources/instanceHooks.
 * This file contains only client-specific hooks for purchased instances.
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

export interface InstanceData {
  id: number | string;
  status: string;
  [key: string]: unknown;
}

interface InstanceParams {
  [key: string]: string | number | boolean | undefined | null;
  per_page?: number;
}

const fetchClientPurchasedInstances = async (params: InstanceParams = {}) => {
  const defaultParams: InstanceParams = {
    per_page: 10,
  };

  const queryParams = { ...defaultParams, ...params };

  const queryString = Object.keys(queryParams)
    .filter((key) => queryParams[key] !== undefined && queryParams[key] !== null)
    .map((key) => `${key}=${encodeURIComponent(String(queryParams[key]))}`)
    .join("&");

  const uri = `/business/instances${queryString ? `?${queryString}` : ""}`;

  const res = await clientSilentApi<{ data: InstanceData[] }>("GET", uri);
  if (!res.data) {
    throw new Error("Failed to fetch instance requests");
  }
  const filtered = {
    ...res,
    data: (res.data || []).filter((it) => it.status !== "pending_payment"),
  };
  return filtered;
};

export const useFetchClientPurchasedInstances = (
  params: InstanceParams = {},
  options: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["clientInstances", "purchased", params],
    queryFn: () => fetchClientPurchasedInstances(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
