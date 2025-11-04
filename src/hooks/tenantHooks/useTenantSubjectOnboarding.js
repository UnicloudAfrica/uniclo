import { useQuery } from "@tanstack/react-query";
import api from "../../index/api";

const buildQuery = (target, subjectId) => {
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

const fetchTenantSubjectOnboarding = async ({ target, subjectId, step }) => {
  if (!target || !subjectId || !step) {
    return null;
  }

  const query = buildQuery(target, subjectId);
  const response = await api(
    "GET",
    `/business/onboarding/${step}/review?${query}`
  );

  return response?.data ?? null;
};

export const useTenantSubjectOnboarding = (
  { target, subjectId, step },
  options = {}
) =>
  useQuery({
    queryKey: ["tenant-onboarding", target, subjectId, step],
    queryFn: () => fetchTenantSubjectOnboarding({ target, subjectId, step }),
    enabled: Boolean(target && subjectId && step && (options.enabled ?? true)),
    ...options,
  });
