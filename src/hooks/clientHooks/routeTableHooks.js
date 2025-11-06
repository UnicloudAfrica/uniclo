import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, value);
    }
  });
  return search.toString();
};

const fetchClientRouteTables = async ({
  project_id,
  region,
  refresh = false,
}) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi(
    "GET",
    `/business/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch route tables");
  }
  return res.data;
};

const createClientRouteTable = async (payload) => {
  const res = await clientApi("POST", "/business/route-tables", payload);
  if (!res) {
    throw new Error("Failed to create route table");
  }
  return res;
};

const createClientRouteTableAssociation = async (payload) => {
  const res = await clientApi(
    "POST",
    "/business/route-table-associations",
    payload
  );
  if (!res) {
    throw new Error("Failed to create route table association");
  }
  return res;
};

const createClientRoute = async (payload) => {
  const res = await clientApi("POST", "/business/routes", payload);
  if (!res) {
    throw new Error("Failed to create route");
  }
  return res;
};

const deleteClientRoute = async (payload) => {
  const res = await clientApi("DELETE", "/business/routes", payload);
  if (!res) {
    throw new Error("Failed to delete route");
  }
  return res;
};

export const useFetchClientRouteTables = (projectId, region, options = {}) =>
  useQuery({
    queryKey: ["clientRouteTables", { projectId, region }],
    queryFn: () => fetchClientRouteTables({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateClientRouteTable = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRouteTable,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating route table:", error);
    },
  });
};

export const useCreateClientRouteTableAssociation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRouteTableAssociation,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating route table association:", error);
    },
  });
};

export const useCreateClientRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRoute,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error creating route:", error);
    },
  });
};

export const useDeleteClientRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientRoute,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting route:", error);
    },
  });
};

export const syncClientRouteTablesFromProvider = async ({
  project_id,
  region,
}) => fetchClientRouteTables({ project_id, region, refresh: true });
