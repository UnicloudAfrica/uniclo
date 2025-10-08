// src/hooks/adminHooks/elasticIpHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../index/silent";
import api from "../index/api";
// import silentTenantApi from "../index/tenant/silentTenant";
// import tenantApi from "../index/tenant/tenantApi";

const fetchElasticIps = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/business/elastic-ips${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch elastic IPs");
  return res.data;
};

const createElasticIp = async (elasticIpData) => {
  const res = await api("POST", "/business/elastic-ips", elasticIpData);
  if (!res.data) throw new Error("Failed to create elastic IP");
  return res.data;
};

const deleteElasticIp = async (id) => {
  const res = await api("DELETE", `/business/elastic-ips/${id}`);
  if (!res.data) throw new Error(`Failed to delete elastic IP with ID ${id}`);
  return res.data;
};

const associateElasticIp = async (associationData) => {
  // Shared endpoint: POST /business/elastic-ip-associations
  const res = await api(
    "POST",
    "/business/elastic-ip-associations",
    associationData
  );
  if (!res.data) throw new Error("Failed to associate elastic IP");
  return res.data;
};

const disassociateElasticIp = async (disassociationData) => {
  // Shared endpoint: DELETE /business/elastic-ip-associations with body
  const res = await api(
    "DELETE",
    "/business/elastic-ip-associations",
    disassociationData
  );
  if (!res.data) throw new Error("Failed to disassociate elastic IP");
  return res.data;
};

export const useFetchTenantElasticIps = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["elasticIps", { projectId, region }],
    queryFn: () => fetchElasticIps({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTenantElasticIp = () => {
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

export const useDeleteTenantElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
    },
    onError: (error) => {
      console.error("Error deleting elastic IP:", error);
    },
  });
};

export const useAssociateTenantElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: associateElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
    },
    onError: (error) => {
      console.error("Error associating elastic IP:", error);
    },
  });
};

export const useDisassociateTenantElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disassociateElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elasticIps"] });
    },
    onError: (error) => {
      console.error("Error disassociating elastic IP:", error);
    },
  });
};
