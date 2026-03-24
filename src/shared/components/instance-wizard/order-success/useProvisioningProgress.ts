import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApiContext } from "@/hooks/useApiContext";
import { useInstanceBroadcasting } from "@/hooks/useInstanceBroadcasting";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";
import { DEFAULT_INSTANCE_PIPELINE } from "./orderSuccessConstants";
import {
  normalizeStatus,
  resolveInstanceKey,
  getContextPrefix,
  buildInstanceRefs,
  buildConfigurationGroups,
} from "./orderSuccessUtils";
import type { PipelineStep, ConfigurationPipelineGroup } from "./OrderSuccessStep.types";

export interface ConfigurationPipeline extends ConfigurationPipelineGroup {
  steps: PipelineStep[];
}

export function useProvisioningProgress(instances: unknown) {
  const { apiBaseUrl, authHeaders, isAuthenticated, context } = useApiContext();
  const apiPrefix = getContextPrefix(context);
  const apiRoot = `${apiBaseUrl}${apiPrefix}`;

  const [isRetryingHealthCheck, setIsRetryingHealthCheck] = useState(false);
  const [instanceProgress, setInstanceProgress] = useState<Record<string, PipelineStep[]>>({});

  const instanceRefs = useMemo(() => buildInstanceRefs(instances), [instances]);

  const instanceIds = useMemo(
    () => instanceRefs.map((ref) => ref.broadcastId).filter((id) => id !== ""),
    [instanceRefs]
  );

  const configurationGroups = useMemo(() => buildConfigurationGroups(instances), [instances]);

  // Initialize progress from instance data
  useEffect(() => {
    if (!Array.isArray(instances) || instances.length === 0) {
      setInstanceProgress({});
      return;
    }

    const next: Record<string, PipelineStep[]> = {};
    instances.forEach((instance: any) => {
      const id = resolveInstanceKey(instance);
      if (!id) return;
      const steps = Array.isArray(instance?.provisioning_progress)
        ? instance.provisioning_progress
        : [];
      next[String(id)] = steps.map((step: any) => ({
        id: step.id || step.key || step.label || "",
        label: step.label || "Step",
        status: normalizeStatus(step.status),
        description: step.description,
        updated_at: step.updated_at,
        context: step.context,
      }));
    });
    setInstanceProgress(next);
  }, [instances]);

  // Handle broadcast updates
  const handleInstanceUpdate = useCallback((event: any) => {
    const instanceId = event?.instance_id || event?.instance?.id;
    const step = event?.step;
    if (!instanceId || !step) return;

    setInstanceProgress((prev) => {
      const key = String(instanceId);
      const existing = Array.isArray(prev[key]) ? [...prev[key]] : [];
      const normalizedStep = {
        id: step.id || step.key || step.label || "",
        label: step.label || "Step",
        status: normalizeStatus(step.status),
        description: step.description,
        updated_at: step.updated_at || new Date().toISOString(),
        context: step.context,
      };
      const stepIndex = existing.findIndex((item) => item.id === normalizedStep.id);
      if (stepIndex > -1) {
        existing[stepIndex] = { ...existing[stepIndex], ...normalizedStep };
      } else {
        existing.push(normalizedStep);
      }

      return {
        ...prev,
        [key]: existing,
      };
    });
  }, []);

  useInstanceBroadcasting(instanceIds, handleInstanceUpdate);

  // Fetch progress from API
  const fetchProgress = useCallback(
    async (refs = instanceRefs) => {
      if (!Array.isArray(refs) || refs.length === 0) return;

      for (const ref of refs) {
        try {
          const response = await fetch(`${apiRoot}/instances/${ref.lookupId}`, {
            headers: authHeaders,
            credentials: "include",
          });
          if (!response.ok) continue;
          const data = await response.json();
          const instance = data.data || data;
          const steps = Array.isArray(instance?.provisioning_progress)
            ? instance.provisioning_progress
            : [];
          if (steps.length > 0) {
            setInstanceProgress((prev) => ({
              ...prev,
              [String(ref.key)]: steps.map((step: any) => ({
                id: step.id || step.key || step.label || "",
                label: step.label || "Step",
                status: normalizeStatus(step.status),
                description: step.description,
                updated_at: step.updated_at,
                context: step.context,
              })),
            }));
          }
        } catch (err) {
          logger.warn(`Failed to fetch progress for instance ${ref.lookupId}`, err);
        }
      }
    },
    [apiRoot, authHeaders, instanceRefs]
  );

  // Keep a ref to instanceProgress so the polling interval can read it without re-triggering the effect
  const instanceProgressRef = useRef(instanceProgress);
  instanceProgressRef.current = instanceProgress;

  // Polling fallback: fetch progress from API every 3 seconds
  useEffect(() => {
    if (!isAuthenticated || instanceRefs.length === 0) return;

    // Initial fetch
    fetchProgress();

    // Poll every 3 seconds while instances are provisioning
    const interval = setInterval(() => {
      const currentProgress = instanceProgressRef.current;
      const allDone = Object.values(currentProgress).every((steps) => {
        if (!Array.isArray(steps) || steps.length === 0) return false;
        return steps.every((s) => s.status === "completed" || s.status === "failed");
      });
      if (allDone && Object.keys(currentProgress).length > 0) {
        clearInterval(interval);
        return;
      }
      fetchProgress();
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchProgress, isAuthenticated, instanceRefs.length]);

  // Resolve lookup IDs from keys
  const resolveLookupIds = useCallback(
    (keys: string[]) => {
      return keys
        .map((key) => instanceRefs.find((ref) => ref.key === key)?.lookupId)
        .filter((id: string | undefined): id is string => Boolean(id));
    },
    [instanceRefs]
  );

  // Retry health check
  const handleRetryHealthCheck = useCallback(
    async (keys: string[]) => {
      if (!isAuthenticated) {
        ToastUtils.error("Sign in to retry health checks.");
        return;
      }

      const lookupIds = resolveLookupIds(keys);
      if (lookupIds.length === 0) {
        ToastUtils.error("No instances available to refresh.");
        return;
      }

      setIsRetryingHealthCheck(true);
      try {
        const results = await Promise.allSettled(
          lookupIds.map(async (lookupId) => {
            const response = await fetch(
              `${apiRoot}/cube-instance/${lookupId}/refresh-status`,
              {
                method: "POST",
                headers: authHeaders,
                credentials: "include",
              }
            );

            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data?.message || "Failed to refresh instance status.");
            }
          })
        );

        const failures = results.filter((result) => result.status === "rejected");
        if (failures.length > 0) {
          logger.error("Health check refresh failures:", failures);
          ToastUtils.error(`Failed to refresh ${failures.length} instance(s).`);
        } else {
          ToastUtils.success("Health check refresh triggered.");
        }

        await fetchProgress();
      } finally {
        setIsRetryingHealthCheck(false);
      }
    },
    [apiRoot, authHeaders, fetchProgress, isAuthenticated, resolveLookupIds]
  );

  // Pipeline skeleton
  const instancePipelineSkeleton = useMemo(() => {
    const firstWithSteps = Object.values(instanceProgress).find(
      (steps) => Array.isArray(steps) && steps.length > 0
    );
    if (!Array.isArray(firstWithSteps) || firstWithSteps.length === 0) {
      return DEFAULT_INSTANCE_PIPELINE;
    }

    const defaults = DEFAULT_INSTANCE_PIPELINE.map((step) => {
      const match = firstWithSteps.find((item) => item.id === step.id);
      return {
        ...step,
        label: match?.label || step.label,
        description: match?.description || step.description,
      };
    });
    const defaultIds = new Set(defaults.map((step) => step.id));
    const extras = firstWithSteps
      .filter((step) => step.id && !defaultIds.has(step.id))
      .map((step) => ({
        id: step.id,
        label: step.label,
        status: "not_started" as const,
        description: step.description,
      }));

    return [...defaults, ...extras];
  }, [instanceProgress]);

  // Build aggregated steps
  const buildAggregatedSteps = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) {
        return instancePipelineSkeleton;
      }

      return instancePipelineSkeleton.map((step) => {
        const stepUpdates = ids
          .map((id) => {
            const steps = instanceProgress[id] || [];
            return steps.find((item) => item.id === step.id);
          })
          .filter(Boolean) as PipelineStep[];

        const completedCount = stepUpdates.filter((item) => item.status === "completed").length;
        const failedCount = stepUpdates.filter((item) => item.status === "failed").length;
        const pendingCount = stepUpdates.filter((item) => item.status === "pending").length;

        let status: PipelineStep["status"] = "not_started";
        if (failedCount > 0) {
          status = "failed";
        } else if (completedCount === ids.length) {
          status = "completed";
        } else if (pendingCount > 0 || completedCount > 0) {
          status = "pending";
        }

        const updatedAt = stepUpdates.reduce<string | undefined>(
          (latest, current) => {
            if (!current?.updated_at) return latest;
            if (!latest) return current.updated_at;
            return new Date(current.updated_at).getTime() > new Date(latest).getTime()
              ? current.updated_at
              : latest;
          },
          (step as PipelineStep).updated_at
        );

        const description =
          failedCount > 0
            ? `${failedCount}/${ids.length} failed`
            : `${completedCount}/${ids.length} complete`;

        return {
          ...step,
          status,
          updated_at: updatedAt,
          description: step.description ? `${step.description} - ${description}` : description,
        };
      });
    },
    [instancePipelineSkeleton, instanceProgress]
  );

  // Filter pipeline steps — remove inapplicable steps based on instance config.
  // The backend already excludes these from provisioning_progress, so we also
  // strip them from the UI skeleton to keep the percentage accurate.
  const filterPipelineSteps = useCallback(
    (
      steps: PipelineStep[],
      requirements: { requiresElasticIp: boolean; requiresDataVolumes: boolean }
    ) => {
      return steps.filter((step) => {
        // Skip EIP step if not requested
        if (step.id === "allocate_elastic_ip" && !requirements.requiresElasticIp) {
          return false;
        }
        // Skip data volumes step if none requested
        if (step.id === "attach_data_volumes" && !requirements.requiresDataVolumes) {
          return false;
        }
        // Skip post_provision if neither EIP nor data volumes apply
        if (
          step.id === "post_provision" &&
          !requirements.requiresElasticIp &&
          !requirements.requiresDataVolumes
        ) {
          return false;
        }
        // Skip sync_user_access if it was never started (backend excludes when config disables it)
        if (step.id === "sync_user_access" && step.status === "not_started") {
          return false;
        }
        return true;
      });
    },
    []
  );

  // Configuration pipelines
  const configurationPipelines = useMemo<ConfigurationPipeline[]>(
    () =>
      configurationGroups.map((group) => ({
        ...group,
        steps: filterPipelineSteps(buildAggregatedSteps(group.instanceIds), {
          requiresElasticIp: group.requiresElasticIp,
          requiresDataVolumes: group.requiresDataVolumes,
        }),
      })),
    [buildAggregatedSteps, configurationGroups, filterPipelineSteps]
  );

  return {
    configurationPipelines,
    isRetryingHealthCheck,
    handleRetryHealthCheck,
  };
}
