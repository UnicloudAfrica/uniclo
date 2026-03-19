/**
 * GettingStartedChecklist — Collapsible "Getting Started" guide for the Overview tab.
 *
 * Shows a step-by-step checklist that guides novice users through their first
 * cloud infrastructure setup. Each step links to the relevant tab.
 *
 * Auto-hides when all steps are completed.
 */
import React, { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Layers,
  Network,
  Rocket,
  Server,
  Shield,
  Users,
} from "lucide-react";
import { ModernButton } from "../../ui";
import { isFeatureSupported } from "@/utils/featureGating";

interface ChecklistStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  targetTab: string;
  isComplete: boolean;
}

interface GettingStartedChecklistProps {
  /** Number of running instances */
  instanceCount: number;
  /** Number of VPCs */
  vpcCount: number;
  /** Number of subnets */
  subnetCount: number;
  /** Number of security groups */
  securityGroupCount: number;
  /** Is internet / edge network set up? */
  internetEnabled: boolean;
  /** Number of team members */
  teamMemberCount: number;
  /** DNS zone count */
  dnsZoneCount?: number;
  /** Auto-scaling group count */
  asgCount?: number;
  /** Cloud provider name — controls which steps are shown */
  provider?: string;
  /** Number of floating IPs (Nobus) */
  floatingIpCount?: number;
  /** Navigate to a specific tab */
  onNavigateToTab: (tabId: string) => void;
}

const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({
  instanceCount,
  vpcCount,
  subnetCount,
  securityGroupCount,
  internetEnabled,
  teamMemberCount,
  dnsZoneCount = 0,
  asgCount = 0,
  provider,
  floatingIpCount = 0,
  onNavigateToTab,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const supportsVpc = isFeatureSupported(provider, "vpcs");
  const supportsInternet = isFeatureSupported(provider, "internet_gateways");
  const supportsDns = isFeatureSupported(provider, "dns");
  const supportsAutoScaling = isFeatureSupported(provider, "autoscaling");

  // Build steps conditionally based on provider capabilities
  const steps: ChecklistStep[] = useMemo(() => {
    const result: ChecklistStep[] = [];

    if (supportsVpc) {
      result.push({
        id: "networking",
        label: "Set up networking",
        description: "Create a VPC and subnet to host your servers",
        icon: Network,
        targetTab: "networking",
        isComplete: vpcCount > 0 && subnetCount > 0,
      });
    }

    result.push({
      id: "security",
      label: "Configure security",
      description: "Set up security groups to control inbound/outbound traffic",
      icon: Shield,
      targetTab: supportsVpc ? "networking" : "compute",
      isComplete: securityGroupCount > 0,
    });

    if (supportsInternet) {
      result.push({
        id: "internet",
        label: "Enable internet access",
        description: "Connect your network to the internet via a gateway",
        icon: Globe,
        targetTab: "networking",
        isComplete: internetEnabled,
      });
    }

    result.push({
      id: "compute",
      label: "Launch your first server",
      description: "Create a virtual machine (instance) to run your applications",
      icon: Server,
      targetTab: "compute",
      isComplete: instanceCount > 0,
    });

    if (!supportsVpc) {
      // Show floating IP step for providers without VPC support
      result.push({
        id: "public_access",
        label: "Assign public access",
        description: "Create a floating IP so your server is reachable from the internet",
        icon: Globe,
        targetTab: "compute",
        isComplete: floatingIpCount > 0,
      });
    }

    if (supportsDns) {
      result.push({
        id: "dns",
        label: "Set up DNS (optional)",
        description: "Map a domain name to your server\u2019s IP address",
        icon: Globe,
        targetTab: "dns",
        isComplete: dnsZoneCount > 0,
      });
    }

    if (supportsAutoScaling) {
      result.push({
        id: "autoscaling",
        label: "Configure auto-scaling (optional)",
        description: "Automatically add or remove servers based on demand",
        icon: Layers,
        targetTab: "autoscaling",
        isComplete: asgCount > 0,
      });
    }

    result.push({
      id: "team",
      label: "Invite your team (optional)",
      description: "Add collaborators so they can manage resources too",
      icon: Users,
      targetTab: "team",
      isComplete: teamMemberCount > 1,
    });

    return result;
  }, [
    supportsVpc,
    supportsInternet,
    supportsDns,
    supportsAutoScaling,
    vpcCount,
    subnetCount,
    securityGroupCount,
    internetEnabled,
    instanceCount,
    floatingIpCount,
    dnsZoneCount,
    asgCount,
    teamMemberCount,
  ]);

  // Count required (non-optional) steps: all steps before the first optional one
  const totalRequired = steps.findIndex((s) => s.label.includes("(optional)"));
  const effectiveTotalRequired = totalRequired === -1 ? steps.length : totalRequired;

  const completedCount = steps.filter((s) => s.isComplete).length;
  const requiredComplete = steps.slice(0, effectiveTotalRequired).filter((s) => s.isComplete).length;
  const allRequiredDone = requiredComplete >= effectiveTotalRequired;
  const allDone = completedCount === steps.length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Auto-hide when all steps (including optional) are complete
  if (allDone) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Rocket className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-900">
              {allRequiredDone ? "Great progress!" : "Getting Started"}
            </h3>
            <p className="text-sm text-gray-500">
              {allRequiredDone
                ? "Core setup is done! Complete optional steps to get the most out of your project."
                : `${completedCount} of ${steps.length} steps completed \u2014 follow these steps to set up your infrastructure`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress ring */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-blue-200"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3"
                  cx="18"
                  cy="18"
                  r="15"
                />
                <circle
                  className="text-blue-600 transition-all duration-500"
                  stroke="currentColor"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  cx="18"
                  cy="18"
                  r="15"
                  strokeDasharray={`${progressPercent * 0.942} 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-700">
                {progressPercent}%
              </span>
            </div>
          </div>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Steps */}
      {isExpanded && (
        <div className="px-3 pb-3 md:px-4 md:pb-4 space-y-2">
          {steps.map((step, idx) => {
            const StepIcon = step.icon;
            const isOptional = idx >= effectiveTotalRequired;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2.5 md:p-3 rounded-lg transition-all ${
                  step.isComplete
                    ? "bg-green-50/60 border border-green-200"
                    : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm"
                }`}
              >
                {/* Status indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.isComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {step.isComplete ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="text-xs font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        step.isComplete ? "text-green-800 line-through" : "text-gray-900"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isOptional && !step.isComplete && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-400 bg-gray-100 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-0.5 hidden sm:block ${
                      step.isComplete ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {step.isComplete ? "Completed" : step.description}
                  </p>
                </div>

                {/* Action */}
                {!step.isComplete && (
                  <ModernButton
                    size="xs"
                    variant={isOptional ? "outline" : "primary"}
                    onClick={() => onNavigateToTab(step.targetTab)}
                    className="flex-shrink-0"
                  >
                    <StepIcon className="w-3.5 h-3.5" />
                    Go
                  </ModernButton>
                )}
                {step.isComplete && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GettingStartedChecklist;
