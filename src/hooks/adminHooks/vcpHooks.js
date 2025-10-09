import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchVpcs = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/vpcs${queryString ? `?${queryString}` : ""}`
  );
  if (!res) throw new Error("Failed to fetch VPCs");
  return res;
};

const fetchVpcById = async (id) => {
  const res = await adminSilentApiforUser("GET", `/business/vpcs/${id}`);
  if (!res.data) throw new Error(`Failed to fetch VPC with ID ${id}`);
  return res.data;
};

const createVpc = async (vpcData) => {
  const res = await apiAdminforUser("POST", "/business/vpcs", vpcData);
  if (!res) throw new Error("Failed to create VPC");
  return res;
};

const updateVpc = async ({ id, vpcData }) => {
  const res = await apiAdminforUser("PATCH", `/business/vpcs/${id}`, vpcData);
  if (!res.data) throw new Error(`Failed to update VPC with ID ${id}`);
  return res.data;
};

const deleteVpc = async (id) => {
  const res = await apiAdminforUser("DELETE", `/business/vpcs/${id}`);
  if (!res) throw new Error(`Failed to delete VPC with ID ${id}`);
  return res;
};

export const useFetchVpcs = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["vpcs", { projectId, region }],
    queryFn: () => fetchVpcs({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchVpcById = (id, options = {}) => {
  return useQuery({
    queryKey: ["vpc", id],
    queryFn: () => fetchVpcById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error) => {
      console.error("Error creating VPC:", error);
    },
  });
};

export const useUpdateVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateVpc,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["vpc", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating VPC:", error);
    },
  });
};

export const useDeleteVpc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVpc,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
    },
    onError: (error) => {
      console.error("Error deleting VPC:", error);
    },
  });
};

// --- Available CIDR suggestions for a VPC ---
const fetchAvailableCidrs = async ({ project_id, region, vpc_id, prefix_length = 24, limit = 8 }) => {
  const params = new URLSearchParams();
  params.append("project_id", project_id);
  params.append("region", region);
  params.append("vpc_id", vpc_id);
  if (prefix_length) params.append("prefix_length", String(prefix_length));
  if (limit) params.append("limit", String(limit));
  const res = await adminSilentApiforUser(
    "GET",
    `/business/vpcs/available-cidrs?${params.toString()}`
  );
  const suggestions = res?.data?.suggestions ?? res?.suggestions ?? [];
  return Array.isArray(suggestions) ? suggestions : [];
};

export const useFetchAvailableCidrs = (projectId, region, vpcId, prefixLength = 24, limit = 8, options = {}) => {
  return useQuery({
    queryKey: ["available-cidrs", { projectId, region, vpcId, prefixLength, limit }],
    queryFn: () => fetchAvailableCidrs({ project_id: projectId, region, vpc_id: vpcId, prefix_length: prefixLength, limit }),
    enabled: !!projectId && !!region && !!vpcId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};
