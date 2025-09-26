import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchIgws = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch Internet Gateways");
  return res.data;
};

const createIgw = async (igwData) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/internet-gateways",
    igwData
  );
  if (!res) throw new Error("Failed to create Internet Gateway");
  return res;
};

const deleteIgw = async ({ id, payload }) => {
  const res = await apiAdminforUser(
    "DELETE",
    `/business/internet-gateways/${id}`,
    payload
  );
  if (!res.data)
    throw new Error(`Failed to delete Internet Gateway with ID ${id}`);
  return res.data;
};

export const useFetchIgws = (projectId, region, options = {}) => {
  return useQuery({
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
    onSuccess: (data, variables) => {
      // Invalidate based on the project_id from the creation data
      queryClient.invalidateQueries({
        queryKey: ["igws", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating Internet Gateway:", error);
    },
  });
};

export const useDeleteIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteIgw,
    onSuccess: (data, variables) => {
      // Invalidate based on the project_id from the delete payload
      queryClient.invalidateQueries({
        queryKey: ["igws", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting Internet Gateway:", error);
    },
  });
};
