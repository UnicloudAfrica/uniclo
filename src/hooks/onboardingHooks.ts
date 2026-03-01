import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import api from "../index/api";

type OnboardingPayload = Record<string, unknown>;

type OnboardingResponse = Record<string, unknown> | null;

interface OnboardingStepRequest {
  step: string;
  payload: OnboardingPayload;
}

interface VerifyPartnerRegionRequest {
  payload: OnboardingPayload;
}

const fetchOnboardingState = async (): Promise<OnboardingResponse> => {
  const response = await api("GET", "/business/onboarding/state");

  return (response?.data as OnboardingResponse) ?? (response as OnboardingResponse);
};

const fetchOnboardingStep = async (step: string): Promise<OnboardingResponse> => {
  const response = await api("GET", `/business/onboarding/${step}`);

  return (response?.data as OnboardingResponse) ?? (response as OnboardingResponse);
};

const postOnboardingThread = async ({
  step,
  payload,
}: OnboardingStepRequest): Promise<OnboardingResponse> => {
  const response = await api("POST", `/business/onboarding/${step}/threads`, payload);

  return (response?.data as OnboardingResponse) ?? (response as OnboardingResponse);
};

const updateOnboardingStep = async ({
  step,
  payload,
}: OnboardingStepRequest): Promise<OnboardingResponse> => {
  const response = await api("PATCH", `/business/onboarding/${step}`, payload);

  return (response?.data as OnboardingResponse) ?? (response as OnboardingResponse);
};

const verifyPartnerRegionQualification = async ({
  payload,
}: VerifyPartnerRegionRequest): Promise<OnboardingResponse> => {
  const response = await api("POST", "/business/onboarding/partner_region_qualification/verify", {
    payload,
  });

  return (response?.data as OnboardingResponse) ?? (response as OnboardingResponse);
};

export const useOnboardingState = (
  options: Omit<UseQueryOptions<OnboardingResponse, Error>, "queryKey" | "queryFn"> = {}
) =>
  useQuery({
    queryKey: ["onboarding", "state"],
    queryFn: fetchOnboardingState,
    staleTime: 30 * 1000,
    ...options,
  });

export const useOnboardingStep = (
  step: string | null,
  options: Omit<UseQueryOptions<OnboardingResponse, Error>, "queryKey" | "queryFn"> = {}
) =>
  useQuery({
    queryKey: ["onboarding", "step", step],
    queryFn: () => fetchOnboardingStep(step ?? ""),
    enabled: Boolean(step) && (options.enabled ?? true),
    ...options,
  });

export const useUpdateOnboardingStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOnboardingStep,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "state"] });
      if (variables?.step) {
        queryClient.invalidateQueries({ queryKey: ["onboarding", "step", variables.step] });
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
        queryClient.invalidateQueries({ queryKey: ["onboarding", "step", variables.step] });
      }
    },
  });
};

export const useVerifyPartnerRegionQualification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPartnerRegionQualification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding", "state"] });
      queryClient.invalidateQueries({
        queryKey: ["onboarding", "step", "partner_region_qualification"],
      });
    },
  });
};
