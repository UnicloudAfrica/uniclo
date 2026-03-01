import React from "react";
import { AlertTriangle } from "lucide-react";

interface StorageGauge3DProps {
  usedGb: number;
  totalGb: number;
  showWarning?: boolean;
}

/**
 * 3D-style cylindrical storage gauge visualization
 * Shows used vs total capacity with color-coded warnings
 */
const StorageGauge3D: React.FC<StorageGauge3DProps> = ({ usedGb, totalGb, showWarning = true }) => {
  const safeUsedGb = usedGb ?? 0;
  const safeTotalGb = totalGb ?? 0;
  const percentage = safeTotalGb > 0 ? Math.min((safeUsedGb / safeTotalGb) * 100, 100) : 0;

  // Color thresholds
  const getColor = () => {
    if (percentage >= 95)
      return {
        fill: "rgb(var(--theme-danger-500))",
        bg: "rgb(var(--theme-danger-100))",
        text: "text-red-600",
      };
    if (percentage >= 80)
      return {
        fill: "rgb(var(--theme-warning-500))",
        bg: "rgb(var(--theme-warning-100))",
        text: "text-amber-600",
      };
    return {
      fill: "rgb(var(--theme-success-500))",
      bg: "rgb(var(--theme-success-100))",
      text: "text-emerald-600",
    };
  };

  const colors = getColor();
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  // Format storage display
  const formatStorage = (gb: number | undefined | null) => {
    const value = gb ?? 0;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} TB`;
    return `${value.toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-col items-center">
      {/* 3D Cylinder Container */}
      <div className="relative w-32 h-40">
        {/* Cylinder body - back ellipse (top cap) */}
        <div
          className="absolute top-0 left-0 w-32 h-8 rounded-[50%] border-2"
          style={{
            backgroundColor: colors.bg,
            borderColor: colors.fill,
            zIndex: 1,
          }}
        />

        {/* Cylinder body - main rectangle */}
        <div
          className="absolute top-4 left-0 w-32 h-28 border-l-2 border-r-2"
          style={{
            backgroundColor: "var(--theme-surface-alt)",
            borderColor: colors.fill,
          }}
        >
          {/* Fill level */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${percentage}%`,
              background: `linear-gradient(180deg, ${colors.fill}dd 0%, ${colors.fill} 100%)`,
            }}
          />

          {/* Liquid surface shine effect */}
          <div
            className="absolute left-2 right-2 h-1 rounded-full opacity-40 transition-all duration-1000"
            style={{
              bottom: `${percentage}%`,
              backgroundColor: "white",
              transform: "translateY(50%)",
              display: percentage > 5 ? "block" : "none",
            }}
          />

          {/* Highlight effect on cylinder */}
          <div className="absolute top-0 bottom-0 left-1 w-6 bg-gradient-to-r from-white/30 to-transparent rounded-l-full" />
        </div>

        {/* Cylinder body - front ellipse (bottom cap) */}
        <div
          className="absolute bottom-0 left-0 w-32 h-8 rounded-[50%] border-2"
          style={{
            backgroundColor: percentage > 0 ? colors.fill : "var(--theme-surface-alt)",
            borderColor: colors.fill,
            zIndex: 2,
          }}
        />
      </div>

      {/* Usage text */}
      <div className="mt-4 text-center">
        <div className={`text-2xl font-bold ${colors.text}`}>{percentage.toFixed(0)}%</div>
        <div className="text-sm text-[--theme-muted-color] mt-1">
          {formatStorage(safeUsedGb)} / {formatStorage(safeTotalGb)}
        </div>
      </div>

      {/* Warning badge */}
      {showWarning && isWarning && (
        <div
          className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {isCritical ? "Storage Critical" : "Storage Low"}
        </div>
      )}
    </div>
  );
};

export default StorageGauge3D;
