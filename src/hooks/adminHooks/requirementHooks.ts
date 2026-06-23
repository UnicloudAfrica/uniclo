import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import { type ApiResponse } from "@/shared/types/resource";
import { type RequirementRecord } from "@/shared/types/requirement";
import logger from "@/utils/logger";

// GET: all requirements (admin-scoped Requirement Builder).
const fetchRequirements = async (): Promise<RequirementRecord[]> => {
  const res: ApiResponse<RequirementRecord[]> = await silentApi("GET", "/requirements");
  return res.data ?? [];
};

const createRequirement = async (
  data: Partial<RequirementRecord>
): Promise<RequirementRecord | undefined> => {
  try {
    const res: ApiResponse<RequirementRecord> = await api("POST", "/requirements", data);
    return res.data;
  } catch (error) {
    logger.error("Error creating requirement:", error);
    throw error;
  }
};

const updateRequirement = async ({
  id,
  data,
}: {
  id: string | number;
  data: Partial<RequirementRecord>;
}): Promise<RequirementRecord | undefined> => {
  const res: ApiResponse<RequirementRecord> = await api("PATCH", `/requirements/${id}`, data);
  return res.data;
};

const deleteRequirement = async (id: string | number): Promise<unknown> => {
  const res: ApiResponse<unknown> = await api("DELETE", `/requirements/${id}`);
  return res.data;
};

export const useFetchRequirements = (
  options: Omit<UseQueryOptions<RequirementRecord[]>, "queryKey" | "queryFn"> = {}
) =>
  useQuery({
    queryKey: ["requirements"],
    queryFn: fetchRequirements,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: false,
    ...options,
  });

export const useCreateRequirement = (
  options: Omit<
    UseMutationOptions<RequirementRecord | undefined, Error, Partial<RequirementRecord>>,
    "mutationFn"
  > = {}
) => {
  const qc = useQueryClient();
  return useMutation<RequirementRecord | undefined, Error, Partial<RequirementRecord>>({
    mutationFn: createRequirement,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ["requirements"] });
      options.onSuccess?.(...args);
    },
  });
};

export const useUpdateRequirement = (
  options: Omit<
    UseMutationOptions<
      RequirementRecord | undefined,
      Error,
      { id: string | number; data: Partial<RequirementRecord> }
    >,
    "mutationFn"
  > = {}
) => {
  const qc = useQueryClient();
  return useMutation<
    RequirementRecord | undefined,
    Error,
    { id: string | number; data: Partial<RequirementRecord> }
  >({
    mutationFn: updateRequirement,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ["requirements"] });
      options.onSuccess?.(...args);
    },
  });
};

export const useDeleteRequirement = (
  options: Omit<UseMutationOptions<unknown, Error, string | number>, "mutationFn"> = {}
) => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string | number>({
    mutationFn: deleteRequirement,
    ...options,
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: ["requirements"] });
      options.onSuccess?.(...args);
    },
  });
};
