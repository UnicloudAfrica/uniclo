// src/hooks/adminHooks/routeTableHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentTenantApi from "../index/tenant/silentTenant";
import tenantApi from "../index/tenant/tenantApi";

const fetchRouteTables = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentTenantApi(
    "GET",
    `/admin/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch route tables");
  return res.data;
};

const createRoute = async (routeData) => {
  const res = await tenantApi("POST", "/admin/route-tables/routes", routeData);
  if (!res.data) throw new Error("Failed to create route");
  return res.data;
};

const deleteRoute = async (deleteRouteData) => {
  const res = await tenantApi(
    "DELETE",
    "/admin/route-tables/routes",
    deleteRouteData
  );
  if (!res.data) throw new Error("Failed to delete route");
  return res.data;
};

const associateRouteTable = async (associationData) => {
  const res = await tenantApi(
    "POST",
    "/admin/route-tables/associate",
    associationData
  );
  if (!res.data) throw new Error("Failed to associate route table");
  return res.data;
};

export const useFetchTenantRouteTables = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["routeTables", { projectId, region }],
    queryFn: () => fetchRouteTables({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      console.error("Error creating route:", error);
    },
  });
};

export const useDeleteTenantRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      console.error("Error deleting route:", error);
    },
  });
};

export const useAssociateTenantRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: associateRouteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      console.error("Error associating route table:", error);
    },
  });
};
