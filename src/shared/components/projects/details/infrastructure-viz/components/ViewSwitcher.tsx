/**
 * ViewSwitcher.tsx
 *
 * A tab bar that toggles between the 3 visualization modes:
 * Building Metaphor, Layered Diagram, and Infographic Cards.
 */
import React from "react";
import { Building2, GitBranch, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import type { ViewMode } from "../InfrastructureVisualization.types";

interface ViewSwitcherProps {
  activeView: ViewMode;
  onChangeView: (view: ViewMode) => void;
}

const VIEW_OPTIONS: Array<{
  id: ViewMode;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortLabel: string;
}> = [
  { id: "building", label: "Building View", icon: Building2, shortLabel: "Building" },
  { id: "layered", label: "Diagram", icon: GitBranch, shortLabel: "Diagram" },
  { id: "infographic", label: "Dashboard", icon: LayoutDashboard, shortLabel: "Cards" },
];

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ activeView, onChangeView }) => {
  return (
    <div className="flex items-center gap-1 mb-3 bg-gray-100 rounded-lg p-1 w-fit">
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isActive = activeView === option.id;

        return (
          <button
            key={option.id}
            onClick={() => onChangeView(option.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              isActive ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="viz-tab-indicator"
                className="absolute inset-0 bg-white rounded-md shadow-sm"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <Icon size={14} />
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">{option.shortLabel}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewSwitcher;
