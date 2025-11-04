import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../index/admin/api";
import silentApi from "../../index/admin/silent";

const ADMIN_ONBOARDING_QUEUE_KEY = ["admin-onboarding", "queue"];

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

export const fetchAdminOnboardingSubmission = async ({
  target,
  tenantId,
  userId,
  step,
}) => {
  if (!step) {
    throw new Error("Step is required to fetch onboarding submissions.");
  }

  const queryString = buildQueryParams({ target, tenantId, userId });
  const response = await silentApi(
    "GET",
    `/business/onboarding/${step}/review?${queryString}`
  );

  return {
    submission: response?.data ?? null,
    meta: response?.meta ?? {},
  };
};

const submissionQueryKey = (target, tenantId, userId, step) => [
  "admin-onboarding",
  target,
  target === "tenant" ? tenantId ?? null : null,
  target === "tenant" ? null : userId ?? null,
  step ?? null,
];

export const adminSubmissionListKey = (target, tenantId, userId) => [
  "admin-onboarding",
  target,
  target === "tenant" ? tenantId ?? null : null,
  target === "tenant" ? null : userId ?? null,
];

export const fetchAdminOnboardingQueue = async (params = {}) => {
  const query = buildQueueQuery(params);
  const response = await silentApi(
    "GET",
    `/business/onboarding/review-queue${query}`
  );

  return response?.data ?? [];
};

export const useAdminOnboardingQueue = (params, options = {}) => {
  const resolvedParams = params ?? {};

  return useQuery({
    queryKey: [...ADMIN_ONBOARDING_QUEUE_KEY, resolvedParams],
    queryFn: () => fetchAdminOnboardingQueue(resolvedParams),
    staleTime: 30_000,
    ...options,
  });
};

export const useAdminOnboardingSubmission = (
  { target, tenantId, userId, step },
  options = {}
) => {
  return useQuery({
    queryKey: submissionQueryKey(target, tenantId, userId, step),
    queryFn: () => fetchAdminOnboardingSubmission({ target, tenantId, userId, step }),
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

export const useAdminUpdateOnboardingStatus = () => {
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
        queryKey: adminSubmissionListKey(
          variables.target,
          variables.tenantId,
          variables.userId
        ),
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: ADMIN_ONBOARDING_QUEUE_KEY,
        exact: false,
      });
    },
  });
};
