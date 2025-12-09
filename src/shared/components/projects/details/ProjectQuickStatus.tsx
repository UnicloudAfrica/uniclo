import React from "react";
import { StatusPill } from "../../ui";
import { designTokens } from "../../../../styles/designTokens";

interface QuickStatusItem {
  label: string;
  active: boolean;
  tone?: string;
}

interface ProjectQuickStatusProps {
  quickStatusItems?: QuickStatusItem[];
}

const ProjectQuickStatus: React.FC<ProjectQuickStatusProps> = ({ quickStatusItems = [] }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold" style={{ color: designTokens.colors.neutral[800] }}>
        Quick Status
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
        {quickStatusItems.map((item, index) => (
          <StatusPill
            key={index}
            status={item.active ? "success" : "error"}
            label={item.label}
            showIcon
          />
        ))}
      </div>
      {/* Note: Original had distinct logic for tone mapping to designTokens directly. 
                StatusPill might need adjustment if 'label' overrides status text.
                StatusPill signature: ({ status, label, className, size, showIcon = false, variant = 'soft' })
                So we can pass label explicitly. 
                Standard StatusPill maps 'status' string to color. 
                Since we want 'item.label' shown but color derived from 'item.active', passing status="success"/"error" works.
            */}
    </div>
  );
};

export default ProjectQuickStatus;
