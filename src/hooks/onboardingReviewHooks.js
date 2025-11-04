import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";

const ONBOARDING_QUEUE_KEY = ["onboarding-review", "queue"];

const buildQueueQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0)
    ) {
      if (Array.isArray(value)) {
        value.forEach((entry) => searchParams.append(`${key}[]`, entry));
      } else {
        searchParams.set(key, value);
      }
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

const buildQueryParams = ({ target, tenantId, userId }) => {
  if (!target) {
    throw new Error("Target is required to fetch onboarding submissions.");
  }

  const params = new URLSearchParams({ target });

  if (target === "tenant") {
    if (!tenantId) {
      throw new Error("tenantId is required when target is tenant.");
    }
    params.set("tenant_id", tenantId);
  } else {
    if (!userId) {
      throw new Error("userId is required when target is client or crm.");
    }
    params.set("user_id", userId);
  }

  return params.toString();
};

export const fetchOnboardingSubmission = async ({
  target,
  tenantId,
  userId,
  step,
}) => {
  if (!step) {
    throw new Error("Step is required to fetch onboarding submissions.");
  }

  const queryString = buildQueryParams({ target, tenantId, userId });
  const response = await api(
    "GET",
    `/business/onboarding/${step}/review?${queryString}`
  );

  return {
    submission: response?.data ?? null,
    meta: response?.meta ?? {},
  };
};

const submissionQueryKey = (target, tenantId, userId, step) => [
  "onboarding-review",
  target,
  target === "tenant" ? tenantId ?? null : null,
  target === "tenant" ? null : userId ?? null,
  step ?? null,
];

export const onboardingSubmissionListKey = (target, tenantId, userId) => [
  "onboarding-review",
  target,
  target === "tenant" ? tenantId ?? null : null,
  target === "tenant" ? null : userId ?? null,
];

export const useOnboardingSubmission = (
  { target, tenantId, userId, step },
  options = {}
) => {
  return useQuery({
    queryKey: submissionQueryKey(target, tenantId, userId, step),
    queryFn: () =>
      fetchOnboardingSubmission({ target, tenantId, userId, step }),
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
}) => {
  const payload = {
    target,
    status,
  };

  if (target === "tenant") {
    payload.tenant_id = tenantId;
  } else {
    payload.user_id = userId;
  }

  if (message) {
    payload.message = message;
  }

  if (meta) {
    payload.meta = meta;
  }

  const response = await api(
    "PATCH",
    `/business/onboarding/${step}/status`,
    payload
  );

  return response?.data ?? null;
};

export const useUpdateOnboardingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStatus,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(
        submissionQueryKey(
          variables.target,
          variables.tenantId,
          variables.userId,
          variables.step
        )
      );

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

export const fetchOnboardingReviewQueue = async (params = {}) => {
  const query = buildQueueQuery(params ?? {});
  const response = await api(
    "GET",
    `/business/onboarding/review-queue${query}`
  );

  return response?.data ?? [];
};

export const useOnboardingReviewQueue = (params, options = {}) => {
  const resolvedParams = params ?? {};

  return useQuery({
    queryKey: [...ONBOARDING_QUEUE_KEY, resolvedParams],
    queryFn: () => fetchOnboardingReviewQueue(resolvedParams),
    staleTime: 30_000,
    ...options,
  });
};
