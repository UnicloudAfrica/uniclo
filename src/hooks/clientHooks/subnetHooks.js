// src/hooks/clientHooks/subnetHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const fetchClientSubnets = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await clientSilentApi(
    "GET",
    `/business/subnets${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch subnets");
  return res.data;
};

const fetchSubnetById = async (id) => {
  const res = await clientSilentApi("GET", `/business/subnets/${id}`);
  if (!res.data) throw new Error(`Failed to fetch subnet with ID ${id}`);
  return res.data;
};

const createClientSubnet = async (subnetData) => {
  const res = await clientApi("POST", "/business/subnets", subnetData);
  if (!res.data) throw new Error("Failed to create subnet");
  return res.data;
};

const updateClientSubnet = async ({ id, subnetData }) => {
  const res = await clientApi("PATCH", `/business/subnets/${id}`, subnetData);
  if (!res.data) throw new Error(`Failed to update subnet with ID ${id}`);
  return res.data;
};

const deleteClientSubnet = async ({ id, payload }) => {
  const res = await clientApi("DELETE", `/business/subnets/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete subnet with ID ${id}`);
  return res.data;
};

export const useFetchClientSubnets = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["clientSubnets", { projectId, region }],
    queryFn: () => fetchClientSubnets({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchClientSubnetById = (id, options = {}) => {
  return useQuery({
    queryKey: ["clientSubnet", id],
    queryFn: () => fetchSubnetById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientSubnets", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating subnet:", error);
    },
  });
};

export const useUpdateClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateClientSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientSubnets"] });
      queryClient.invalidateQueries({
        queryKey: ["clientSubnet", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating subnet:", error);
    },
  });
};

export const useDeleteClientSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientSubnets",
          { projectId: variables.payload.project_id },
        ],
      });
    },
    onError: (error) => {
      console.error("Error deleting subnet:", error);
    },
  });
};

export const syncClientSubnetsFromProvider = async ({
  project_id,
  region,
}) => fetchClientSubnets({ project_id, region, refresh: true });
