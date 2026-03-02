import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";
import logger from "../../utils/logger";

const fetchIgws = async ({ project_id, region, refresh = false }: any) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch Internet Gateways");
  return res.data;
};

const createIgw = async (igwData: any) => {
  const res = await apiAdminforUser("POST", "/business/internet-gateways", igwData);
  if (!res) throw new Error("Failed to create Internet Gateway");
  return res;
};

const deleteIgw = async ({ id, payload }: any) => {
  const res = await apiAdminforUser("DELETE", `/business/internet-gateways/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete Internet Gateway with ID ${id}`);
  return res.data;
};

export const useFetchIgws = (projectId: any, region: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["igws", { projectId, region }],
    queryFn: () => fetchIgws({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createIgw,
    onSuccess: (data: any, variables: any) => {
      // Invalidate based on the project_id from the creation data
      queryClient.invalidateQueries({
        queryKey: ["igws", { projectId: variables.project_id }],
      });
    },
    onError: (error: any) => {
      logger.error("Error creating Internet Gateway:", error);
    },
  });
};

export const useDeleteIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIgw,
    onSuccess: (data: any, variables: any) => {
      // Invalidate based on the project_id from the delete payload
      queryClient.invalidateQueries({
        queryKey: ["igws", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error: any) => {
      logger.error("Error deleting Internet Gateway:", error);
    },
  });
};

export const syncIgwsFromProvider = async ({ project_id, region }: any) => {
  return fetchIgws({ project_id, region, refresh: true });
};
