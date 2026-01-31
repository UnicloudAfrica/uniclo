import { useMutation, useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

type QueryParams = Record<string, string | boolean | number | undefined | null>;

const buildQueryString = (params: QueryParams = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  return search.toString();
};

interface IgwParams {
  project_id?: string;
  region?: string;
  refresh?: boolean;
}

interface IgwPayload {
  project_id?: string;
  region?: string;
  [key: string]: unknown;
}

const fetchClientIgws = async ({ project_id, region, refresh = false }: IgwParams) => {
  // Validate required parameters before making API call
  if (!project_id || !region) {
    return [];
  }

  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch internet gateways");
  }

  return res.data;
};

const createClientIgw = async (payload: IgwPayload) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/internet-gateways", payload);
  if (!res) {
    throw new Error("Failed to create internet gateway");
  }
  return res;
};

const deleteClientIgw = async ({ id, payload }: { id: string | number; payload: IgwPayload }) => {
  const res = await clientApi<{ data: unknown }>(
    "DELETE",
    `/business/internet-gateways/${id}`,
    payload
  );
  if (!res?.data) {
    throw new Error("Failed to delete internet gateway");
  }
  return res.data;
};

const attachClientIgw = async (payload: IgwPayload) => {
  const res = await clientApi<{ data: unknown }>(
    "POST",
    "/business/internet-gateway-attachments",
    payload
  );
  if (!res?.data) {
    throw new Error("Failed to attach internet gateway");
  }
  return res.data;
};

const detachClientIgw = async (payload: IgwPayload) => {
  const res = await clientApi<{ data: unknown }>(
    "DELETE",
    "/business/internet-gateway-attachments",
    payload
  );
  if (!res?.data) {
    throw new Error("Failed to detach internet gateway");
  }
  return res.data;
};

export const useFetchClientIgws = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) =>
  useQuery({
    queryKey: ["clientIgws", { projectId, region }],
    queryFn: () => fetchClientIgws({ project_id: projectId, region }),
    // Only enable if both projectId and region are non-empty strings
    enabled: !!projectId?.trim?.() && !!region?.trim?.(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });

export const useCreateClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientIgw,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id }],
      });
      if (variables?.region) {
        queryClient.invalidateQueries({
          queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
        });
      }
    },
  });
};

export const useDeleteClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientIgw,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.payload.project_id }],
      });
      if (variables?.payload?.region) {
        queryClient.invalidateQueries({
          queryKey: [
            "clientIgws",
            {
              projectId: variables.payload.project_id,
              region: variables.payload.region,
            },
          ],
        });
      }
    },
  });
};

export const useAttachClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachClientIgw,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
      });
    },
  });
};

export const useDetachClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachClientIgw,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
      });
    },
  });
};

export const syncClientIgwsFromProvider = async ({ project_id, region }: IgwParams) =>
  fetchClientIgws({ project_id, region, refresh: true });
