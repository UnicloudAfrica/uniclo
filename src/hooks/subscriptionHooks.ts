import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

type QueryParams = Record<string, string | number | boolean | null | undefined>;
type MutationPayload = Record<string, unknown>;

type IdPayload = {
  id: string;
  [key: string]: unknown;
};

type CancelSubscriptionPayload = {
  id: string;
  reason?: string;
  note?: string;
  immediately?: boolean;
};

type ChangeSubscriptionPlanPayload = {
  id: string;
  plan_id: string;
  prorate?: boolean;
};

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS (Admin)
// ═══════════════════════════════════════════════════════════════════

// Fetch all subscription plans
export const useFetchSubscriptionPlans = (
  params: QueryParams = {},
  options: Record<string, unknown> = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscriptionPlans", params],
    queryFn: async () => {
      const res = await silentApi("GET", "/admin/v1/subscription-plans", params);
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};

// Fetch single subscription plan
export const useFetchSubscriptionPlan = (
  id: string | null | undefined,
  options: Record<string, unknown> = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscriptionPlan", id],
    queryFn: async () => {
      const res = await silentApi("GET", `/admin/v1/subscription-plans/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Create subscription plan
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const res = await api("POST", "/admin/v1/subscription-plans", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
    },
  });
};

// Update subscription plan
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: IdPayload) => {
      const res = await api("PUT", `/admin/v1/subscription-plans/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlan", variables.id] });
    },
  });
};

// Delete subscription plan
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api("DELETE", `/admin/v1/subscription-plans/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptionPlans"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS (Admin)
// ═══════════════════════════════════════════════════════════════════

// Fetch all subscriptions
export const useFetchSubscriptions = (
  params: QueryParams = {},
  options: Record<string, unknown> = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscriptions", params],
    queryFn: async () => {
      const res = await silentApi("GET", "/admin/v1/subscriptions", params);
      return res.data;
    },
    staleTime: 1000 * 60 * 2,
    ...options,
  });
};

// Fetch single subscription
export const useFetchSubscription = (
  id: string | null | undefined,
  options: Record<string, unknown> = {}
) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscription", id],
    queryFn: async () => {
      const res = await silentApi("GET", `/admin/v1/subscriptions/${id}`);
      return res.data?.data || res.data;
    },
    enabled: !!id,
    ...options,
  });
};

// Fetch subscription statistics
export const useFetchSubscriptionStats = (options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscriptionStats"],
    queryFn: async () => {
      const res = await silentApi("GET", "/admin/v1/subscriptions-statistics");
      return res.data?.data || res.data;
    },
    staleTime: 1000 * 60 * 1,
    ...options,
  });
};

// Create subscription
export const useCreateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: MutationPayload) => {
      const res = await api("POST", "/admin/v1/subscriptions", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStats"] });
    },
  });
};

// Update subscription
export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: IdPayload) => {
      const res = await api("PUT", `/admin/v1/subscriptions/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", variables.id] });
    },
  });
};

// Cancel subscription
export const useCancelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason, note, immediately }: CancelSubscriptionPayload) => {
      const res = await api("POST", `/admin/v1/subscriptions/${id}/cancel`, {
        reason,
        note,
        immediately,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStats"] });
    },
  });
};

// Change subscription plan
export const useChangeSubscriptionPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, plan_id, prorate }: ChangeSubscriptionPlanPayload) => {
      const res = await api("POST", `/admin/v1/subscriptions/${id}/change-plan`, {
        plan_id,
        prorate,
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", variables.id] });
    },
  });
};

// Renew subscription manually
export const useRenewSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api("POST", `/admin/v1/subscriptions/${id}/renew`);
      return res.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["subscription", id] });
      queryClient.invalidateQueries({ queryKey: ["subscriptionStats"] });
    },
  });
};

// ═══════════════════════════════════════════════════════════════════
// LEGACY: Business subscription (existing)
// ═══════════════════════════════════════════════════════════════════

const fetchSubs = async () => {
  const res = await silentApi("GET", "/business/subscription");
  return res.data;
};

export const useFetchSubs = (options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subs"],
    queryFn: fetchSubs,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
