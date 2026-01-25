// @ts-nocheck
import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  Play,
  AlertCircle,
  Loader2,
  Network,
  Shield,
  Server,
  Globe,
  Zap,
  Key,
  ChevronRight,
  Info,
} from "lucide-react";
import {
  useFetchProjectInfrastructure,
  useSetupComponent,
} from "../../hooks/adminHooks/infrastructureHooks";
import { toast } from "sonner";

const InfrastructureSetupFlow = ({ projectId, region }: any) => {
  const [expandedStep, setExpandedStep] = useState(null);

  // Fetch infrastructure status with real-time polling
  const {
    data: infraData,
    isFetching: isLoading,
    error: infraError,
  } = useFetchProjectInfrastructure(projectId, region);

  const { mutate: setupComponent, isPending: isSettingUp } = useSetupComponent();

  // Component configuration
  const infrastructureComponents = [
    {
      id: "vpc",
      title: "Virtual Private Cloud (VPC)",
      description: "Isolated network environment for your cloud resources",
      icon: Network,
      priority: "high",
      requires: [],
      estimatedTime: "2 min",
    },
    {
      id: "edge_networks",
      title: "Edge Networks",
      description: "Edge computing and CDN capabilities",
      icon: Zap,
      priority: "medium",
      requires: ["vpc"],
      estimatedTime: "3 min",
    },
    {
      id: "security_groups",
      title: "Security Groups",
      description: "Network security rules and firewall configuration",
      icon: Shield,
      priority: "medium",
      requires: ["vpc"],
      estimatedTime: "2 min",
    },
    {
      id: "subnets",
      title: "Subnets",
      description: "Network subnets for resource organization",
      icon: Server,
      priority: "medium",
      requires: ["vpc"],
      estimatedTime: "2 min",
    },
    {
      id: "internet_gateways",
      title: "Internet Gateways",
      description: "Internet connectivity for your VPC",
      icon: Globe,
      priority: "low",
      requires: ["vpc"],
      estimatedTime: "1 min",
    },
    {
      id: "key_pairs",
      title: "SSH Key Pairs",
      description: "Secure access keys for your instances",
      icon: Key,
      priority: "low",
      requires: [],
      estimatedTime: "1 min",
    },
  ];

  const handleSetupComponent = async (component) => {
    try {
      await setupComponent({
        projectId,
        component: component.id,
        config: { region },
        autoConfig: true,
      });

      toast.success(`${component.title} setup initiated successfully!`, {
        description: "Setup is running in the background. Status will update shortly.",
      });

      // Expand the next logical step
      const nextComponent = getNextRecommendedComponent();
      if (nextComponent) {
        setExpandedStep(nextComponent.id);
      }
    } catch (error) {
      console.error("Setup failed:", error);
      toast.error(`Failed to setup ${component.title}`, {
        description: error.message || "Please try again or contact support.",
      });
    }
  };

  const getComponentStatus = (componentId: any) => {
    if (!infraData?.infrastructure) return "pending";
    const component = infraData.infrastructure[componentId];
    return component?.status || "pending";
  };

  const getComponentDetails = (componentId: any) => {
    if (!infraData?.infrastructure) return {};
    const component = infraData.infrastructure[componentId];
    return {
      count: component?.count || 0,
      details: component?.details || [],
      readyForSetup: component?.ready_for_setup || false,
      requires: component?.requires || [],
    };
  };

  const isComponentReady = (component: any) => {
    const status = getComponentStatus(component.id);
    const details = getComponentDetails(component.id);

    if (status === "configured") return false; // Already configured
    if (component.requires.length === 0) return true; // No prerequisites

    // Check if all required components are configured
    return component.requires.every((req) => getComponentStatus(req) === "configured");
  };

  const getNextRecommendedComponent = () => {
    return infrastructureComponents.find((comp) => {
      const status = getComponentStatus(comp.id);
      return status !== "configured" && isComponentReady(comp);
    });
  };

  const calculateOverallProgress = () => {
    if (!infraData?.completion_percentage) return 0;
    return infraData.completion_percentage;
  };

  const getStatusIcon = (status: any, isReady: any) => {
    switch (status) {
      case "configured":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "ready":
        return isReady ? (
          <Play className="w-5 h-5 text-blue-600" />
        ) : (
          <Clock className="w-5 h-5 text-yellow-600" />
        );
      case "pending":
        return <Clock className="w-5 h-5 text-gray-400" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: any, isReady: any) => {
    switch (status) {
      case "configured":
        return "border-green-200 bg-green-50";
      case "ready":
        return isReady ? "border-blue-200 bg-blue-50" : "border-yellow-200 bg-yellow-50";
      case "pending":
        return "border-gray-200 bg-gray-50";
      case "failed":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  if (isLoading && !infraData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#288DD1]" />
        <span className="ml-2 text-gray-600">Loading infrastructure status...</span>
      </div>
    );
  }

  if (infraError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 font-medium mb-1">Failed to load infrastructure status</p>
        <p className="text-red-600 text-sm">{infraError.message}</p>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();
  const nextComponent = getNextRecommendedComponent();

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Infrastructure Setup Progress</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{overallProgress}% Complete</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-[var(--theme-color)] to-[rgb(var(--theme-color-600))] h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Next Step Recommendation */}
        {nextComponent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Recommended Next Step</span>
            </div>
            <p className="text-blue-800 text-sm mb-3">
              Configure {nextComponent.title} to continue your infrastructure setup
            </p>
            <button
              onClick={() => handleSetupComponent(nextComponent)}
              disabled={isSettingUp}
              className="flex items-center gap-2 px-4 py-2 bg-[#288DD1] text-white rounded-lg hover:bg-[#1976D2] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSettingUp ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <nextComponent.icon className="w-4 h-4" />
              )}
              Configure {nextComponent.title}
            </button>
          </div>
        )}
      </div>

      {/* Infrastructure Components */}
      <div className="space-y-4">
        {infrastructureComponents.map((component: any) => {
          const status = getComponentStatus(component.id);
          const details = getComponentDetails(component.id);
          const isReady = isComponentReady(component);
          const isExpanded = expandedStep === component.id;

          return (
            <div
              key={component.id}
              className={`border rounded-lg transition-all duration-200 ${getStatusColor(status, isReady)}`}
            >
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedStep(isExpanded ? null : component.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status, isReady)}
                    <component.icon className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{component.title}</h4>
                      <p className="text-sm text-gray-600">{component.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {status === "configured"
                          ? "Configured"
                          : status === "ready" && isReady
                            ? "Ready"
                            : "Waiting"}
                      </div>
                      {details.count > 0 && (
                        <div className="text-xs text-gray-500">{details.count} items</div>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="pt-4 space-y-3">
                    {/* Prerequisites */}
                    {component.requires.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Prerequisites:</p>
                        <div className="flex flex-wrap gap-2">
                          {component.requires.map((req: any) => {
                            const reqStatus = getComponentStatus(req);
                            return (
                              <span
                                key={req}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  reqStatus === "configured"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {reqStatus === "configured" ? "✓" : "○"} {req.replace("_", " ")}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Component Details */}
                    {details.details.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Configured Resources ({details.count}):
                        </p>
                        <div className="space-y-1">
                          {details.details.slice(0, 3).map((item, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-gray-600 bg-white px-2 py-1 rounded"
                            >
                              {item.name || item.id} {item.cidr_block && `(${item.cidr_block})`}
                            </div>
                          ))}
                          {details.details.length > 3 && (
                            <div className="text-xs text-gray-500">
                              ... and {details.details.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    {status !== "configured" && (
                      <div className="pt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetupComponent(component);
                          }}
                          disabled={!isReady || isSettingUp}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isReady && !isSettingUp
                              ? "bg-[#288DD1] text-white hover:bg-[#1976D2]"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {isSettingUp ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <component.icon className="w-4 h-4" />
                          )}
                          {isReady ? `Setup ${component.title}` : "Prerequisites Required"}
                          <span className="text-xs opacity-70">(~{component.estimatedTime})</span>
                        </button>
                        {!isReady && component.requires.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Complete {component.requires.join(", ")} first
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {overallProgress >= 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-1">
            Infrastructure Setup Complete!
          </h3>
          <p className="text-green-700">
            All infrastructure components have been configured successfully. Your project is ready
            for deployment.
          </p>
        </div>
      )}
    </div>
  );
};

export default InfrastructureSetupFlow;
