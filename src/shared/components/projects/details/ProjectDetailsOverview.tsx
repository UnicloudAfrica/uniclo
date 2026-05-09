import React from "react";
import { Activity } from "lucide-react";
import { ModernButton, ModernCard } from "../../ui";
import ProjectUnifiedView, { ProjectUnifiedViewProps } from "./ProjectUnifiedView";
import GettingStartedChecklist from "./GettingStartedChecklist";

interface RequiredActionPayload {
  method?: string;
  endpoint?: string;
  label?: string;
}

interface RequiredActionItem {
  title?: string;
  key?: string;
  missing_count?: number;
  completed?: boolean;
  complete?: boolean;
  action?: RequiredActionPayload;
}

interface ProjectDetailsOverviewProps {
  requiredActions?: RequiredActionItem[];
  onRequiredAction?: (action: RequiredActionPayload, item: RequiredActionItem) => void;
  unifiedViewProps: ProjectUnifiedViewProps;
  /** Navigate to another tab (for Getting Started links) */
  onNavigateToTab?: (tabId: string) => void;
  children?: React.ReactNode;
}

const ProjectDetailsOverview: React.FC<ProjectDetailsOverviewProps> = ({
  requiredActions = [],
  onRequiredAction,
  unifiedViewProps,
  onNavigateToTab,
  children,
}) => {
  // Use the backend-supplied capability map instead of the legacy provider key.
  // `provider_features` ships on every Project resource and is keyed by ability,
  // not by vendor name — see backend ProviderIdMapper / ProjectResource.
  const providerFeatures = (
    unifiedViewProps.project as { provider_features?: Record<string, boolean> } | undefined
  )?.provider_features;

  const ACTION_FEATURE_MAP: Record<string, string> = {
    vpc_enabled: "vpc",
    user_auth: "user_authentication",
    authenticate_users: "user_authentication",
    edge_network: "edge_network",
  };

  const actionItems = requiredActions
    .filter((item) => item?.action && !item.completed && !item.complete)
    .filter((item) => {
      const featureKey = ACTION_FEATURE_MAP[item.key ?? ""];
      if (!featureKey) return true;
      // Prefer backend-supplied flag; fall back to permissive default if the
      // map hasn't been hydrated yet (item still shown until response lands).
      return providerFeatures?.[featureKey] ?? true;
    });

  // Derive checklist data from props already flowing through the overview
  const rc: Partial<import("./ProjectUnifiedView").ResourceCounts> = unifiedViewProps.resourceCounts ?? {};
  const instanceCount = unifiedViewProps.instanceStats?.total ?? 0;
  const internetEnabled = Boolean(
    (unifiedViewProps.networkStatus?.internet_gateway?.details as { enabled?: boolean } | undefined)?.enabled ??
    unifiedViewProps.edgeNetworkConnected ??
    (rc.internet_gateways ?? 0) > 0
  );

  return (
    <div className="space-y-6">
      {/* Getting Started Checklist — shows until all core steps are done */}
      {onNavigateToTab && (
        <GettingStartedChecklist
          providerFeatures={
            (unifiedViewProps.project as { provider_features?: Record<string, boolean> } | undefined)
              ?.provider_features
          }
          instanceCount={instanceCount}
          vpcCount={rc.vpcs ?? 0}
          subnetCount={rc.subnets ?? 0}
          securityGroupCount={rc.security_groups ?? 0}
          internetEnabled={internetEnabled}
          teamMemberCount={rc.users ?? 0}
          floatingIpCount={rc.floating_ips ?? 0}
          onNavigateToTab={onNavigateToTab}
        />
      )}

      {actionItems.length > 0 && (
        <ModernCard className="border-l-4 border-l-yellow-400 bg-yellow-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="text-yellow-600" size={20} />
              <h3 className="text-lg font-semibold text-gray-900">Required Actions</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionItems.map((item, idx) => (
              <div
                key={item.key || item.title || idx}
                className="bg-white p-4 rounded-lg border border-yellow-200 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{item.title}</div>
                  {item.missing_count ? (
                    <div className="text-xs text-red-500 mb-2">{item.missing_count} missing</div>
                  ) : null}
                </div>
                <ModernButton
                  size="sm"
                  variant="primary"
                  className="w-full mt-3"
                  onClick={() => item.action && onRequiredAction?.(item.action, item)}
                >
                  {item.action?.label || "Resolve"}
                </ModernButton>
              </div>
            ))}
          </div>
        </ModernCard>
      )}

      <ProjectUnifiedView {...unifiedViewProps} />

      {children ? (
        <ModernCard variant="outlined" padding="lg">
          {children}
        </ModernCard>
      ) : null}
    </div>
  );
};

export default ProjectDetailsOverview;
