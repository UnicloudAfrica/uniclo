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

const createRouteTable = async (payload) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/route-tables",
    payload
  );
  if (!res) throw new Error("Failed to create route table");
  return res;
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

const createRoute = async (payload) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/routes",
    payload
  );
  if (!res) throw new Error("Failed to create route");
  return res;
};

const deleteRoute = async (payload) => {
  const res = await apiAdminforUser(
    "DELETE",
    "/business/routes",
    payload
  );
  if (!res) throw new Error("Failed to delete route");
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

export const useCreateRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRouteTable,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["routeTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating route table:", error);
    },
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

export const useCreateRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoute,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routeTables", { projectId: variables.project_id }] });
    },
  });
};

export const useDeleteRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoute,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["routeTables", { projectId: variables.project_id }] });
    },
  });
};
