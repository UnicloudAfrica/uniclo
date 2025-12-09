// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  useProjectInfrastructureStatus,
  useSetupInfrastructureComponent,
} from "../../../hooks/adminHooks/projectInfrastructureHooks";
import { useEnsureRootDomain } from "../../../hooks/adminHooks/zadaraDomainHooks";
import ToastUtils from "../../../utils/toastUtil";

const StepStatus = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  ERROR: "error",
  AVAILABLE: "available",
};

const StepIcon = ({ status, isLoading }: any) => {
  if (isLoading) {
    return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
  }

  switch (status) {
    case StepStatus.COMPLETED:
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case StepStatus.ERROR:
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case StepStatus.IN_PROGRESS:
      return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
  }
};

const ProgressBar = ({ progress }: any) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
    <div
      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    />
  </div>
);

const ActionButton = ({ onClick, disabled, isLoading, children, variant = "primary" }: any) => {
  const baseClasses =
    "px-6 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2";
  const variants = {
    primary:
      "bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:bg-gray-50 disabled:cursor-not-allowed",
    danger:
      "bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const InfrastructureStep = ({
  step,
  status,
  isActive,
  onAction,
  isLoading,
  error,
  details,
  actionText,
  canProceed,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case StepStatus.COMPLETED:
        return "border-green-200 bg-green-50";
      case StepStatus.ERROR:
        return "border-red-200 bg-red-50";
      case StepStatus.IN_PROGRESS:
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-white";
    }
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all duration-200 ${getStatusColor()} ${isActive ? "ring-2 ring-blue-300" : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">
            <StepIcon status={status} isLoading={isLoading} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{step.description}</p>

            {details && (
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded mb-2">
                <pre className="whitespace-pre-wrap font-mono">
                  {JSON.stringify(details, null, 2)}
                </pre>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-100 p-2 rounded mb-2">
                <strong>Error:</strong> {error}
                {step.troubleshooting && (
                  <div className="mt-1 text-xs">
                    <strong>Troubleshooting:</strong> {step.troubleshooting}
                  </div>
                )}
              </div>
            )}

            {step.prerequisites && step.prerequisites.length > 0 && (
              <div className="text-sm text-gray-600 mb-2">
                <strong>Prerequisites:</strong>
                <ul className="list-disc list-inside ml-2">
                  {step.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {status === StepStatus.COMPLETED && (
            <span className="text-xs text-green-600 font-medium">Completed</span>
          )}

          {status === StepStatus.ERROR && onAction && (
            <ActionButton onClick={onAction} isLoading={isLoading} variant="danger">
              <RefreshCw className="w-4 h-4" />
              Retry
            </ActionButton>
          )}

          {canProceed && status !== StepStatus.COMPLETED && onAction && (
            <ActionButton onClick={onAction} isLoading={isLoading} disabled={!canProceed}>
              {actionText || "Setup"}
              <ArrowRight className="w-4 h-4" />
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

const InfrastructureSetupFlow = ({ projectId, projectName }: any) => {
  const [activeStep, setActiveStep] = useState(0);
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Hooks for API calls
  const {
    data: infraStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus,
  } = useProjectInfrastructureStatus(projectId, {
    refetchInterval: pollingEnabled ? 5000 : false, // Poll every 5 seconds
    refetchIntervalInBackground: false,
  });

  const { mutate: setupComponent, isPending: isSettingUp } = useSetupInfrastructureComponent();
  const { mutate: ensureDomain, isPending: isEnsuringDomain } = useEnsureRootDomain();

  // Define infrastructure setup steps (matching backend components)
  const infrastructureSteps = [
    {
      id: "domain",
      title: "Domain Setup",
      description: "Ensure root domain exists for the project infrastructure",
      component: "domain",
      prerequisites: [],
      troubleshooting: "Check domain configuration and DNS settings",
    },
    {
      id: "vpc",
      title: "VPC Configuration",
      description: "Create and configure Virtual Private Cloud for network isolation",
      component: "vpc",
      prerequisites: ["Domain must be configured"],
      troubleshooting: "Verify cloud provider credentials and region availability",
    },
    {
      id: "edge_networks",
      title: "Edge Networks",
      description: "Setup edge network configurations for optimized connectivity",
      component: "edge_networks",
      prerequisites: ["VPC must be created and available"],
      troubleshooting: "Ensure VPC is active before configuring edge networks",
    },
    {
      id: "security_groups",
      title: "Security Groups",
      description: "Configure firewall rules and security policies",
      component: "security_groups",
      prerequisites: ["VPC must be available"],
      troubleshooting: "Verify network security rules and access policies",
    },
    {
      id: "subnets",
      title: "Subnets",
      description: "Create and configure network subnets for resource organization",
      component: "subnets",
      prerequisites: ["VPC must be configured"],
      troubleshooting: "Check CIDR blocks and subnet configurations",
    },
  ];

  // Calculate progress percentage
  const completedSteps = infraStatus?.components
    ? Object.values(infraStatus.components).filter((comp) => comp.status === "completed").length
    : 0;
  const totalSteps = infrastructureSteps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // Handle component setup
  const handleSetupComponent = (componentType: any) => {
    if (componentType === "domain") {
      ensureDomain(undefined, {
        onSuccess: () => {
          ToastUtils.success("Domain setup completed successfully");
          refetchStatus();
        },
        onError: (error) => {
          console.error("Domain setup failed:", error);
          ToastUtils.error("Failed to setup domain. Please try again.");
        },
      });
      return;
    }

    setupComponent(
      { projectId, componentType },
      {
        onSuccess: (response) => {
          ToastUtils.success(`${componentType.toUpperCase()} setup initiated successfully`);
          refetchStatus();

          // Enable polling for real-time updates
          setPollingEnabled(true);
        },
        onError: (error) => {
          console.error(`Failed to setup ${componentType}:`, error);
          ToastUtils.error(`Failed to setup ${componentType}. Please try again.`);
        },
      }
    );
  };

  // Determine if a step can proceed based on prerequisites
  const canStepProceed = (stepIndex: any) => {
    const step = infrastructureSteps[stepIndex];

    if (stepIndex === 0) return true; // Domain setup can always proceed

    // Check if previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      const prevStep = infrastructureSteps[i];
      const prevStepStatus = infraStatus?.components?.[prevStep.component]?.status;
      if (prevStepStatus !== "completed") {
        return false;
      }
    }

    return true;
  };

  // Get step status from API response
  const getStepStatus = (step: any) => {
    if (!infraStatus?.components) return StepStatus.PENDING;

    const component = infraStatus.components[step.component];
    if (!component) return StepStatus.PENDING;

    switch (component.status) {
      case "completed":
        return StepStatus.COMPLETED;
      case "in_progress":
        return StepStatus.IN_PROGRESS;
      case "error":
        return StepStatus.ERROR;
      case "pending":
        return StepStatus.PENDING;
      default:
        return StepStatus.PENDING;
    }
  };

  // Auto-advance to next incomplete step
  useEffect(() => {
    if (infraStatus?.components) {
      for (let i = 0; i < infrastructureSteps.length; i++) {
        const step = infrastructureSteps[i];
        const status = getStepStatus(step);
        if (status !== StepStatus.COMPLETED) {
          setActiveStep(i);
          break;
        }
      }

      // If all steps are completed, stop polling
      if (completedSteps === totalSteps) {
        setPollingEnabled(false);
      }
    }
  }, [infraStatus, completedSteps, totalSteps]);

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Loading infrastructure status...</p>
        </div>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="font-semibold text-red-800">Failed to Load Infrastructure Status</h3>
        </div>
        <p className="text-red-700 mb-4">
          Unable to retrieve infrastructure status for this project.
        </p>
        <ActionButton onClick={() => refetchStatus()} variant="danger">
          <RefreshCw className="w-4 h-4" />
          Retry
        </ActionButton>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 font-Outfit">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Infrastructure Setup</h2>
            <p className="text-sm text-gray-600">Project: {projectName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchStatus()}
              disabled={isLoadingStatus}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh Status"
            >
              <RefreshCw className={`w-5 h-5 ${isLoadingStatus ? "animate-spin" : ""}`} />
            </button>
            <div className="text-sm text-gray-600">
              {completedSteps} of {totalSteps} steps completed
            </div>
          </div>
        </div>

        <ProgressBar progress={progress} />

        {progress === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="font-medium text-green-800">Infrastructure Setup Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All infrastructure components have been successfully configured.
            </p>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {infrastructureSteps.map((step, index) => {
            const status = getStepStatus(step);
            const canProceed = canStepProceed(index);
            const isCurrentlyLoading = isSettingUp || isEnsuringDomain;
            const stepError = infraStatus?.components?.[step.component]?.error;
            const stepDetails = infraStatus?.components?.[step.component]?.details;

            return (
              <InfrastructureStep
                key={step.id}
                step={step}
                status={status}
                isActive={index === activeStep}
                canProceed={canProceed}
                isLoading={isCurrentlyLoading}
                error={stepError}
                details={stepDetails}
                actionText={status === StepStatus.ERROR ? "Retry" : "Setup"}
                onAction={() => handleSetupComponent(step.component)}
              />
            );
          })}
        </div>

        {infraStatus?.overall_status && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Overall Status</h4>
            <p className="text-sm text-gray-600">
              Status: <span className="font-medium capitalize">{infraStatus.overall_status}</span>
            </p>
            {infraStatus.estimated_completion && (
              <p className="text-sm text-gray-600">
                Estimated Completion: {new Date(infraStatus.estimated_completion).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfrastructureSetupFlow;
