/**
 * ResourceNode.tsx
 *
 * Custom React Flow node that displays a single cloud resource as a compact card.
 * Used by the LayeredDiagramView to render nodes in the diagram.
 */
import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Data shape passed via React Flow node.data
// ---------------------------------------------------------------------------

export interface ResourceNodeData {
  icon: LucideIcon;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  isHighlighted: boolean;
  isSelected: boolean;
  status?: "configured" | "not_configured";
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ResourceNodeComponent({ data }: { data: ResourceNodeData }) {
  const { icon: Icon, label, count, color, bgColor, isHighlighted, isSelected, status } = data;

  // Derive Tailwind color tokens from the `color` string (e.g. "text-indigo-500" -> "indigo")
  const ringClasses = isSelected
    ? "ring-2 ring-blue-500 shadow-md"
    : isHighlighted
      ? "ring-2 ring-blue-300"
      : "";

  const highlightBg = isHighlighted && !isSelected ? "brightness-105" : "";

  return (
    <div
      className={[
        "relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-2",
        "w-[150px] cursor-pointer transition-all duration-150",
        ringClasses,
      ]
        .filter(Boolean)
        .join(" ")}
      style={highlightBg ? { filter: "brightness(1.05)" } : undefined}
    >
      {/* --- Handles for React Flow edges --- */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-gray-300 !border-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-gray-300 !border-none"
      />

      {/* --- Icon box --- */}
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-md",
          bgColor,
          "h-8 w-8",
        ].join(" ")}
      >
        <Icon className={`${color} h-4 w-4`} />
      </div>

      {/* --- Label + count --- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[11px] font-medium leading-tight text-gray-700">
          {label}
        </span>

        <div className="mt-0.5 flex items-center gap-1.5">
          {/* Count badge */}
          <span className="inline-flex items-center rounded bg-gray-100 px-1 text-[10px] font-semibold text-gray-600">
            {count}
          </span>

          {/* Status dot */}
          {status !== undefined && (
            <span
              className={[
                "inline-block h-1.5 w-1.5 rounded-full",
                status === "configured" ? "bg-green-400" : "bg-gray-300",
              ].join(" ")}
              title={status === "configured" ? "Configured" : "Not configured"}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ResourceNode = memo(ResourceNodeComponent);

export default ResourceNode;
