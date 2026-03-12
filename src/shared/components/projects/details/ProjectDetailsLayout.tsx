import React from "react";
import { LayoutDashboard } from "lucide-react";
import ProjectDetailsHeader from "./ProjectDetailsHeader";
import type { ProjectDetailsLayoutProps } from "./types";

const ProjectDetailsLayout: React.FC<ProjectDetailsLayoutProps> = ({
  project,
  resourceStats,
  tabs,
  activeTab,
  onTabChange,
  contentClassName = "",
}) => {
  const visibleTabs = tabs.filter((tab) => !tab.hidden);
  const fallbackTab = visibleTabs[0];
  const currentTab = visibleTabs.find((tab) => tab.id === activeTab) || fallbackTab;

  const renderPlaceholder = (label?: string) => (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
        <LayoutDashboard className="text-gray-300" size={32} />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{label || "Module"}</h3>
      <p className="text-gray-500 text-sm max-w-md text-center">
        We're currently refactoring this module into the unified view. Check back soon for
        Zadara-style management controls!
      </p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-[calc(100vh-180px)]">
      <ProjectDetailsHeader project={project} resourceStats={resourceStats} />

      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 lg:px-8 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex overflow-x-auto no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab?.id === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                title={tab.tooltip}
                className={`flex items-center gap-2 px-3 py-3 md:px-6 md:py-4 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {Icon && <Icon size={18} />}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className={`flex-1 p-3 sm:p-4 md:p-6 overflow-auto ${contentClassName}`.trim()}>
        <div className="max-w-[1600px] mx-auto">
          {currentTab?.content ? currentTab.content : renderPlaceholder(currentTab?.label)}
        </div>
      </main>
    </div>
  );
};

export default ProjectDetailsLayout;
