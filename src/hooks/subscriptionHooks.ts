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

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  [key: string]: unknown;
}

export interface Subscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end?: string;
  [key: string]: unknown;
}

interface ListResponse<T> {
  data: T[];
  total?: number;
}

// ═══════════════════════════════════════════════════════════════════
// SUBSCRIPTION PLANS (Admin)
// ═══════════════════════════════════════════════════════════════════

// Fetch all subscription plans
export const useFetchSubscriptionPlans = (
  params: QueryParams = {},
  options: Record<string, unknown> = {}
) => {
  return useQuery<ListResponse<SubscriptionPlan>>({
    queryKey: ["subscriptionPlans", params],
    queryFn: async () => {
      const res = await silentApi<ListResponse<SubscriptionPlan>>(
        "GET",
        "/admin/v1/subscription-plans",
        params
      );
      // Handle both { data: [...] } and direct [...] if wrapped by silentApi
      return res;
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
  return useQuery<SubscriptionPlan>({
    queryKey: ["subscriptionPlan", id],
    queryFn: async () => {
      const res = (await silentApi("GET", `/admin/v1/subscription-plans/${id}`)) as {
        data?: SubscriptionPlan;
      } & SubscriptionPlan;
      return (res.data ?? res) as SubscriptionPlan;
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
      const res = await api<SubscriptionPlan>("POST", "/admin/v1/subscription-plans", data);
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
      const res = await api<SubscriptionPlan>("PUT", `/admin/v1/subscription-plans/${id}`, data);
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
      const res = await api<{ data: unknown }>("DELETE", `/admin/v1/subscription-plans/${id}`);
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
  return useQuery<ListResponse<Subscription>>({
    queryKey: ["subscriptions", params],
    queryFn: async () => {
      const res = await silentApi<ListResponse<Subscription>>(
        "GET",
        "/admin/v1/subscriptions",
        params
      );
      return res;
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
  return useQuery<Subscription>({
    queryKey: ["subscription", id],
    queryFn: async () => {
      const res = (await silentApi("GET", `/admin/v1/subscriptions/${id}`)) as {
        data?: Subscription;
      } & Subscription;
      return (res.data ?? res) as Subscription;
    },
    enabled: !!id,
    ...options,
  });
};

// Fetch subscription statistics
export const useFetchSubscriptionStats = (options: Record<string, unknown> = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subscriptionStats"],
    queryFn: async () => {
      const res = (await silentApi("GET", "/admin/v1/subscriptions-statistics")) as {
        data?: Record<string, unknown>;
      } & Record<string, unknown>;
      return (res.data ?? res) as Record<string, unknown>;
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
      const res = await api<Subscription>("POST", "/admin/v1/subscriptions", data);
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
      const res = await api<Subscription>("PUT", `/admin/v1/subscriptions/${id}`, data);
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
      const res = await api<{ data: unknown }>("POST", `/admin/v1/subscriptions/${id}/cancel`, {
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
      const res = await api<{ data: Subscription }>(
        "POST",
        `/admin/v1/subscriptions/${id}/change-plan`,
        {
          plan_id,
          prorate,
        }
      );
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
      const res = await api<{ data: unknown }>("POST", `/admin/v1/subscriptions/${id}/renew`);
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

const fetchSubs = async (): Promise<Subscription> => {
  const res = (await silentApi("GET", "/business/subscription")) as {
    data?: Subscription;
  } & Subscription;
  return (res.data ?? res) as Subscription;
};

export const useFetchSubs = (options: Record<string, unknown> = {}) => {
  return useQuery<Subscription>({
    queryKey: ["subs"],
    queryFn: fetchSubs,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
