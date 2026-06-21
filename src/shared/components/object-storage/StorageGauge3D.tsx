import React from "react";
import { AlertTriangle } from "lucide-react";

interface StorageGauge3DProps {
  usedGb: number;
  totalGb: number;
  showWarning?: boolean;
}

/**
 * Animated 3D-style cylindrical storage gauge.
 *
 * The cylinder gently bobs, a sheen of light sweeps around its curved body, and
 * the fill behaves like liquid — a rippling surface with rising bubbles. All
 * motion is disabled under `prefers-reduced-motion`. Capacity is colour-coded
 * (success / warning / danger). Keyframes are scoped with an `osg-` prefix.
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
  const hasLiquid = percentage > 2;

  // Format storage display
  const formatStorage = (gb: number | undefined | null) => {
    const value = gb ?? 0;
    if (value >= 1000) return `${(value / 1000).toFixed(1)} TB`;
    return `${value.toFixed(1)} GB`;
  };

  return (
    <div className="flex flex-col items-center">
      <style>{`
        @keyframes osg-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes osg-sheen { 0% { transform: translateX(-180%) skewX(-12deg); } 100% { transform: translateX(220%) skewX(-12deg); } }
        @keyframes osg-wave { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } }
        @keyframes osg-bubble { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 15% { opacity: 0.7; } 100% { transform: translateY(-64px) scale(1); opacity: 0; } }
        .osg-cyl { animation: osg-bob 4.5s ease-in-out infinite; will-change: transform; }
        .osg-sheen { animation: osg-sheen 4s ease-in-out infinite; }
        .osg-wave { animation: osg-wave 2.6s linear infinite; }
        .osg-bubble { animation: osg-bubble 3.4s ease-in infinite; }
        @media (prefers-reduced-motion: reduce) {
          .osg-cyl, .osg-sheen, .osg-wave, .osg-bubble { animation: none !important; }
        }
      `}</style>

      {/* 3D Cylinder Container */}
      <div className="osg-cyl relative h-40 w-32" style={{ perspective: "600px" }}>
        {/* Back ellipse (top cap) */}
        <div
          className="absolute left-0 top-0 h-8 w-32 rounded-[50%] border-2"
          style={{ backgroundColor: colors.bg, borderColor: colors.fill, zIndex: 3 }}
        />

        {/* Cylinder body */}
        <div
          className="absolute left-0 top-4 h-28 w-32 overflow-hidden border-l-2 border-r-2"
          style={{ backgroundColor: "var(--theme-surface-alt)", borderColor: colors.fill }}
        >
          {/* Liquid fill */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{ height: `${percentage}%`, backgroundColor: colors.fill }}
          >
            {hasLiquid && (
              <>
                {/* Rippling liquid surface — two offset wave bands */}
                <div
                  className="osg-wave absolute -top-2 left-0 h-4 w-[200%] rounded-[50%] opacity-80"
                  style={{ backgroundColor: colors.fill }}
                />
                <div
                  className="osg-wave absolute -top-1.5 left-0 h-3 w-[200%] rounded-[50%] opacity-50"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)", animationDuration: "3.4s" }}
                />
                {/* Rising bubbles */}
                <div className="osg-bubble absolute bottom-2 left-6 h-1.5 w-1.5 rounded-full bg-white/70" />
                <div
                  className="osg-bubble absolute bottom-1 left-16 h-1 w-1 rounded-full bg-white/60"
                  style={{ animationDelay: "1.2s" }}
                />
                <div
                  className="osg-bubble absolute bottom-3 left-24 h-1 w-1 rounded-full bg-white/50"
                  style={{ animationDelay: "2.1s" }}
                />
              </>
            )}
          </div>

          {/* Sweeping sheen — reads as light rotating around the cylinder */}
          <div
            className="osg-sheen absolute inset-y-0 left-0 w-10"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
            }}
          />

          {/* Static left highlight for curvature */}
          <div className="absolute bottom-0 left-1 top-0 w-6 rounded-l-full bg-gradient-to-r from-white/25 to-transparent" />
        </div>

        {/* Front ellipse (bottom cap) */}
        <div
          className="absolute bottom-0 left-0 h-8 w-32 rounded-[50%] border-2"
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
        <div className="mt-1 text-sm text-[--theme-muted-color]">
          {formatStorage(safeUsedGb)} / {formatStorage(safeTotalGb)}
        </div>
      </div>

      {/* Warning badge */}
      {showWarning && isWarning && (
        <div
          className={`mt-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
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
