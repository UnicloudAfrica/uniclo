import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";

const fetchTenantSubnets = async ({ project_id, region, refresh = false }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await tenantSilentApi("GET", `/admin/subnets${queryString ? `?${queryString}` : ""}`);
  if (!res?.data) throw new Error("Failed to fetch subnets");
  return res.data;
};

const fetchTenantSubnetById = async (id) => {
  const res = await tenantSilentApi("GET", `/admin/subnets/${id}`);
  if (!res?.data) throw new Error(`Failed to fetch subnet with ID ${id}`);
  return res.data;
};

const createTenantSubnet = async (subnetData) => {
  const res = await tenantApi("POST", "/admin/subnets", subnetData);
  if (!res?.data) throw new Error("Failed to create subnet");
  return res.data;
};

const updateTenantSubnet = async ({ id, subnetData }) => {
  const res = await tenantApi("PATCH", `/admin/subnets/${id}`, subnetData);
  if (!res?.data) throw new Error(`Failed to update subnet with ID ${id}`);
  return res.data;
};

const deleteTenantSubnet = async ({ id, payload }) => {
  const res = await tenantApi("DELETE", `/admin/subnets/${id}`, payload);
  if (!res?.data) throw new Error(`Failed to delete subnet with ID ${id}`);
  return res.data;
};

export const useFetchTenantSubnets = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["tenantSubnets", { projectId, region }],
    queryFn: () => fetchTenantSubnets({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useFetchTenantSubnetById = (id, options = {}) =>
  useQuery({
    queryKey: ["tenantSubnet", id],
    queryFn: () => fetchTenantSubnetById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTenantSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantSubnets", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating subnet:", error);
    },
  });
};

export const useUpdateTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenantSubnets"] });
      queryClient.invalidateQueries({
        queryKey: ["tenantSubnet", variables.id],
      });
    },
    onError: (error) => {
      console.error("Error updating subnet:", error);
    },
  });
};

export const useDeleteTenantSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenantSubnet,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantSubnets", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting subnet:", error);
    },
  });
};

export const syncTenantSubnetsFromProvider = async ({ project_id, region }) =>
  fetchTenantSubnets({ project_id, region, refresh: true });
