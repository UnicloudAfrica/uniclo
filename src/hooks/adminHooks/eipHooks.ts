import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";
import logger from "../../utils/logger";

const fetchElasticIps = async ({ project_id, region, refresh = false }: any) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);
  if (refresh) params.append("refresh", "1");

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/elastic-ips${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch elastic IPs");
  return res.data;
};

const fetchElasticIpById = async (id: any) => {
  const res = await adminSilentApiforUser("GET", `/business/elastic-ips/${id}`);
  if (!res.data) throw new Error(`Failed to fetch elastic IP with ID ${id}`);
  return res.data;
};

const createElasticIp = async (elasticIpData: any) => {
  const res = await apiAdminforUser("POST", "/business/elastic-ips", elasticIpData);
  if (!res.data) throw new Error("Failed to create elastic IP");
  return res.data;
};

const updateElasticIp = async ({ id, elasticIpData }: any) => {
  const res = await apiAdminforUser("PATCH", `/business/elastic-ips/${id}`, elasticIpData);
  if (!res.data) throw new Error(`Failed to update elastic IP with ID ${id}`);
  return res.data;
};

const deleteElasticIp = async ({ id, payload }: any) => {
  const res = await apiAdminforUser("DELETE", `/business/elastic-ips/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete elastic IP with ID ${id}`);
  return res.data;
};

export const useFetchElasticIps = (projectId: any, region: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["elasticIps", { projectId, region }],
    queryFn: () => fetchElasticIps({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchElasticIpById = (id: any, options: any = {}) => {
  return useQuery<Record<string, unknown>>({
    queryKey: ["elasticIp", id],
    queryFn: () => fetchElasticIpById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
    },
    onError: (error: any) => {
      logger.error("Error creating elastic IP:", error);
    },
  });
};

export const useUpdateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateElasticIp,
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
      queryClient.invalidateQueries({ queryKey: ["elasticIp", variables.id] });
    },
    onError: (error: any) => {
      logger.error("Error updating elastic IP:", error);
    },
  });
};

export const useDeleteElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElasticIp,
    onSuccess: (data: any, variables: any) => {
      queryClient.invalidateQueries({
        queryKey: [
          "elasticIps",
          {
            projectId: variables.payload.project_id,
            region: variables.payload.region,
          },
        ],
      });
    },
    onError: (error: any) => {
      logger.error("Error deleting elastic IP:", error);
    },
  });
};

export const syncElasticIpsFromProvider = async ({ project_id, region }: any) => {
  return fetchElasticIps({ project_id, region, refresh: true });
};
