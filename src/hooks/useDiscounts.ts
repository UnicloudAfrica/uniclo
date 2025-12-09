// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import adminApi from "../index/admin/api";

export interface Discount {
  id: number;
  applies_to_type: "user" | "tenant";
  applies_to_id: number;
  discount_type: "percent" | "fixed_amount";
  value: number;
  scope: "all" | "product_ids" | "category";
  product_ids: number[] | null;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  granted_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiscountFormData {
  discount_type: "percent" | "fixed_amount";
  value: number;
  scope?: "all" | "product_ids" | "category";
  product_ids?: number[];
  starts_at?: string | null;
  ends_at?: string | null;
  max_uses?: number | null;
  notes?: string | null;
}

interface DiscountResponse {
  data: Discount | null;
  has_discount: boolean;
}

// Fetch discount for a user or tenant
export const useEntityDiscount = (entityType: "user" | "tenant", entityId: string | number) => {
  return useQuery<DiscountResponse>({
    queryKey: ["discount", entityType, entityId],
    queryFn: async () => {
      const response = await adminApi.get(`/discounts/${entityType}s/${entityId}`);
      return response.data;
    },
    enabled: !!entityId,
  });
};

// Assign discount to a user or tenant
export const useAssignDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      data,
    }: {
      entityType: "user" | "tenant";
      entityId: string | number;
      data: DiscountFormData;
    }) => {
      const response = await adminApi.post(`/discounts/${entityType}s/${entityId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["discount", variables.entityType, variables.entityId],
      });
    },
  });
};

// Update discount for a user or tenant
export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
      data,
    }: {
      entityType: "user" | "tenant";
      entityId: string | number;
      data: Partial<DiscountFormData> & { is_active?: boolean };
    }) => {
      const response = await adminApi.put(`/discounts/${entityType}s/${entityId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["discount", variables.entityType, variables.entityId],
      });
    },
  });
};

// Remove discount from a user or tenant
export const useRemoveDiscount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entityType,
      entityId,
    }: {
      entityType: "user" | "tenant";
      entityId: string | number;
    }) => {
      const response = await adminApi.delete(`/discounts/${entityType}s/${entityId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["discount", variables.entityType, variables.entityId],
      });
    },
  });
};

// Utility function to format discount for display
export const formatDiscount = (discount: Discount): string => {
  if (discount.discount_type === "percent") {
    return `${discount.value}% OFF`;
  }
  return `$${discount.value.toFixed(2)} OFF`;
};

// Utility function to check if discount is currently active
export const isDiscountActive = (discount: Discount): boolean => {
  if (!discount.is_active) return false;

  const now = new Date();

  if (discount.starts_at && new Date(discount.starts_at) > now) {
    return false;
  }

  if (discount.ends_at && new Date(discount.ends_at) < now) {
    return false;
  }

  if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
    return false;
  }

  return true;
};
