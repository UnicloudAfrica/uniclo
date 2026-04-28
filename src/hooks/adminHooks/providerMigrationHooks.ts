import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";

interface MigrationsListResponse {
  data: Array<Record<string, unknown>>;
  meta?: Record<string, unknown> | null;
}

interface PlanPayload {
  tenant_id: string;
  source_provider: string;
  source_region: string;
  target_provider: string;
  target_region: string;
  strategy?: string;
}

const fetchMigrations = async (page = 1) => {
  const res = await silentApi("GET", `/migrations/providers?page=${page}`);
  return res as MigrationsListResponse;
};

const fetchMigration = async (identifier: string) => {
  const res = await silentApi("GET", `/migrations/providers/${identifier}`);
  return (res as { data?: unknown })?.data ?? null;
};

export const useProviderMigrations = (page = 1, options: Record<string, unknown> = src/hooks/adminHooks/providerMigrationHooks.ts) => {
  return useQuery<MigrationsListResponse>({
    queryKey: ["providerMigrations", page],
    queryFn: () => fetchMigrations(page),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 15,
    ...options,
  });
};

export const useProviderMigration = (identifier: string | null, options: Record<string, unknown> = src/hooks/adminHooks/providerMigrationHooks.ts) => {
  return useQuery({
    queryKey: ["providerMigration", identifier],
    queryFn: () => fetchMigration(identifier as string),
    enabled: !!identifier,
    refetchInterval: 1000 * 10,
    ...options,
  });
};

export const usePlanMigration = () => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, PlanPayload>({
    mutationFn: (payload) => api("POST", "/migrations/providers/plan", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providerMigrations"] }),
    onError: (err) => logger.error("Plan migration failed", err),
  });
};

export const useExecuteMigration = () => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (identifier) => api("POST", `/migrations/providers/${identifier}/execute`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["providerMigrations"] });
      qc.invalidateQueries({ queryKey: ["providerMigration", id] });
    },
    onError: (err) => logger.error("Execute migration failed", err),
  });
};

export const useRollbackMigration = () => {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (identifier) => api("POST", `/migrations/providers/${identifier}/rollback`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["providerMigrations"] });
      qc.invalidateQueries({ queryKey: ["providerMigration", id] });
    },
    onError: (err) => logger.error("Rollback migration failed", err),
  });
};
