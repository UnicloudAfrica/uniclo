// src/hooks/clientHooks/elasticIPHooks.js
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";

interface ElasticIpParams {
  project_id?: string;
  region?: string;
}

interface ElasticIpPayload {
  project_id?: string;
  region?: string;
  [key: string]: unknown;
}

const fetchClientElasticIps = async ({ project_id, region }: ElasticIpParams) => {
  const params = new URLSearchParams();
  if (project_id) params.append("project_id", project_id);
  if (region) params.append("region", region);

  const queryString = params.toString();
  const res = await clientSilentApi<{ data: unknown[] }>(
    "GET",
    `/business/elastic-ips${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch elastic IPs");
  return res.data;
};

const createClientElasticIp = async (elasticIpData: ElasticIpPayload) => {
  const res = await clientApi<{ data: unknown }>("POST", "/business/elastic-ips", elasticIpData);
  if (!res.data) throw new Error("Failed to create elastic IP");
  return res.data;
};

const deleteClientElasticIp = async ({
  id,
  payload,
}: {
  id: string | number;
  payload: ElasticIpPayload;
}) => {
  const res = await clientApi<{ data: unknown }>("DELETE", `/business/elastic-ips/${id}`, payload);
  if (!res.data) throw new Error(`Failed to delete elastic IP with ID ${id}`);
  return res.data;
};

const syncClientElasticIps = async ({ project_id, region }: ElasticIpParams) => {
  return fetchClientElasticIps({ project_id, region });
};

const associateClientElasticIp = async (associationData: ElasticIpPayload) => {
  // Shared endpoint: POST /business/elastic-ip-associations
  const res = await clientApi<{ data: unknown }>(
    "POST",
    "/business/elastic-ip-associations",
    associationData
  );
  if (!res.data) throw new Error("Failed to associate elastic IP");
  return res.data;
};

const disassociateClientElasticIp = async (disassociationData: ElasticIpPayload) => {
  // Shared endpoint: DELETE /business/elastic-ip-associations with body
  const res = await clientApi<{ data: unknown }>(
    "DELETE",
    "/business/elastic-ip-associations",
    disassociationData
  );
  if (!res.data) throw new Error("Failed to disassociate elastic IP");
  return res.data;
};

export const useFetchClientElasticIps = (
  projectId?: string,
  region?: string,
  options: Omit<UseQueryOptions<unknown[], Error>, "queryKey" | "queryFn"> = {}
) => {
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["clientElasticIps"] });
      if (variables?.project_id) {
        queryClient.invalidateQueries({
          queryKey: [
            "clientElasticIps",
            {
              projectId: variables.project_id,
              region: variables.region,
            },
          ],
        });
      }
    },
  });
};

export const useDeleteClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClientElasticIp,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["clientElasticIps", { projectId: variables.payload.project_id }],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "clientElasticIps",
          {
            projectId: variables.payload.project_id,
            region: variables.payload.region,
          },
        ],
      });
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
  });
};

export const useDisassociateClientElasticIp = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: disassociateClientElasticIp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientElasticIps"] });
    },
  });
};

export const syncClientElasticIpsFromProvider = async ({ project_id, region }: ElasticIpParams) =>
  syncClientElasticIps({ project_id, region });
