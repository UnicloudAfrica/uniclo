import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchRouteTables = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch route tables");
  return res.data;
};

const createRouteTableAssociation = async (associationData) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/route-table-associations",
    associationData
  );
  if (!res) throw new Error("Failed to create route table association");
  return res;
};

export const useFetchRouteTables = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["routeTables", { projectId, region }],
    queryFn: () => fetchRouteTables({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateRouteTableAssociation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRouteTableAssociation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["routeTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating route table association:", error);
    },
  });
};
