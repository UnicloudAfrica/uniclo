import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchNetworkInterfgace = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/network-interfaces${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch network interfaces");
  return res.data;
};

const createNetworkInterface = async (payload) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/network-interfaces",
    payload
  );
  if (!res) throw new Error("Failed to create network interface");
  return res;
};

export const useFetchNetworkInterfaces = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["networkInterfaces", { projectId, region }],
    queryFn: () => fetchNetworkInterfgace({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateNetworkInterface = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNetworkInterface,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["networkInterfaces", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating network interface:", error);
    },
  });
};
