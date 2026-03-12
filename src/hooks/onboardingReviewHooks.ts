import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import api from "../index/api";

const ONBOARDING_QUEUE_KEY = ["onboarding-review", "queue"];

type OnboardingTarget = "tenant" | "client" | "crm" | "internal_client_business" | (string & {});

type QueryPrimitive = string | number | boolean;
type QueueQueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;

interface QueueParams {
  [key: string]: QueueQueryValue;
}

interface SubmissionIdentity {
  target: OnboardingTarget;
  tenantId?: string | number | null;
  userId?: string | number | null;
}

interface SubmissionRequest extends SubmissionIdentity {
  step: string;
}

interface SubmissionStatusUpdate extends SubmissionRequest {
  status: string;
  message?: string;
  meta?: Record<string, unknown>;
}

interface QueueSubmissionRecord {
  id?: string | number;
  [key: string]: unknown;
}

interface OnboardingSubmissionResult {
  submission: Record<string, unknown> | null;
  meta: Record<string, unknown>;
}

interface OnboardingStatusPayload {
  target: OnboardingTarget;
  status: string;
  tenant_id?: string | number;
  user_id?: string | number;
  message?: string;
  meta?: Record<string, unknown>;
}

const toQueryParamValue = (value: QueryPrimitive) => String(value);

const buildQueueQuery = (params: QueueParams = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      if (Array.isArray(value)) {
        value.forEach((entry) => searchParams.append(`${key}[]`, toQueryParamValue(entry)));
      } else {
        searchParams.set(key, toQueryParamValue(value));
      }
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const buildQueryParams = ({ target, tenantId, userId }: SubmissionIdentity) => {
  if (!target) {
    throw new Error("Target is required to fetch onboarding submissions.");
  }

  const params = new URLSearchParams({ target: String(target) });

  if (target === "tenant") {
    if (!tenantId) {
      throw new Error("tenantId is required when target is tenant.");
    }
    params.set("tenant_id", String(tenantId));
  } else {
    if (!userId) {
      throw new Error("userId is required when target is client or crm.");
    }
    params.set("user_id", String(userId));
  }

  return params.toString();
};

export const fetchOnboardingSubmission = async ({
  target,
  tenantId,
  userId,
  step,
}: SubmissionRequest): Promise<OnboardingSubmissionResult> => {
  if (!step) {
    throw new Error("Step is required to fetch onboarding submissions.");
  }

  const queryString = buildQueryParams({ target, tenantId, userId });
  const response = await api("GET", `/business/onboarding/${step}/review?${queryString}`);

  return {
    submission: (response?.data as Record<string, unknown> | null) ?? null,
    meta: (response?.meta as Record<string, unknown>) ?? {},
  };
};

const submissionQueryKey = (
  target: OnboardingTarget,
  tenantId?: string | number | null,
  userId?: string | number | null,
  step?: string | null
) =>
  [
    "onboarding-review",
    target,
    target === "tenant" ? (tenantId ?? null) : null,
    target === "tenant" ? null : (userId ?? null),
    step ?? null,
  ] as const;

export const onboardingSubmissionListKey = (
  target: OnboardingTarget,
  tenantId?: string | number | null,
  userId?: string | number | null
) =>
  [
    "onboarding-review",
    target,
    target === "tenant" ? (tenantId ?? null) : null,
    target === "tenant" ? null : (userId ?? null),
  ] as const;

export const useOnboardingSubmission = (
  { target, tenantId, userId, step }: SubmissionRequest,
  options: Omit<UseQueryOptions<OnboardingSubmissionResult, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: submissionQueryKey(target, tenantId, userId, step),
    queryFn: () => fetchOnboardingSubmission({ target, tenantId, userId, step }),
    enabled: Boolean(step && target && (tenantId || userId)),
    ...options,
  });
};

const updateStatus = async ({
  target,
  tenantId,
  userId,
  step,
  status,
  message,
  meta,
}: SubmissionStatusUpdate): Promise<Record<string, unknown> | null> => {
  const payload: OnboardingStatusPayload = {
    target,
    status,
  };

  if (target === "tenant") {
    if (tenantId === null || tenantId === undefined) {
      throw new Error("tenantId is required when target is tenant.");
    }
    payload.tenant_id = tenantId;
  } else {
    if (userId === null || userId === undefined) {
      throw new Error("userId is required when target is client or crm.");
    }
    payload.user_id = userId;
  }

  if (message) {
    payload.message = message;
  }

  if (meta) {
    payload.meta = meta;
  }

  const response = await api<{ data?: Record<string, unknown> | null }>(
    "PATCH",
    `/business/onboarding/${step}/status`,
    payload as unknown as Record<string, unknown>
  );

  return (response?.data as Record<string, unknown> | null) ?? null;
};

export const useUpdateOnboardingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: submissionQueryKey(
          variables.target,
          variables.tenantId,
          variables.userId,
          variables.step
        ),
      });

      queryClient.invalidateQueries({
        queryKey: onboardingSubmissionListKey(
          variables.target,
          variables.tenantId,
          variables.userId
        ),
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ONBOARDING_QUEUE_KEY,
        exact: false,
      });
    },
  });
};

export const fetchOnboardingReviewQueue = async (
  params: QueueParams = {}
): Promise<QueueSubmissionRecord[]> => {
  const query = buildQueueQuery(params ?? {});
  const response = await api("GET", `/business/onboarding/review-queue${query}`);

  const data = response?.data;
  return Array.isArray(data) ? (data as QueueSubmissionRecord[]) : [];
};

export const useOnboardingReviewQueue = (
  params: QueueParams | null = null,
  options: Omit<UseQueryOptions<QueueSubmissionRecord[], Error>, "queryKey" | "queryFn"> = {}
) => {
  const resolvedParams = params ?? {};

  return useQuery({
    queryKey: [...ONBOARDING_QUEUE_KEY, resolvedParams],
    queryFn: () => fetchOnboardingReviewQueue(resolvedParams),
    staleTime: 30_000,
    ...options,
  });
};
