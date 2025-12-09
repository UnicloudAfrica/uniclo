import React from "react";
import { Star, Flame, Zap } from "lucide-react";

/**
 * FilterPresets - Quick filter presets for common lead views
 */
const FilterPresets = ({ activePreset, onPresetChange }) => {
  const presets = [
    {
      id: "all",
      label: "All Leads",
      description: "View entire pipeline",
      icon: null,
      color: "text-slate-600",
    },
    {
      id: "hot",
      label: "Hot Leads",
      description: "Score 80+",
      icon: <Flame className="h-4 w-4" />,
      color: "text-rose-600",
    },
    {
      id: "engaged",
      label: "Engaged",
      description: "Active conversations",
      icon: <Zap className="h-4 w-4" />,
      color: "text-amber-600",
    },
    {
      id: "favorites",
      label: "Favorites",
      description: "Starred leads",
      icon: <Star className="h-4 w-4" />,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {presets.map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetChange(preset.id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-primary-500 bg-primary-50 text-primary-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            {preset.icon && <span className={preset.color}>{preset.icon}</span>}
            <span>{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FilterPresets;
