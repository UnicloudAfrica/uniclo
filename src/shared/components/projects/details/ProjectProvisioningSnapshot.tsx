import React from "react";
import { CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { ModernButton } from "../../ui";
import { designTokens } from "../../../../styles/designTokens";

interface SummaryItem {
  label?: string;
  title?: string;
  completed?: boolean;
  complete?: boolean;
  status?: string;
  missing_count?: number;
  count?: number;
}

interface InfraComponent {
  status?: string;
  count?: number;
}

interface InfraStatus {
  components?: Record<string, InfraComponent>;
}

interface EdgeComponent {
  status?: string;
  count?: number;
}

interface ProjectProvisioningSnapshotProps {
  summary?: SummaryItem[];
  providerLabel?: string;
  projectRegion?: string;
  hasTenantAdmin?: boolean;
  edgeComponent?: EdgeComponent;
  isEdgeSyncing?: boolean;
  onEdgeSync?: () => void;
  onManageEdge?: () => void;
  infraStatus?: InfraStatus;
  onEnableVpc?: () => void;
  isVpcEnabling?: boolean;
}

const ProjectProvisioningSnapshot: React.FC<ProjectProvisioningSnapshotProps> = ({
  summary = [],
  providerLabel,
  projectRegion,
  hasTenantAdmin,
  edgeComponent,
  isEdgeSyncing,
  onEdgeSync,
  onManageEdge,
  infraStatus,
  onEnableVpc,
  isVpcEnabling,
}) => {
  // Helper to check if a summary item is complete
  const isSummaryItemComplete = (labelPattern: string) => {
    if (!Array.isArray(summary)) return false;
    const item = summary.find((s) => {
      const text = s.label || s.title || "";
      return text.toLowerCase().includes(labelPattern.toLowerCase());
    });
    return item
      ? item.completed === true ||
          item.status === "completed" ||
          (item.missing_count === 0 && (item.count ?? 0) > 0)
      : false;
  };

  // Helper for infraStatus checks (Tenant/Client view)
  const isInfraComponentComplete = (key: string) => {
    if (!infraStatus?.components) return false;
    const comp = infraStatus.components[key];
    return (
      comp && (comp.status === "active" || comp.status === "completed" || (comp.count ?? 0) > 0)
    );
  };

  // Derive statuses for the 6 checklist items
  const checklistItems = [
    {
      label: "Provider Connection",
      description: "Cloud provider account linked and validated",
      isComplete:
        isSummaryItemComplete("Synced to") ||
        isInfraComponentComplete("provider") ||
        !!providerLabel,
    },
    {
      label: "Region Availability",
      description: "Selected region is active and supported",
      isComplete: !!projectRegion,
    },
    {
      label: "Network & Subnet",
      description: "VPC and Subnets configured",
      isComplete:
        (isInfraComponentComplete("vpc") && isInfraComponentComplete("subnets")) ||
        (isSummaryItemComplete("VPC Mode Enabled") && isSummaryItemComplete("Subnets Created")),
    },
    {
      label: "Security Group",
      description: "Firewall rules to allow traffic (e.g., SSH, HTTP)",
      isComplete:
        isInfraComponentComplete("security_groups") ||
        isSummaryItemComplete("Security Groups Created"),
    },
    {
      label: "Key Pair",
      description: "Required for SSH access to Linux instances",
      isComplete: isInfraComponentComplete("keypairs") || isSummaryItemComplete("Key Pair Created"),
    },
    {
      label: "Tenant Admin",
      description: "At least one user with tenant_admin privileges",
      isComplete: isSummaryItemComplete("Tenant Admin") || hasTenantAdmin,
    },
    {
      label: "Edge Configuration",
      description: "Edge network configuration synced",
      isComplete:
        (edgeComponent &&
          (edgeComponent.status === "completed" || (edgeComponent.count ?? 0) > 0)) ||
        isInfraComponentComplete("edge_networks"),
    },
    {
      label: "Base Policies",
      description: "IAM roles and policies created",
      isComplete:
        (isSummaryItemComplete("Storage Policies") && isSummaryItemComplete("Network Policies")) ||
        isInfraComponentComplete("policies"),
    },
  ];

  const completedCount = checklistItems.filter((i) => i.isComplete).length;
  const completionRatio = Math.round((completedCount / checklistItems.length) * 100);

  // Specific check for VPC enabled status (User requirement: vpc.count > 0)
  const isVpcEnabled = (() => {
    if (infraStatus?.components?.vpc) {
      return (infraStatus.components.vpc.count ?? 0) > 0;
    }
    return isSummaryItemComplete("VPC Mode Enabled");
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
        {/* Hero Card */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: "linear-gradient(135deg, #0b63ce 0%, #6aa4ff 45%, #051937 100%)",
            color: "#fff",
          }}
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                <CheckCircle size={14} />
                {completedCount} of {checklistItems.length} steps complete
              </span>
              {providerLabel && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  {providerLabel}
                </span>
              )}
              {projectRegion && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                  Region • {projectRegion}
                </span>
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="relative flex-shrink-0">
                <div
                  className="h-20 w-20 rounded-full flex items-center justify-center text-lg font-semibold"
                  style={{
                    background: `conic-gradient(${designTokens.colors.primary[200]} ${completionRatio}%, rgba(255,255,255,0.15) 0)`,
                    color: "#fff",
                  }}
                >
                  <span className="text-xl font-semibold">{completionRatio}%</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Project Setup</h2>
                <p className="mt-1 text-sm text-white/70">
                  Complete these foundational steps to provision infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions / Info Card */}
        <div className="space-y-4">
          {!isVpcEnabled && onEnableVpc && (
            <div
              className="rounded-2xl border p-4 flex flex-col justify-center"
              style={{
                borderColor: designTokens.colors.warning[200],
                backgroundColor: designTokens.colors.warning[50],
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-sm font-semibold"
                  style={{ color: designTokens.colors.warning[900] }}
                >
                  VPC Not Enabled
                </p>
              </div>
              <p className="text-xs mb-3" style={{ color: designTokens.colors.warning[700] }}>
                Enable VPC to start provisioning networks and subnets.
              </p>
              <ModernButton
                size="sm"
                className="w-full flex items-center justify-center gap-2 bg-white text-warning-700 border-warning-200 hover:bg-warning-100"
                onClick={onEnableVpc}
                disabled={isVpcEnabling}
                style={{
                  color: designTokens.colors.warning[700],
                  borderColor: designTokens.colors.warning[200],
                }}
              >
                <RefreshCw size={14} className={isVpcEnabling ? "animate-spin" : ""} />
                {isVpcEnabling ? "Enabling VPC..." : "Enable VPC"}
              </ModernButton>
            </div>
          )}

          <div
            className="rounded-2xl border p-4 flex flex-col justify-center"
            style={{
              borderColor: designTokens.colors.neutral[200],
              backgroundColor: designTokens.colors.neutral[0],
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Edge Network Sync
              </p>
              <ModernButton
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
                onClick={onManageEdge}
              >
                Manage
              </ModernButton>
            </div>
            <p className="text-xs mb-3" style={{ color: designTokens.colors.neutral[600] }}>
              {checklistItems.find((i) => i.label === "Edge Configuration")?.isComplete
                ? "Edge configuration is in sync."
                : "Synchronize edge configuration with provider."}
            </p>
            <ModernButton
              size="sm"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={onEdgeSync}
              disabled={isEdgeSyncing}
            >
              <RefreshCw size={14} className={isEdgeSyncing ? "animate-spin" : ""} />
              {isEdgeSyncing ? "Syncing..." : "Sync Configuration"}
            </ModernButton>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {checklistItems.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl border p-4 transition-all"
            style={{
              borderColor: item.isComplete
                ? designTokens.colors.success[200]
                : designTokens.colors.neutral[200],
              backgroundColor: item.isComplete ? designTokens.colors.success[50] : "#FFFFFF",
            }}
          >
            <div className={`mt-0.5 ${item.isComplete ? "text-emerald-500" : "text-gray-300"}`}>
              {item.isComplete ? (
                <CheckCircle size={20} />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
              )}
            </div>
            <div>
              <h4
                className={`text-sm font-semibold ${item.isComplete ? "text-emerald-900" : "text-gray-900"}`}
              >
                {item.label}
              </h4>
              <p
                className={`text-xs mt-1 ${item.isComplete ? "text-emerald-700" : "text-gray-500"}`}
              >
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectProvisioningSnapshot;
