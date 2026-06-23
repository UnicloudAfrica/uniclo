import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import api from "@/lib/api";
import { type ApiResponse } from "@/shared/types/resource";
import { type RequirementRecord } from "@/shared/types/requirement";
import logger from "@/utils/logger";

/**
 * Role-agnostic data layer for the Dynamic Input Gate Requirement Builder.
 * The unified `api` client auto-targets the admin OR tenant base from the
 * current session role, so the SAME hooks power both the admin builder
 * (platform/tenant scope) and the tenant builder (own scope) — `/requirements`
 * resolves to `admin/v1/requirements` or `tenant/v1/requirements` accordingly.
 */
const fetchRequirements = async (): Promise<RequirementRecord[]> => {
  const res = await api.get<ApiResponse<RequirementRecord[]>>("/requirements", { silent: true });
  return res.data ?? [];
};

const createRequirement = async (
  data: Partial<RequirementRecord>
): Promise<RequirementRecord | undefined> => {
  try {
    const res = await api.post<ApiResponse<RequirementRecord>>("/requirements", data);
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
  const res = await api.patch<ApiResponse<RequirementRecord>>(`/requirements/${id}`, data);
  return res.data;
};

const deleteRequirement = async (id: string | number): Promise<unknown> => {
  const res = await api.delete<ApiResponse<unknown>>(`/requirements/${id}`);
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
