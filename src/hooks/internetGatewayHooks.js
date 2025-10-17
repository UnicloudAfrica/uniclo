// src/hooks/internetGatewayHooks.js (tenant dashboard)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";

const fetchInternetGateways = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch internet gateways");
  return res.data;
};

const createInternetGateway = async (internetGatewayData) => {
  const res = await api(
    "POST",
    "/business/internet-gateways",
    internetGatewayData
  );
  if (!res.data) throw new Error("Failed to create internet gateway");
  return res.data;
};

const deleteInternetGateway = async (arg) => {
  // Support multiple call shapes:
  // - deleteInternetGateway({ id, payload })
  // - deleteInternetGateway(id)
  // - deleteInternetGateway({ internet_gateway_id, ...payload })
  let id = arg;
  let payload;
  if (typeof arg === "object" && arg !== null) {
    if ("id" in arg) {
      id = arg.id;
      payload = arg.payload || undefined;
    } else if ("internet_gateway_id" in arg) {
      id = arg.internet_gateway_id;
      const { internet_gateway_id, ...rest } = arg;
      payload = rest;
    }
  }
  const res = await api("DELETE", `/business/internet-gateways/${id}`, payload);
  if (!res.data) throw new Error("Failed to delete internet gateway");
  return res.data;
};

const attachInternetGateway = async (attachData) => {
  // Use shared attachment endpoint
  const res = await api(
    "POST",
    "/business/internet-gateway-attachments",
    attachData
  );
  if (!res.data) throw new Error("Failed to attach internet gateway");
  return res.data;
};

const detachInternetGateway = async (detachData) => {
  // Shared API supports id-less DELETE with body
  const res = await api(
    "DELETE",
    "/business/internet-gateway-attachments",
    detachData
  );
  if (!res.data) throw new Error("Failed to detach internet gateway");
  return res.data;
};

const syncInternetGateways = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to sync internet gateways");
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

export const useSyncTenantInternetGateways = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncInternetGateways,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["internetGateways"] });
    },
    onError: (error) => {
      console.error("Error syncing internet gateways:", error);
    },
  });
};
