import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi, { adminSilentApi } from "../../index/admin/api";

const fetchSubnets = async ({ project_id, region, refresh = false }: any) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApi("GET", `/subnets${queryString ? `?${queryString}` : ""}`);
  if (!res.data) throw new Error("Failed to fetch subnets");
  return res.data;
};

const fetchSubnetById = async (id: any) => {
  const res = await adminSilentApi("GET", `/subnets/${id}`);
  if (!res.data) throw new Error(`Failed to fetch subnet with ID ${id}`);
  return res.data;
};

const createSubnet = async (subnetData: any) => {
  const res = await adminApi("POST", "/subnets", subnetData);
  if (!res) throw new Error("Failed to create subnet");
  return res;
};

const deleteSubnet = async ({ id, payload }: any) => {
  const res = await adminApi("DELETE", `/subnets/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete subnet with ID ${id}`);
  return res.data;
};

export const useFetchSubnets = (projectId: any, region: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subnets", { projectId, region }],
    queryFn: () => fetchSubnets({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchSubnetById = (id: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["subnet", id],
    queryFn: () => fetchSubnetById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubnet,
    onSuccess: (data: any, variables: any) => {
      // Invalidate based on the project_id from the creation data
      queryClient.invalidateQueries({
        queryKey: ["subnets", { projectId: variables.project_id }],
      });
    },
    onError: (error: any) => {
      console.error("Error creating subnet:", error);
    },
  });
};

export const useDeleteSubnet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubnet,
    onSuccess: (data: any, variables: any) => {
      // Invalidate based on the project_id from the delete payload
      queryClient.invalidateQueries({
        queryKey: ["subnets", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error: any) => {
      console.error("Error deleting subnet:", error);
    },
  });
};

export const syncSubnetsFromProvider = async ({ project_id, region }: any) => {
  return fetchSubnets({ project_id, region, refresh: true });
};
