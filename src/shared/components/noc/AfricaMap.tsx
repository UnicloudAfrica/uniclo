import React from "react";
import { useReducedMotion } from "@/hooks/useAnimations";
import type { NocRegionSummary, NocStatus } from "@/hooks/adminHooks/nocHooks";

/**
 * AfricaMap — multi-region health map.
 *
 * A11y:
 *   - Each pin renders as a focusable, keyboard-activatable button (Enter/Space).
 *   - SVG <animate> pulses are gated on prefers-reduced-motion.
 *   - Each pin announces its region name + status via aria-label.
 */

const LON_MIN = -20;
const LON_MAX = 55;
const LAT_MIN = -35;
const LAT_MAX = 38;
const WIDTH = 600;
const HEIGHT = 600;

const project = (lat: number, lng: number): { x: number; y: number; onMap: boolean } => {
  const x = ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * WIDTH;
  const y = HEIGHT - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * HEIGHT;
  const onMap = x >= -40 && x <= WIDTH + 40 && y >= -40 && y <= HEIGHT + 40;
  return { x, y, onMap };
};

const STATUS_COLOR_VAR: Record<NocStatus, string> = {
  green: "rgb(var(--theme-success-500))",
  amber: "rgb(var(--theme-warning-500))",
  red: "rgb(var(--theme-danger-500))",
  unknown: "rgb(var(--theme-neutral-400))",
  offline: "rgb(var(--theme-neutral-600))",
};

const STATUS_LABEL: Record<NocStatus, string> = {
  green: "Healthy",
  amber: "Degraded",
  red: "Critical",
  unknown: "Unknown",
  offline: "Offline",
};

interface Props {
  regions: NocRegionSummary[];
  onRegionClick?: (region: NocRegionSummary) => void;
  highlightedCode?: string;
  className?: string;
}

const AFRICA_OUTLINE = `
M 250,50
L 310,40 L 380,60 L 430,110 L 470,180 L 490,260
L 510,330 L 520,400 L 495,470 L 450,520 L 400,555
L 340,575 L 280,570 L 220,545 L 175,500 L 140,440
L 115,370 L 100,295 L 110,220 L 140,150 L 190,90 Z
`;

const AfricaMap: React.FC<Props> = ({ regions, onRegionClick, highlightedCode, className = "" }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className={`w-full h-full font-outfit ${className}`}
      role="img"
      aria-label="Multi-region NOC map of Africa"
    >
      <defs>
        <radialGradient id="noc-bg" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--theme-color-900))" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgb(var(--theme-neutral-900))" />
        </radialGradient>
        <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width={WIDTH} height={HEIGHT} fill="url(#noc-bg)" />

      <path
        d={AFRICA_OUTLINE}
        fill="rgb(var(--theme-neutral-800))"
        stroke="rgb(var(--theme-neutral-700))"
        strokeWidth={1.5}
        opacity={0.92}
      />

      {regions.map((region) => {
        const { x, y, onMap } = project(region.latitude, region.longitude);
        if (!onMap) return null;
        const color = STATUS_COLOR_VAR[region.status];
        const isAmberOrRed = region.status === "amber" || region.status === "red";
        const isHighlight = highlightedCode === region.code;
        const interactive = Boolean(onRegionClick);
        const ariaLabel = `${region.name}, ${STATUS_LABEL[region.status]}${
          region.counts.vms > 0 ? `, ${region.counts.vms} VM${region.counts.vms > 1 ? "s" : ""}` : ""
        }`;

        const handleKey = (e: React.KeyboardEvent<SVGGElement>) => {
          if (!interactive) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onRegionClick?.(region);
          }
        };

        return (
          <g
            key={region.code}
            transform={`translate(${x}, ${y})`}
            style={{ cursor: interactive ? "pointer" : "default", outline: "none" }}
            onClick={interactive ? () => onRegionClick?.(region) : undefined}
            onKeyDown={interactive ? handleKey : undefined}
            tabIndex={interactive ? 0 : -1}
            role={interactive ? "button" : "img"}
            aria-label={ariaLabel}
            className={interactive ? "focus-visible:[&>circle.focus-ring]:opacity-100" : ""}
          >
            {/* Focus ring — visible only when keyboard-focused */}
            {interactive && (
              <circle
                className="focus-ring"
                r={20}
                fill="none"
                stroke="rgb(var(--secondary-color-500))"
                strokeWidth={2}
                opacity={0}
                style={{ transition: "opacity 120ms ease" }}
              />
            )}
            {/* Pulse ring — only for amber/red AND honour reduced motion */}
            {isAmberOrRed && (
              <circle r={16} fill={color} opacity={prefersReducedMotion ? 0.3 : 0.3}>
                {!prefersReducedMotion && (
                  <>
                    <animate
                      attributeName="r"
                      values="10;22;10"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.5;0;0.5"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </>
                )}
              </circle>
            )}
            {isHighlight && (
              <circle
                r={18}
                fill="none"
                stroke="rgb(var(--secondary-color-500))"
                strokeWidth={2}
                opacity={0.8}
              />
            )}
            <circle r={8} fill={color} filter="url(#pin-glow)" />
            <circle r={3} fill="rgb(var(--theme-neutral-50))" />
            <text
              x={0}
              y={-14}
              textAnchor="middle"
              fill="rgb(var(--theme-neutral-100))"
              fontSize={11}
              fontWeight={600}
              fontFamily="Outfit, system-ui, sans-serif"
              style={{ pointerEvents: "none" }}
              aria-hidden="true"
            >
              {region.city || region.name}
            </text>
            <text
              x={0}
              y={22}
              textAnchor="middle"
              fill={color}
              fontSize={9}
              fontWeight={500}
              fontFamily="Outfit, system-ui, sans-serif"
              style={{ pointerEvents: "none" }}
              aria-hidden="true"
            >
              {STATUS_LABEL[region.status]}
              {region.counts.vms > 0 ? ` • ${region.counts.vms} VM${region.counts.vms > 1 ? "s" : ""}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default AfricaMap;
