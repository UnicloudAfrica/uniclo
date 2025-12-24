import React from "react";
import { LayoutGrid, Layers } from "lucide-react";

interface ProjectViewToggleProps {
  mode: "simple" | "advanced";
  onChange: (mode: "simple" | "advanced") => void;
}

const ProjectViewToggle: React.FC<ProjectViewToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onChange("simple")}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
          ${
            mode === "simple"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }
        `}
      >
        <LayoutGrid className="w-4 h-4" />
        Simple
      </button>
      <button
        onClick={() => onChange("advanced")}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all
          ${
            mode === "advanced"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }
        `}
      >
        <Layers className="w-4 h-4" />
        Advanced
      </button>
    </div>
  );
};

export default ProjectViewToggle;
