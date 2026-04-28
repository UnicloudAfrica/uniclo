import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import api from "../../index/api";

export type TenantOnboardingTarget = "tenant" | "client";

export interface TenantSubjectOnboardingArgs {
  target: TenantOnboardingTarget;
  subjectId: string;
  step: string;
}

export interface TenantSubjectOnboardingDetail {
  payload?: Record<string, unknown>;
  documents?: unknown[];
  threads?: unknown[];
  [key: string]: unknown;
}

const buildQuery = (target: TenantOnboardingTarget, subjectId: string) => {
  if (!target) {
    throw new Error("target is required");
  }

  const params = new URLSearchParams({ target });

  if (target === "tenant") {
    params.set("tenant_id", subjectId);
  } else {
    params.set("user_id", subjectId);
  }

  return params.toString();
};

const fetchTenantSubjectOnboarding = async ({
  target,
  subjectId,
  step,
}: TenantSubjectOnboardingArgs): Promise<TenantSubjectOnboardingDetail | null> => {
  if (!target || !subjectId || !step) {
    return null;
  }

  const query = buildQuery(target, subjectId);
  const response = await api<{ data?: TenantSubjectOnboardingDetail | null }>(
    "GET",
    `/business/onboarding/${step}/review?${query}`
  );

  return response?.data ?? null;
};

export const useTenantSubjectOnboarding = (
  { target, subjectId, step }: TenantSubjectOnboardingArgs,
  options: Omit<
    UseQueryOptions<TenantSubjectOnboardingDetail | null, Error>,
    "queryKey" | "queryFn"
  > = {}
) =>
  useQuery({
    queryKey: ["tenant-onboarding", target, subjectId, step],
    queryFn: () => fetchTenantSubjectOnboarding({ target, subjectId, step }),
    enabled: Boolean(target && subjectId && step && (options.enabled ?? true)),
    ...options,
  });
