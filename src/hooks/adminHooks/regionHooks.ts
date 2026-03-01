import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { type Region, type ApiResponse } from "../../shared/types/resource";

const fetchRegions = async (): Promise<Region[]> => {
  const res: ApiResponse<Region[]> = await silentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

const fetchRegionById = async (id: string | number): Promise<Region> => {
  const res: ApiResponse<Region> = await silentApi("GET", `/regions/${id}`);
  if (!res.data) throw new Error(`Failed to fetch region with ID ${id}`);
  return res.data;
};

const createRegion = async (regionData: Partial<Region>): Promise<Region> => {
  const res: ApiResponse<Region> = await api("POST", "/regions", regionData);
  if (!res.data) throw new Error("Failed to create region");
  return res.data;
};

const updateRegion = async ({
  id,
  regionData,
}: {
  id: string | number;
  regionData: Partial<Region>;
}): Promise<Region> => {
  const res: ApiResponse<Region> = await api("PATCH", `/regions/${id}`, regionData);
  if (!res.data) throw new Error(`Failed to update region with ID ${id}`);
  return res.data;
};

const deleteRegion = async (id: string | number): Promise<unknown> => {
  const res: ApiResponse<unknown> = await api("DELETE", `/regions/${id}`);
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

export const useFetchRegionById = (id: string | number, options: Record<string, unknown> = {}) => {
  return useQuery({
    queryKey: ["region", id],
    queryFn: () => fetchRegionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

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
      queryClient.invalidateQueries({ queryKey: ["region", variables.id] });
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
