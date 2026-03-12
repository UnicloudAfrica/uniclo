import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useProjectNetworkStatus } from "@/hooks/adminHooks/projectHooks";
import logger from "@/utils/logger";

// Provisioning step shape from API
interface ProvisioningStep {
  id?: string;
  label?: string;
  status?: string;
  updated_at?: string;
}

export interface SetupStep {
  id: string;
  label: string;
  status: string;
  description: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProjectProvisioningResult {
  isInProvisioningMode: boolean;
  setIsInProvisioningMode: React.Dispatch<React.SetStateAction<boolean>>;
  forceHideProvisioning: boolean;
  setForceHideProvisioning: React.Dispatch<React.SetStateAction<boolean>>;
  setupSteps: SetupStep[];
  allStepsComplete: boolean;
  networkData: any;
  refetchNetworkStatus: () => void;
}

interface UseProjectProvisioningParams {
  project: Record<string, any> | undefined;
  projectId: string | null;
  resolvedProjectId: string | undefined;
  isNewProject: boolean;
  refetchProjectStatus: () => void;
  refetchProjectDetails: () => void;
}

export function useProjectProvisioning({
  project,
  projectId: _projectId,
  resolvedProjectId,
  isNewProject,
  refetchProjectStatus,
  refetchProjectDetails: _refetchProjectDetails,
}: UseProjectProvisioningParams): ProjectProvisioningResult {
  const queryClient = useQueryClient();
  const [isInProvisioningMode, setIsInProvisioningMode] = useState(() =>
    Boolean(isNewProject || project?.["status"] === "provisioning")
  );
  const [isNewProjectFlow, setIsNewProjectFlow] = useState(isNewProject);
  const [forceHideProvisioning, setForceHideProvisioning] = useState(false);

  // Keep the URL-driven "new project" flow sticky until setup fully completes.
  useEffect(() => {
    if (isNewProject) {
      setIsNewProjectFlow(true);
    }
  }, [isNewProject]);

  // Compute setupSteps early for use in provisioning screen
  const provisioningProgress = project?.["provisioning_progress"];
  const setupSteps = useMemo(() => {
    const progress = provisioningProgress as ProvisioningStep[] | undefined;
    if (Array.isArray(progress)) {
      return progress.map((step) => ({
        id: step.id || step.label?.toLowerCase()?.replaceAll(/\s+/g, "_") || "step",
        label: step.label || "Step",
        status: step.status || "pending",
        description: step.status === "completed" ? "Completed" : "Action in progress",
        updated_at: step.updated_at,
      }));
    }
    return [];
  }, [provisioningProgress]);

  // Sticky provisioning mode: once we enter provisioning, stay until all steps are complete
  const allStepsComplete =
    setupSteps.length > 0 && setupSteps.every((s) => s.status === "completed");
  const currentStatus = project?.["status"];
  const isProvisioningComplete =
    currentStatus === "active" ||
    currentStatus === "ready" ||
    currentStatus === "completed" ||
    allStepsComplete;

  useEffect(() => {
    const shouldEnterProvisioning =
      isNewProjectFlow || (currentStatus === "provisioning" && !allStepsComplete);

    if (shouldEnterProvisioning && !isInProvisioningMode) {
      setIsInProvisioningMode(true);
    }
  }, [allStepsComplete, currentStatus, isInProvisioningMode, isNewProjectFlow]);

  useEffect(() => {
    if (isInProvisioningMode && isProvisioningComplete) {
      const timer = setTimeout(() => {
        setIsInProvisioningMode(false);
        setIsNewProjectFlow(false);
        if (isNewProjectFlow) {
          const newUrl = new URL(globalThis.window.location.href);
          newUrl.searchParams.delete("new");
          globalThis.window.history.replaceState({}, "", newUrl.toString());
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isInProvisioningMode, isNewProjectFlow, isProvisioningComplete]);

  // Network expansion hooks
  const { data: networkStatusData, refetch: refetchNetworkStatus } = useProjectNetworkStatus(
    resolvedProjectId,
    { enabled: Boolean(resolvedProjectId) }
  ) as { data: any; refetch: () => void };

  // Track previous status to detect provisioning completion
  const prevProjectStatusRef = useRef<string | undefined>(undefined);

  // Auto-refetch network data when provisioning completes
  useEffect(() => {
    const currentStatus = project?.status;
    const prevStatus = prevProjectStatusRef.current;

    // Detect transition from provisioning/pending to ready/active/completed
    if (
      prevStatus &&
      (prevStatus === "provisioning" || prevStatus === "pending") &&
      currentStatus &&
      (currentStatus === "ready" || currentStatus === "active" || currentStatus === "completed")
    ) {
      logger.log("[AdminProjectDetails] Provisioning completed, refreshing network data...");
      // Trigger refetch of all network-related data
      refetchNetworkStatus?.();
      refetchProjectStatus?.();
      // Invalidate network queries to get fresh data
      queryClient.invalidateQueries({ queryKey: ["networks"] });
      queryClient.invalidateQueries({ queryKey: ["vpcs"] });
      queryClient.invalidateQueries({ queryKey: ["subnets"] });
      queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
      queryClient.invalidateQueries({ queryKey: ["igws"] });
      queryClient.invalidateQueries({ queryKey: ["internet_gateways"] });
    }

    prevProjectStatusRef.current = currentStatus;
  }, [project?.status, refetchNetworkStatus, refetchProjectStatus, queryClient]);

  // Also detect when all provisioning_progress steps complete (for 100% READY state)
  const prevAllStepsCompletedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!Array.isArray(provisioningProgress) || provisioningProgress.length === 0) return;

    const allCompleted = provisioningProgress.every(
      (step: ProvisioningStep) => step?.status === "completed"
    );
    const wasIncomplete = !prevAllStepsCompletedRef.current;

    // Detect transition to all-completed state
    if (allCompleted && wasIncomplete) {
      logger.log(
        "[AdminProjectDetails] All provisioning steps completed, refreshing network data..."
      );
      // Short delay to allow backend to finalize
      setTimeout(() => {
        refetchNetworkStatus?.();
        refetchProjectStatus?.();
        queryClient.invalidateQueries({ queryKey: ["networks"] });
        queryClient.invalidateQueries({ queryKey: ["vpcs"] });
        queryClient.invalidateQueries({ queryKey: ["subnets"] });
        queryClient.invalidateQueries({ queryKey: ["securityGroups"] });
        queryClient.invalidateQueries({ queryKey: ["igws"] });
      }, 500);
    }

    prevAllStepsCompletedRef.current = allCompleted;
  }, [provisioningProgress, refetchNetworkStatus, refetchProjectStatus, queryClient]);

  // Force refetch network status when project ID is resolved
  useEffect(() => {
    if (resolvedProjectId) {
      refetchNetworkStatus();
    }
  }, [resolvedProjectId, refetchNetworkStatus]);

  // Extract network data from response (handle wrapped or unwrapped structure)
  const networkData = useMemo(() => {
    if (!networkStatusData) return undefined;
    return networkStatusData.network || networkStatusData?.data?.network || networkStatusData;
  }, [networkStatusData]);

  return {
    isInProvisioningMode,
    setIsInProvisioningMode,
    forceHideProvisioning,
    setForceHideProvisioning,
    setupSteps,
    allStepsComplete,
    networkData,
    refetchNetworkStatus,
  };
}
