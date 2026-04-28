import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import logger from "@/utils/logger";

/**
 * Generic OpenStack resource hooks: Heat stacks, managed clusters,
 * managed filesystems, managed secrets, migration requests, backup policies.
 *
 * Pattern: createResourceHooks-lite. Each resource has list/get/create/delete.
 */

interface ListResponse<T> {
  data: T[];
  meta?: Record<string, unknown> | null;
}

const buildResource = <T>(path: string, queryKey: string) => {
  const fetchList = async () => {
    const res = await api.get<ListResponse<T>>(`/${path}`, { silent: true });
    return res ?? { data: [] };
  };

  const fetchOne = async (identifier: string) => {
    const res = await api.get<{ data: T }>(`/${path}/${identifier}`, { silent: true });
    return res?.data ?? null;
  };

  const create = async (payload: Record<string, unknown>) => api.post(`/${path}`, payload);
  const remove = async (identifier: string) => api.delete(`/${path}/${identifier}`);

  return {
    useList: (options: Record<string, unknown> = src/hooks/openstackResourceHooks.ts) =>
      useQuery({
        queryKey: [queryKey],
        queryFn: fetchList,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 20,
        ...options,
      }),
    useOne: (identifier: string | null, options: Record<string, unknown> = src/hooks/openstackResourceHooks.ts) =>
      useQuery({
        queryKey: [queryKey, identifier],
        queryFn: () => fetchOne(identifier as string),
        enabled: !!identifier,
        refetchInterval: 1000 * 10,
        ...options,
      }),
    useCreate: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: create,
        onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
        onError: (e: Error) => logger.error(`Create ${path} failed`, e),
      });
    },
    useDelete: () => {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
        onError: (e: Error) => logger.error(`Delete ${path} failed`, e),
      });
    },
  };
};

export const heatStacks = buildResource("heat-stacks", "heatStacks");
export const managedClusters = buildResource("managed-clusters", "managedClusters");
export const managedFilesystems = buildResource("managed-filesystems", "managedFilesystems");
export const managedSecrets = buildResource("managed-secrets", "managedSecrets");
export const migrationRequests = buildResource("migration-requests", "migrationRequests");
