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

const fetchClientIgws = async ({ project_id, region, refresh = false }) => {
  // Validate required parameters before making API call
  if (!project_id || !region) {
    console.warn("fetchClientIgws: project_id and region are required");
    return [];
  }

  const queryString = buildQueryString({
    project_id,
    region,
    refresh: refresh ? "1" : undefined,
  });

  const res = await clientSilentApi(
    "GET",
    `/business/internet-gateways${queryString ? `?${queryString}` : ""}`
  );

  if (!res?.data) {
    throw new Error("Failed to fetch internet gateways");
  }

  return res.data;
};

const createClientIgw = async (payload) => {
  const res = await clientApi("POST", "/business/internet-gateways", payload);
  if (!res) {
    throw new Error("Failed to create internet gateway");
  }
  return res;
};

const deleteClientIgw = async ({ id, payload }) => {
  const res = await clientApi("DELETE", `/business/internet-gateways/${id}`, payload);
  if (!res?.data) {
    throw new Error("Failed to delete internet gateway");
  }
  return res.data;
};

const attachClientIgw = async (payload) => {
  const res = await clientApi("POST", "/business/internet-gateway-attachments", payload);
  if (!res?.data) {
    throw new Error("Failed to attach internet gateway");
  }
  return res.data;
};

const detachClientIgw = async (payload) => {
  const res = await clientApi("DELETE", "/business/internet-gateway-attachments", payload);
  if (!res?.data) {
    throw new Error("Failed to detach internet gateway");
  }
  return res.data;
};

export const useFetchClientIgws = (projectId, region, options = {}) =>
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id }],
      });
      if (variables?.region) {
        queryClient.invalidateQueries({
          queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
        });
      }
    },
    onError: (error) => {
      console.error("Error creating internet gateway:", error);
    },
  });
};

export const useDeleteClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientIgw,
    onSuccess: (data, variables) => {
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
    onError: (error) => {
      console.error("Error deleting internet gateway:", error);
    },
  });
};

export const useAttachClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: attachClientIgw,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
      });
    },
    onError: (error) => {
      console.error("Error attaching internet gateway:", error);
    },
  });
};

export const useDetachClientIgw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: detachClientIgw,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId: variables.project_id, region: variables.region }],
      });
    },
    onError: (error) => {
      console.error("Error detaching internet gateway:", error);
    },
  });
};

export const syncClientIgwsFromProvider = async ({ project_id, region }) =>
  fetchClientIgws({ project_id, region, refresh: true });
