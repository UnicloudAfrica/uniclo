// src/hooks/routeTable.ts (tenant dashboard)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
import logger from "../utils/logger";

const fetchRouteTables = async ({
  project_id,
  region,
}: {
  project_id?: string;
  region?: string;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch route tables");
  return res.data;
};

const createRouteTable = async (payload: Record<string, any>) => {
  const res = await api("POST", "/business/route-tables", payload);
  if (!res.data) throw new Error("Failed to create route table");
  return res.data;
};

const deleteRouteTable = async ({
  id,
  payload,
}: {
  id: string | number;
  payload?: Record<string, any>;
}) => {
  const res = await api("DELETE", `/business/route-tables/${id}`, payload);
  if (!res.data) throw new Error("Failed to delete route table");
  return res.data;
};

const createRoute = async (routeData: Record<string, any>) => {
  const res = await api("POST", "/business/routes", routeData);
  if (!res.data) throw new Error("Failed to create route");
  return res.data;
};

const deleteRoute = async (deleteRouteData: Record<string, any>) => {
  // Backend supports id-less delete with body on /business/routes (destroy optional $id)
  const res = await api("DELETE", "/business/routes", deleteRouteData);
  if (!res.data) throw new Error("Failed to delete route");
  return res.data;
};

const associateRouteTable = async (associationData: Record<string, any>) => {
  const res = await api("POST", "/business/route-table-associations", associationData);
  if (!res.data) throw new Error("Failed to associate route table");
  return res.data;
};

const syncRouteTables = async ({
  project_id,
  region,
}: {
  project_id?: string;
  region?: string;
}) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  params.append("refresh", "1");

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to sync route tables");
  return res.data;
};

export const useFetchTenantRouteTables = (
  projectId?: string,
  region?: string,
  options: Record<string, any> = {}
) => {
  return useQuery({
    queryKey: ["routeTables", { projectId, region }],
    queryFn: () => fetchRouteTables({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRouteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      logger.error("Error creating route table:", error);
    },
  });
};

export const useDeleteTenantRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRouteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      logger.error("Error deleting route table:", error);
    },
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
      logger.error("Error creating route:", error);
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
      logger.error("Error deleting route:", error);
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
      logger.error("Error associating route table:", error);
    },
  });
};

export const useSyncTenantRouteTables = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncRouteTables,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routeTables"] });
    },
    onError: (error) => {
      logger.error("Error syncing route tables:", error);
    },
  });
};
