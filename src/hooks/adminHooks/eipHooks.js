import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchElasticIps = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/business/elastic-ips${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch elastic IPs");
  return res.data;
};

const fetchElasticIpById = async (id) => {
  const res = await adminSilentApiforUser("GET", `/business/elastic-ips/${id}`);
  if (!res.data) throw new Error(`Failed to fetch elastic IP with ID ${id}`);
  return res.data;
};

const createElasticIp = async (elasticIpData) => {
  const res = await apiAdminforUser(
    "POST",
    "/business/elastic-ips",
    elasticIpData
  );
  if (!res.data) throw new Error("Failed to create elastic IP");
  return res.data;
};

const updateElasticIp = async ({ id, elasticIpData }) => {
  const res = await apiAdminforUser(
    "PATCH",
    `/business/elastic-ips/${id}`,
    elasticIpData
  );
  if (!res.data) throw new Error(`Failed to update elastic IP with ID ${id}`);
  return res.data;
};

const deleteElasticIp = async ({ id, payload }) => {
  const res = await apiAdminforUser(
    "DELETE",
    `/business/elastic-ips/${id}`,
    payload
  );
  if (!res.data) throw new Error(`Failed to delete elastic IP with ID ${id}`);
  return res.data;
};

export const useFetchElasticIps = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["elasticIps", { projectId, region }],
    queryFn: () => fetchElasticIps({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchElasticIpById = (id, options = {}) => {
  return useQuery({
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
    onError: (error) => {
      console.error("Error creating elastic IP:", error);
    },
  });
};

export const useUpdateElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateElasticIp,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
      queryClient.invalidateQueries({ queryKey: ["elasticIp", variables.id] });
    },
    onError: (error) => {
      console.error("Error updating elastic IP:", error);
    },
  });
};

export const useDeleteElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElasticIp,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["elasticIps", { projectId: variables.payload.project_id }],
      });
    },
    onError: (error) => {
      console.error("Error deleting elastic IP:", error);
    },
  });
};
