import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import type {
  ApiEnvelope,
  AdminResourceRecord,
  QueryHookOptions,
} from "@/shared/types/admin";

const fetchOnboardingSettings = async () => {
  const res = await silentApi<ApiEnvelope<AdminResourceRecord[]>>(
    "GET",
    "/onboarding-step-settings"
  );
  if (!res?.data) {
    throw new Error("Failed to fetch onboarding step settings");
  }
  return res.data;
};

const createOnboardingSetting = async (payload: AdminResourceRecord) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "POST",
    "/onboarding-step-settings",
    payload
  );
  if (!res?.data) {
    throw new Error("Failed to create onboarding step setting");
  }
  return res.data;
};

const updateOnboardingSetting = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: AdminResourceRecord;
}) => {
  const res = await api<ApiEnvelope<AdminResourceRecord>>(
    "PUT",
    `/onboarding-step-settings/${id}`,
    payload
  );
  if (!res?.data) {
    throw new Error("Failed to update onboarding step setting");
  }
  return res.data;
};

const deleteOnboardingSetting = async (id: string | number) => {
  await api("DELETE", `/onboarding-step-settings/${id}`);
  return id;
};

export const useFetchOnboardingSettings = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: ["admin-onboarding-settings"],
    queryFn: fetchOnboardingSettings,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateOnboardingSetting = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: createOnboardingSetting,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-onboarding-settings"] });
    },
  });
};

export const useUpdateOnboardingSetting = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: updateOnboardingSetting,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-onboarding-settings"] });
    },
  });
};

export const useDeleteOnboardingSetting = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: deleteOnboardingSetting,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["admin-onboarding-settings"] });
    },
  });
};
