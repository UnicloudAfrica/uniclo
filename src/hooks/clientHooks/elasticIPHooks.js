// src/hooks/clientHooks/elasticIPHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

const fetchClientElasticIps = async ({ project_id, region }) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await clientSilentApi(
    "GET",
    `/business/elastic-ips${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch elastic IPs");
  return res.data;
};

const createClientElasticIp = async (elasticIpData) => {
  const res = await clientApi("POST", "/business/elastic-ips", elasticIpData);
  if (!res.data) throw new Error("Failed to create elastic IP");
  return res.data;
};

const deleteClientElasticIp = async ({ id, payload }) => {
  const res = await clientApi("DELETE", `/business/elastic-ips/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete elastic IP with ID ${id}`);
  return res.data;
};

const associateClientElasticIp = async (associationData) => {
  // Shared endpoint: POST /business/elastic-ip-associations
  const res = await clientApi(
    "POST",
    "/business/elastic-ip-associations",
    associationData
  );
  if (!res.data) throw new Error("Failed to associate elastic IP");
  return res.data;
};

const disassociateClientElasticIp = async (disassociationData) => {
  // Shared endpoint: DELETE /business/elastic-ip-associations with body
  const res = await clientApi(
    "DELETE",
    "/business/elastic-ip-associations",
    disassociationData
  );
  if (!res.data) throw new Error("Failed to disassociate elastic IP");
  return res.data;
};

export const useFetchClientElasticIps = (projectId, region, options = {}) => {
  return useQuery({
    queryKey: ["clientElasticIps", { projectId, region }],
    queryFn: () => fetchClientElasticIps({ project_id: projectId, region }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClientElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientElasticIps"] });
    },
    onError: (error) => {
      console.error("Error creating elastic IP:", error);
    },
  });
};

export const useDeleteClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientElasticIp,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [
          "clientElasticIps",
          { projectId: variables.payload.project_id },
        ],
      });
    },
    onError: (error) => {
      console.error("Error deleting elastic IP:", error);
    },
  });
};

export const useAssociateClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: associateClientElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientElasticIps"] });
    },
    onError: (error) => {
      console.error("Error associating elastic IP:", error);
    },
  });
};

export const useDisassociateClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disassociateClientElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientElasticIps"] });
    },
    onError: (error) => {
      console.error("Error disassociating elastic IP:", error);
    },
  });
};
