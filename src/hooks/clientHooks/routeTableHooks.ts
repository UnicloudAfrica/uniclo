import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

interface RouteTableParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

interface RouteTablePayload {
  [key: string]: unknown;
}

const buildQueryString = (params: Record<string, string | undefined>) => {
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
}: RouteTableParams) => {
  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/route-tables${queryString ? `?${queryString}` : ""}`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch route tables");
  }
  return res.data;
};

const createClientRouteTable = async (payload: RouteTablePayload) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/route-tables", payload);
  if (!res) {
    throw new Error("Failed to create route table");
  }
  return res;
};

const createClientRouteTableAssociation = async (payload: RouteTablePayload) => {
  const res = await clientApi<{ data: unknown }>(
    "POST",
    "/business/route-table-associations",
    payload
  );
  if (!res) {
    throw new Error("Failed to create route table association");
  }
  return res;
};

const createClientRoute = async (payload: RouteTablePayload) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/routes", payload);
  if (!res) {
    throw new Error("Failed to create route");
  }
  return res;
};

const deleteClientRoute = async (payload: RouteTablePayload) => {
  const res = await clientApi<{ data: unknown }>("DELETE", "/business/routes", payload);
  if (!res) {
    throw new Error("Failed to delete route");
  }
  return res;
};

export const useFetchClientRouteTables = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) =>
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useCreateClientRouteTableAssociation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRouteTableAssociation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useCreateClientRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientRoute,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const useDeleteClientRoute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientRoute,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientRouteTables", { projectId: variables.project_id }],
      });
    },
    onError: () => {
      // Error handling
    },
  });
};

export const syncClientRouteTablesFromProvider = async ({
  project_id,
  region,
}: {
  project_id: string;
  region: string;
}) => fetchClientRouteTables({ project_id, region, refresh: true });
