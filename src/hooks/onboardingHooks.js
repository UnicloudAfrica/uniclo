import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";

const fetchOnboardingState = async () => {
  const response = await api("GET", "/business/onboarding/state");

  return response?.data ?? response;
};

const fetchOnboardingStep = async (step) => {
  const response = await api("GET", `/business/onboarding/${step}`);

  return response?.data ?? response;
};

const postOnboardingThread = async ({ step, payload }) => {
  const response = await api("POST", `/business/onboarding/${step}/threads`, payload);

  return response?.data ?? response;
};

const updateOnboardingStep = async ({ step, payload }) => {
  const response = await api("PATCH", `/business/onboarding/${step}`, payload);

  return response?.data ?? response;
};

const verifyPartnerRegionQualification = async ({ payload }) => {
  const response = await api("POST", "/business/onboarding/partner_region_qualification/verify", {
    payload,
  });

  return response?.data ?? response;
};

export const useOnboardingState = (options = {}) =>
  useQuery({
    queryKey: ["onboarding", "state"],
    queryFn: fetchOnboardingState,
    staleTime: 30 * 1000,
    ...options,
  });

export const useOnboardingStep = (step, options = {}) =>
  useQuery({
    queryKey: ["onboarding", "step", step],
    queryFn: () => fetchOnboardingStep(step),
    enabled: Boolean(step) && (options.enabled ?? true),
    ...options,
  });

export const useUpdateOnboardingStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOnboardingStep,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(["onboarding", "state"]);
      if (variables?.step) {
        queryClient.invalidateQueries(["onboarding", "step", variables.step]);
      }
    },
  });
};

export const usePostOnboardingThread = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postOnboardingThread,
    onSuccess: (_data, variables) => {
      if (variables?.step) {
        queryClient.invalidateQueries(["onboarding", "step", variables.step]);
      }
    },
  });
};

export const useVerifyPartnerRegionQualification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPartnerRegionQualification,
    onSuccess: () => {
      queryClient.invalidateQueries(["onboarding", "state"]);
      queryClient.invalidateQueries(["onboarding", "step", "partner_region_qualification"]);
    },
  });
};
