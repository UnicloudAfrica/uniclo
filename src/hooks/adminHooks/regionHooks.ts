import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { type Region, type ApiResponse } from "@/shared/types/resource";

const fetchRegions = async (): Promise<Region[]> => {
  const res: ApiResponse<Region[]> = await silentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionByCode = async (code: string): Promise<Region> => {
  const res: ApiResponse<Region> = await silentApi("GET", `/regions/${code}`);
  if (!res.data) throw new Error(`Failed to fetch region ${code}`);
  return res.data;
};

const createRegion = async (regionData: Partial<Region>): Promise<Region> => {
  const res: ApiResponse<Region> = await api("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({
  code,
  regionData,
}: {
  code: string;
  regionData: Partial<Region>;
}): Promise<Region> => {
  const res: ApiResponse<Region> = await api("PATCH", `/regions/${code}`, regionData);
  if (!res.data) throw new Error(`Failed to update region ${code}`);
  return res.data;
};

const deleteRegion = async (code: string): Promise<unknown> => {
  const res: ApiResponse<unknown> = await api("DELETE", `/regions/${code}`);
  return res?.data ?? null;
};

export const useFetchRegions = (options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchRegionByCode = (code: string, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["region", code],
    queryFn: () => fetchRegionByCode(code),
    enabled: !!code,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

/** @deprecated Use useFetchRegionByCode instead */
export const useFetchRegionById = useFetchRegionByCode;

export const useCreateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
};

export const useUpdateRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegion,
    onSuccess: (_data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
      queryClient.invalidateQueries({ queryKey: ["region", variables.code] });
    },
  });
};

export const useDeleteRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRegion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
};

// ── Credential Health Check ──────────────────────────────────

interface CredentialHealth {
  healthy: boolean;
  error: string | null;
  username: string | null;
  region: string;
  provider: string;
  verified_at: string | null;
  checked_at: string;
}

const checkCredentialHealth = async (regionCode: string): Promise<CredentialHealth> => {
  const res = await silentApi("GET", `/regions/${regionCode}/credential-health`);
  if (!res.data) throw new Error("Failed to check credential health");
  return res.data as CredentialHealth;
};

export const useCredentialHealth = (regionCode: string | null | undefined) => {
  return useQuery({
    queryKey: ["credential-health", regionCode],
    queryFn: () => checkCredentialHealth(regionCode!),
    enabled: !!regionCode,
    staleTime: 1000 * 60 * 2, // Re-check every 2 minutes
    refetchOnWindowFocus: true,
    retry: false,
  });
};

const verifyAndUpdateCredentials = async ({
  regionId,
  credentials,
}: {
  regionId: string;
  credentials: {
    username: string;
    password: string;
    domain: string;
    domain_id?: string;
    default_project?: string;
  };
}): Promise<unknown> => {
  const res = await api("POST", `/regions/${regionId}/verify-credentials`, credentials);
  return res.data;
};

export const useUpdateCredentials = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifyAndUpdateCredentials,
    onSuccess: (
      _data: unknown,
      variables: {
        regionId: string;
        credentials: { username: string; password: string; domain: string };
      }
    ) => {
      queryClient.invalidateQueries({ queryKey: ["credential-health", variables.regionId] });
      queryClient.invalidateQueries({ queryKey: ["regions"] });
    },
  });
};
