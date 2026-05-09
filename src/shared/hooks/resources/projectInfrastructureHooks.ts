/**
 * Project Infrastructure Hooks — Context-aware hooks for project infrastructure.
 *
 * Replaces duplicated project-infrastructure hooks across admin/tenant/client.
 * Uses `useApiContext()` to route requests to the correct API client.
 *
 * Exports:
 *   - Shared hooks used by all roles (status query)
 *   - Admin-only hooks (setup, bulk setup, reset, polling, progress, sync, provision, enable-vpc)
 *
 * The infrastructure endpoint follows a non-standard URL pattern:
 *   admin:  /business/project-infrastructure/...
 *   tenant: /admin/business/project-infrastructure/...
 *   client: /business/project-infrastructure/...
 */
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import logger from "@/utils/logger";

type AnyRecord = Record<string, unknown>;

// ─── URL Helpers ────────────────────────────────────────────────

/**
 * Returns the base path for the project-infrastructure endpoint
 * according to the role / API context.
 */
const infraBasePath = (context: ApiContext): string => {
  switch (context) {
    case "tenant":
      return "/admin/business/project-infrastructure";
    case "admin":
    case "client":
    default:
      return "/business/project-infrastructure";
  }
};

// ─── Normalisation Helpers ──────────────────────────────────────

export const normalizeDetails = (component: Record<string, unknown>): unknown[] | null => {
  if (!component || !component.details) return null;
  if (Array.isArray(component.details)) return component.details;
  if (typeof component.details === "object") return [component.details];
  return null;
};

export const normalizeStatus = (component: Record<string, unknown>): string => {
  if (!component) return "pending";
  const status = component.status;
  if (status === "configured" || status === "completed") return "completed";
  if (status === "ready") {
    const details = normalizeDetails(component);
    if (
      (details && details.length > 0) ||
      (typeof component.count === "number" && component.count > 0)
    ) {
      return "completed";
    }
    return "pending";
  }
  const details = normalizeDetails(component);
  if (
    (details && details.length > 0) ||
    (typeof component.count === "number" && component.count > 0)
  ) {
    return "completed";
  }
  return component.ready_for_setup ? "pending" : "pending";
};

// ─── Component Definitions ──────────────────────────────────────

/**
 * The full set of infrastructure component keys.
 * Admin sees all; tenant/client see a subset.
 */
const ADMIN_COMPONENTS = [
  "keypairs",
  "vpc",
  "edge_networks",
  "security_groups",
  "subnets",
  "route_tables",
  "internet_gateways",
  "network_interfaces",
  "elastic_ips",
] as const;

/**
 * Tenant sees all the same components as admin (minus the hardcoded "domain").
 */
const TENANT_COMPONENTS = ADMIN_COMPONENTS;

/**
 * Client sees a reduced subset of components.
 */
const CLIENT_COMPONENTS = [
  "keypairs",
  "vpc",
  "edge_networks",
  "security_groups",
  "subnets",
] as const;

type ComponentKey = (typeof ADMIN_COMPONENTS)[number];

const componentsForContext = (context: ApiContext): readonly ComponentKey[] => {
  switch (context) {
    case "admin":
      return ADMIN_COMPONENTS;
    case "tenant":
      return TENANT_COMPONENTS;
    case "client":
    default:
      return CLIENT_COMPONENTS;
  }
};

// ─── Backend → Frontend Conversion ──────────────────────────────

const buildComponent = (infraEntry: Record<string, unknown>) => ({
  status: normalizeStatus(infraEntry),
  details: normalizeDetails(infraEntry),
  count: infraEntry?.count ?? null,
  error: null,
});

const buildKeypairsComponent = (kp: Record<string, unknown>) => ({
  status: (() => {
    if (!kp) return "pending";
    if (kp.status === "configured" || kp.status === "completed") return "completed";
    if (typeof kp.count === "number" && kp.count > 0) return "completed";
    const details = normalizeDetails(kp);
    if (details && details.length > 0) return "completed";
    return kp?.ready_for_setup ? "pending" : "pending";
  })(),
  details: normalizeDetails(kp),
  count: kp?.count ?? null,
  error: null,
});

export const convertBackendResponse = (backendData: Record<string, unknown>, context: ApiContext = "admin") => {
  if (!backendData) return null;

  const infrastructure = backendData.infrastructure || {};
  const componentKeys = componentsForContext(context);

  // Build the components object, only including keys relevant to the context
  const components: AnyRecord = {};

  // Admin version includes a hardcoded "domain" entry
  if (context === "admin") {
    components.domain = {
      status: "completed",
      details: null,
      error: null,
    };
  }

  for (const key of componentKeys) {
    if (key === "keypairs") {
      components[key] = buildKeypairsComponent(infrastructure.keypairs);
    } else {
      components[key] = buildComponent(infrastructure[key]);
    }
  }

  // Build counts map (tenant & client include this; admin does not)
  // Cast once to access legacy flat count fields (e.g. vpcs_count, igws_count)
  const infraLegacy = infrastructure as AnyRecord;
  const counts: AnyRecord | undefined =
    context !== "admin"
      ? {
        vpcs: infrastructure.vpc?.count ?? infraLegacy.vpcs_count ?? null,
        subnets: infrastructure.subnets?.count ?? infraLegacy.subnets_count ?? null,
        security_groups:
          infrastructure.security_groups?.count ?? infraLegacy.security_groups_count ?? null,
        keypairs: infrastructure.keypairs?.count ?? infraLegacy.keypairs_count ?? null,
        internet_gateways:
          infrastructure.internet_gateways?.count ?? infraLegacy.igws_count ?? null,
        route_tables:
          infrastructure.route_tables?.count ?? infraLegacy.route_tables_count ?? null,
        network_interfaces:
          infrastructure.network_interfaces?.count ?? infraLegacy.enis_count ?? null,
        elastic_ips: infrastructure.elastic_ips?.count ?? infraLegacy.eips_count ?? null,
      }
      : undefined;

  const result: AnyRecord = {
    project_id: backendData.project?.identifier,
    overall_status: backendData.project?.status || "pending",
    components,
    completion_percentage: backendData.completion_percentage || 0,
    estimated_completion: backendData.estimated_completion_time
      ? new Date(Date.now() + backendData.estimated_completion_time * 1000).toISOString()
      : null,
    last_updated: new Date().toISOString(),
    next_steps: backendData.next_steps || [],
  };

  if (counts !== undefined) {
    result.counts = counts;
  }

  // Forward the cache-freshness envelope so the SPA can show "Updated 4
  // minutes ago" / "Refreshing…" badges and pick a polling cadence that
  // matches what the backend is doing. See ProjectInfrastructureCacheService.
  if (backendData.freshness) {
    result.freshness = backendData.freshness;
  }

  return result;
};

// ─── Query Key Factories ────────────────────────────────────────

export const projectInfraKeys = {
  status: (context: ApiContext, projectId: string | number) =>
    ["project-infrastructure-status", context, projectId] as const,
  polling: (context: ApiContext, projectId: string | number) =>
    ["project-status-polling", context, projectId] as const,
};

// ─── Shared Hooks (all roles) ───────────────────────────────────

/** Fetch project infrastructure status — all roles */
export const useProjectInfrastructureStatus = (projectId: string | number, options: AnyRecord = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const basePath = infraBasePath(context);

  return useQuery({
    queryKey: projectInfraKeys.status(context, projectId),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }
      if (typeof projectId === "string" && projectId.includes("\0")) {
        throw new Error("Invalid Project ID: Contains null byte");
      }

      const response = await entry.silentApi.get<AnyRecord>(`${basePath}/${projectId}`);

      const raw = (response as AnyRecord)?.data ?? response;
      const convertedData = convertBackendResponse(raw, context);

      return { data: convertedData };
    },
    enabled: !!projectId,
    staleTime: 30000,
    cacheTime: 300000,
    // Adaptive polling driven by the backend cache freshness envelope:
    //   - refresh_in_progress → poll fast (5s) while the queue worker runs
    //   - stale               → poll moderately (15s) until the next refresh lands
    //   - fresh               → no polling; lean on staleTime
    refetchInterval: (query: { state: { data: unknown } }) => {
      const freshness = ((query.state.data as AnyRecord)?.data as AnyRecord)?.freshness as
        | { status?: string; refresh_in_progress?: boolean }
        | undefined;
      if (freshness?.refresh_in_progress) return 5000;
      if (freshness?.status === "stale" || freshness?.status === "pending") return 15000;
      return false;
    },
    retry: (failureCount: number, error: unknown) => {
      const msg = error instanceof Error ? error.message : "";
      if (msg.includes("404") || msg.includes("403")) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  } as never);
};

// ─── Admin-Only Hooks ───────────────────────────────────────────

/** Setup a single infrastructure component — admin only */
export const useSetupInfrastructureComponent = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  const basePath = infraBasePath(context);

  return useMutation({
    mutationFn: async ({ projectId, componentType }: { projectId: string | number; componentType: string }) => {
      if (!projectId || !componentType) {
        throw new Error("Project ID and component type are required");
      }

      return entry.toastApi.post<AnyRecord>(basePath, {
        project_identifier: projectId,
        component: componentType,
        auto_configure: true,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
    },
    onError: (error: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      logger.error(`Failed to setup ${variables.componentType}:`, error);
    },
  });
};

/** Provision VPC for a project — admin only */
export const useProvisionVpc = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, payload = {} }: { projectId: string | number; payload?: Record<string, unknown> }) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${projectId}/vpc/provision`,
        payload
      );
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-projects"],
      });
    },
    onError: (error: unknown) => {
      logger.error("Failed to provision VPC:", error);
    },
  });
};

/**
 * Retry a project's provisioning pipeline after it failed.
 *
 * Backend: `POST {prefix}/projects/{identifier}/retry-provisioning`. Resets
 * `project.status = 'provisioning'` and re-dispatches the provision job.
 * Surface this as a button only when `project.status === 'failed'` —
 * the backend rejects retries on any other status with a 422.
 */
export const useRetryProjectProvisioning = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string | number }) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      return entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/projects/${projectId}/retry-provisioning`
      );
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number }) => {
      // Force the SPA to refetch project state immediately so the user
      // sees the new "provisioning" status and step progress on next poll.
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-projects"],
      });
    },
    onError: (error: unknown) => {
      logger.error("Failed to retry project provisioning:", error);
    },
  });
};

/** Enable VPC for a project in Zadara — admin only */
export const useEnableProjectVpc = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string | number }) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      return entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/projects/${projectId}/enable-vpc`);
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-projects"],
      });
    },
    onError: (error: unknown) => {
      logger.error("Failed to enable VPC:", error);
    },
  });
};

/** Real-time project status polling — admin only */
export const useProjectStatusPolling = (projectId: string | number, options: AnyRecord = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const {
    enabled = true,
    interval = 30000,
    maxPollingTime = 1800000,
    stopOnStatus = ["active", "failed", "deleted"],
    triggerSync = false,
  } = options;

  const [pollingStartTime] = React.useState(() => Date.now());
  const [shouldStop, setShouldStop] = React.useState(false);

  return useQuery({
    queryKey: projectInfraKeys.polling(context, projectId),
    queryFn: async () => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      const syncParam = triggerSync ? "?sync=true" : "";
      const response = await entry.silentApi.get<AnyRecord>(
        `${entry.urlPrefix}/projects/${projectId}/status${syncParam}`
      );

      return (response as AnyRecord)?.data ?? response;
    },
    enabled: enabled && !!projectId && !shouldStop,
    refetchInterval: (data: Record<string, unknown>, _query: unknown) => {
      if (Date.now() - pollingStartTime > maxPollingTime) {
        setShouldStop(true);
        return false;
      }

      if (data && stopOnStatus.includes(data.status)) {
        setShouldStop(true);
        return false;
      }

      return interval;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: (failureCount: number, _error: unknown) => {
      return failureCount < 3;
    },
    onSuccess: (data: Record<string, unknown>) => {
      logger.log(`Project ${projectId} status:`, data.status);

      if (options.onStatusChange) {
        options.onStatusChange(data);
      }
    },
    ...options.queryOptions,
  } as never);
};

/** Bulk infrastructure setup — admin only */
export const useBulkSetupInfrastructure = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  const basePath = infraBasePath(context);

  return useMutation({
    mutationFn: async ({ projectId, components }: { projectId: string | number; components: string[] }) => {
      if (!projectId || !Array.isArray(components) || components.length === 0) {
        throw new Error("Project ID and components array are required");
      }

      const results = [];
      for (const component of components) {
        const result = await entry.toastApi.post<AnyRecord>(basePath, {
          project_identifier: projectId,
          component,
          auto_configure: true,
          timestamp: new Date().toISOString(),
        });
        results.push(result);
      }
      return { success: true, results };
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
    },
    onError: (error: unknown, _variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      logger.error("Failed to setup infrastructure components:", error);
    },
  });
};

/** Reset/rollback infrastructure component — admin only */
export const useResetInfrastructureComponent = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  const basePath = infraBasePath(context);

  return useMutation({
    mutationFn: async ({ projectId, componentType }: { projectId: string | number; componentType: string }) => {
      if (!projectId || !componentType) {
        throw new Error("Project ID and component type are required");
      }

      return entry.toastApi.delete<AnyRecord>(`${basePath}/${projectId}`, {
        component: componentType,
        timestamp: new Date().toISOString(),
      });
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
    },
    onError: (error: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      logger.error(`Failed to reset ${variables.componentType}:`, error);
    },
  });
};

/** Infrastructure setup progress helper — admin only */
export const useInfrastructureProgress = (projectId: string | number) => {
  const { data: infraStatus } = useProjectInfrastructureStatus(projectId);
  const normalizedInfraStatus = (infraStatus as AnyRecord)?.data ?? infraStatus;

  const progress = React.useMemo(() => {
    const components = normalizedInfraStatus?.components;
    if (!components) {
      return {
        completedSteps: 0,
        totalSteps: 0,
        percentage: 0,
        currentStep: null,
        nextStep: null,
      };
    }

    const stepOrder = ["domain", "vpc", "edge_networks", "security_groups", "subnets"];

    const completedSteps = stepOrder.filter(
      (step: string) => components[step]?.status === "completed"
    ).length;

    const currentStep = stepOrder.find((step: string) => components[step]?.status === "in_progress");

    const nextStep = stepOrder.find(
      (step: string) => components[step]?.status === "pending" || !components[step]
    );

    return {
      completedSteps,
      totalSteps: stepOrder.length,
      percentage: (completedSteps / stepOrder.length) * 100,
      currentStep,
      nextStep,
      isComplete: completedSteps === stepOrder.length,
    };
  }, [normalizedInfraStatus]);

  return progress;
};

/** Sync / force-refresh project infrastructure — all roles */
export const useSyncProjectInfrastructure = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();
  const basePath = infraBasePath(context);

  return useMutation({
    mutationFn: async ({ projectId }: { projectId: string | number }) => {
      if (!projectId) {
        throw new Error("Project ID is required");
      }

      // Step 1: Trigger provider → DB sync via ResourceSyncService.
      // This pulls fresh data from Zadara/Nobus APIs into local DB models
      // and recalculates project status (marks as active if VPC+subnet exist).
      try {
        await entry.silentApi.post<AnyRecord>(
          `${entry.urlPrefix}/projects/${projectId}/sync-resources`
        );
      } catch (syncErr: unknown) {
        // Log but don't abort — the refresh below has its own driver-based sync fallback
        logger.warn("sync-resources pre-sync failed, falling back to refresh:", syncErr);
      }

      // Step 2: Fetch fresh infrastructure status.
      // Uses refresh=true so the backend's own syncInfrastructureFromProvider
      // runs as a second safety net, then returns the formatted response.
      return entry.silentApi.get<AnyRecord>(`${basePath}/${projectId}?refresh=true`);
    },
    onSuccess: (_data: unknown, variables: { projectId: string | number; componentType?: string; components?: string[] }) => {
      queryClient.invalidateQueries({
        queryKey: projectInfraKeys.status(context, variables.projectId),
      });
      queryClient.invalidateQueries({
        queryKey: ["project-details", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-project", variables.projectId],
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-projects"],
      });
      const resourceKeys = [
        "networks",
        "vpcs",
        "subnets",
        "securityGroups",
        "keyPairs",
        "igws",
        "routeTables",
        "elasticIps",
        "networkInterfaces",
      ];
      resourceKeys.forEach((key: string) => queryClient.invalidateQueries({ queryKey: [key] }));
    },
    onError: (error: unknown) => {
      logger.error("Failed to sync infrastructure:", error);
    },
  });
};

// ─── Default Export ─────────────────────────────────────────────

const projectInfrastructureHooks = {
  useProjectInfrastructureStatus,
  useSetupInfrastructureComponent,
  useBulkSetupInfrastructure,
  useResetInfrastructureComponent,
  useInfrastructureProgress,
  useProvisionVpc,
  useEnableProjectVpc,
  useProjectStatusPolling,
  useSyncProjectInfrastructure,
};

export default projectInfrastructureHooks;
