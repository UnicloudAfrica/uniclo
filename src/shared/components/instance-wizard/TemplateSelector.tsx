import React, { useMemo } from "react";
import { useInstanceTemplates, InstanceTemplate } from "../../../hooks/useInstanceTemplates";
import { LayoutTemplate, Loader2, Trash2, Zap, Settings } from "lucide-react";

interface Props {
  onSelect: (template: InstanceTemplate) => void;
  onCustomize?: (template: InstanceTemplate) => void;
  selectedTemplateId?: string | null;
  showActions?: boolean; // Show Quick Deploy/Customize buttons
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
}

const TemplateSelector: React.FC<Props> = ({
  onSelect,
  onCustomize,
  selectedTemplateId,
  showActions = true,
  primaryActionLabel = "Quick Deploy",
  secondaryActionLabel = "Customize",
}) => {
  const { templates, isLoading, deleteTemplate } = useInstanceTemplates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading templates...
      </div>
    );
  }

  if (templates.length === 0) {
    return null; // Hide if no templates
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <LayoutTemplate className="w-5 h-5 text-primary-600" />
        <h3 className="text-lg font-semibold text-slate-900">Quick Start from Template</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => {
          const isSelected = selectedTemplateId === tpl.id;
          return (
            <div
              key={tpl.id}
              className={`
                 relative group rounded-xl border p-4 transition-all
                 ${
                   isSelected
                     ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                     : "border-slate-200 bg-white hover:border-primary-300 hover:shadow-md"
                 }
               `}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{tpl.name}</p>
                  {tpl.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{tpl.description}</p>
                  )}

                  {/* Configuration Summary Badge */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tpl.configuration?.region && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                        {tpl.configuration.region}
                      </span>
                    )}
                    {tpl.configuration?.compute?.vcpu && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {tpl.configuration.compute.vcpu} vCPU
                      </span>
                    )}
                    {tpl.configuration?.compute?.ram_mb && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {Math.round(tpl.configuration.compute.ram_mb / 1024)}GB RAM
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete Action (hover only) */}
                <button
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this template?")) deleteTemplate(tpl.id);
                  }}
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              {showActions && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect(tpl);
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    {primaryActionLabel}
                  </button>
                  {onCustomize && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCustomize(tpl);
                      }}
                      className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Settings className="w-4 h-4" />
                      {secondaryActionLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateSelector;
