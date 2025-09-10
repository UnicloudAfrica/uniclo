// src/hooks/adminHooks/internetGatewayHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchInternetGateways = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/internet-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch internet gateways");
  return res.data;
};

const createInternetGateway = async (internetGatewayData) => {
  const res = await tenantApi(
    "POST",
    "/admin/internet-gateways",
    internetGatewayData
  );
  if (!res.data) throw new Error("Failed to create internet gateway");
  return res.data;
};

const deleteInternetGateway = async (deleteData) => {
  const res = await tenantApi("DELETE", "/admin/internet-gateways", deleteData);
  if (!res.data) throw new Error("Failed to delete internet gateway");
  return res.data;
};

const attachInternetGateway = async (attachData) => {
  const res = await tenantApi(
    "POST",
    "/admin/internet-gateways/attach",
    attachData
  );
  if (!res.data) throw new Error("Failed to attach internet gateway");
  return res.data;
};

const detachInternetGateway = async (detachData) => {
  const res = await tenantApi(
    "POST",
    "/admin/internet-gateways/detach",
    detachData
  );
  if (!res.data) throw new Error("Failed to detach internet gateway");
  return res.data;
};

export const useFetchTenantInternetGateways = (
  projectId,
  region,
  options = {}
) => {
  return useQuery({
    queryKey: ["internetGateways", { projectId, region }],
    queryFn: () => fetchInternetGateways({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantInternetGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInternetGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internetGateways"] });
    },
    onError: (error) => {
      console.error("Error creating internet gateway:", error);
    },
  });
};

export const useDeleteTenantInternetGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInternetGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internetGateways"] });
    },
    onError: (error) => {
      console.error("Error deleting internet gateway:", error);
    },
  });
};

export const useAttachTenantInternetGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachInternetGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internetGateways"] });
    },
    onError: (error) => {
      console.error("Error attaching internet gateway:", error);
    },
  });
};

export const useDetachTenantInternetGateway = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachInternetGateway,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internetGateways"] });
    },
    onError: (error) => {
      console.error("Error detaching internet gateway:", error);
    },
  });
};
