import React from "react";
import { Activity } from "lucide-react";
import { ModernButton, ModernCard } from "../../ui";
import ProjectUnifiedView, { ProjectUnifiedViewProps } from "./ProjectUnifiedView";

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
  children?: React.ReactNode;
}

const ProjectDetailsOverview: React.FC<ProjectDetailsOverviewProps> = ({
  requiredActions = [],
  onRequiredAction,
  unifiedViewProps,
  children,
}) => {
  const actionItems = requiredActions.filter(
    (item) => item?.action && !item.completed && !item.complete
  );

  return (
    <div className="space-y-6">
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
                    <div className="text-xs text-red-500 mb-2">
                      {item.missing_count} missing
                    </div>
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
