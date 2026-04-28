import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
} from "@tanstack/react-query";
import api from "../../index/admin/api";
import silentApi from "../../index/admin/silent";
import { type QueueEntry, type SubmissionData } from "@/shared/types/onboarding";
import { type ApiResponse } from "@/shared/types/resource";

const ADMIN_ONBOARDING_QUEUE_KEY = ["admin-onboarding", "queue"];

const buildQueueQuery = (params: Record<string, unknown> = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      if (Array.isArray(value)) {
        value.forEach((entry) => searchParams.append(`${key}[]`, String(entry)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const buildQueryParams = ({
  target,
  tenantId,
  userId,
}: {
  target: string;
  tenantId?: string | number | null;
  userId?: string | number | null;
}) => {
  if (!target) {
    throw new Error("Target is required to fetch onboarding submissions.");
  }

  const params = new URLSearchParams({ target });

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

export const fetchAdminOnboardingSubmission = async ({
  target,
  tenantId,
  userId,
  step,
}: {
  target: string;
  tenantId?: string | number | null;
  userId?: string | number | null;
  step: string;
}): Promise<{ submission: SubmissionData | null; meta: Record<string, unknown> }> => {
  if (!step) {
    throw new Error("Step is required to fetch onboarding submissions.");
  }

  const queryString = buildQueryParams({
    target,
    tenantId: tenantId ?? null,
    userId: userId ?? null,
  });
  const response: ApiResponse<SubmissionData> & { meta?: Record<string, unknown> } =
    await silentApi("GET", `/business/onboarding/${step}/review?${queryString}`);

  return {
    submission: response?.data ?? null,
    meta: response?.meta ?? {},
  };
};

const submissionQueryKey = (
  target: string,
  tenantId: string | number | null,
  userId: string | number | null,
  step: string | null
) => [
  "admin-onboarding",
  target,
  target === "tenant" ? (tenantId ?? null) : null,
  target === "tenant" ? null : (userId ?? null),
  step ?? null,
];

export const adminSubmissionListKey = (
  target: string,
  tenantId: string | number | null,
  userId: string | number | null
) => [
  "admin-onboarding",
  target,
  target === "tenant" ? (tenantId ?? null) : null,
  target === "tenant" ? null : (userId ?? null),
];

export const fetchAdminOnboardingQueue = async (
  params: Record<string, unknown> = {}
): Promise<QueueEntry[]> => {
  const query = buildQueueQuery(params);
  const response: ApiResponse<QueueEntry[]> = await silentApi(
    "GET",
    `/business/onboarding/review-queue${query}`
  );

  return response?.data ?? [];
};

export const useAdminOnboardingQueue = (
  params?: Record<string, unknown>,
  options: Omit<UseQueryOptions<QueueEntry[]>, "queryKey" | "queryFn"> = {}
) => {
  const resolvedParams = params ?? {};

  return useQuery({
    queryKey: [...ADMIN_ONBOARDING_QUEUE_KEY, resolvedParams],
    queryFn: () => fetchAdminOnboardingQueue(resolvedParams),
    staleTime: 30_000,
    ...options,
  });
};

export const useAdminOnboardingSubmission = (
  args: {
    target: string;
    tenantId?: string | number | null;
    userId?: string | number | null;
    step: string;
  } | null,
  options: Omit<
    UseQueryOptions<{ submission: SubmissionData | null; meta: Record<string, unknown> }>,
    "queryKey" | "queryFn"
  > = {}
) => {
  const target = args?.target ?? "";
  const tenantId = args?.tenantId ?? null;
  const userId = args?.userId ?? null;
  const step = args?.step ?? "";

  return useQuery({
    queryKey: submissionQueryKey(target, tenantId, userId, step),
    queryFn: () =>
      fetchAdminOnboardingSubmission({
        target,
        tenantId,
        userId,
        step,
      }),
    enabled: Boolean(args && step && target && (tenantId || userId)),
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
}: {
  target: string;
  tenantId?: string | number | null;
  userId?: string | number | null;
  step: string;
  status: string;
  message?: string;
  meta?: Record<string, unknown>;
}): Promise<SubmissionData | null> => {
  const payload: Record<string, unknown> = {
    target,
    status,
  };

  if (target === "tenant") {
    payload["tenant_id"] = tenantId;
  } else {
    payload["user_id"] = userId;
  }

  if (message) {
    payload["message"] = message;
  }

  if (meta) {
    payload["meta"] = meta;
  }

  const response: ApiResponse<SubmissionData> = await api(
    "PATCH",
    `/business/onboarding/${step}/status`,
    payload
  );

  return response?.data ?? null;
};

export const useAdminUpdateOnboardingStatus = (
  options: Omit<
    UseMutationOptions<
      SubmissionData | null,
      Error,
      {
        target: string;
        tenantId?: string | number | null;
        userId?: string | number | null;
        step: string;
        status: string;
        message?: string;
        meta?: Record<string, unknown>;
      }
    >,
    "mutationFn"
  > = {}
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStatus,
    ...options,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: submissionQueryKey(
          variables.target,
          variables.tenantId ?? null,
          variables.userId ?? null,
          variables.step
        ),
      });

      queryClient.invalidateQueries({
        queryKey: adminSubmissionListKey(
          variables.target,
          variables.tenantId ?? null,
          variables.userId ?? null
        ),
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ADMIN_ONBOARDING_QUEUE_KEY,
        exact: false,
      });

      if (options.onSuccess) {
        (options.onSuccess as unknown)(data, variables, context);
      }
    },
  });
};
