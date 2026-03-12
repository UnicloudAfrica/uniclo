/**
 * ResourceCard.tsx
 *
 * A compact card component for a single cloud resource type.
 * Used by InfographicCardsView to display resources organized by layer.
 *
 * Features:
 * - Icon in a colored circle
 * - Resource label and count badge
 * - Status indicator dot (configured / not configured)
 * - Visual highlight ring when selected or highlighted
 * - Staggered entrance animation via framer-motion
 */
import { memo } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ResourceCardProps {
  icon: LucideIcon;
  label: string;
  count: number;
  color: string; // Tailwind text-color class, e.g. "text-indigo-500"
  bgColor: string; // Tailwind bg-color class, e.g. "bg-indigo-50"
  isHighlighted: boolean;
  isSelected: boolean;
  status?: "configured" | "not_configured";
  index: number; // position in list, used for stagger delay
  onClick: () => void;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: index * 0.04,
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ResourceCardComponent({
  icon: Icon,
  label,
  count,
  color,
  bgColor,
  isHighlighted,
  isSelected,
  status,
  index,
  onClick,
}: ResourceCardProps) {
  const ringClasses = isSelected
    ? "ring-2 ring-blue-500 shadow-md"
    : isHighlighted
      ? "ring-2 ring-blue-300 shadow-sm"
      : "ring-1 ring-gray-200";

  return (
    <motion.button
      type="button"
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className={[
        "relative flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5",
        "w-[156px] cursor-pointer transition-shadow duration-150",
        "hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
        ringClasses,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Icon circle */}
      <div
        className={[
          "flex shrink-0 items-center justify-center rounded-full",
          bgColor,
          "h-9 w-9",
        ].join(" ")}
      >
        <Icon className={`${color} h-[18px] w-[18px]`} />
      </div>

      {/* Label + meta */}
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <span className="truncate text-[11px] font-semibold leading-tight text-gray-800 max-w-full">
          {label}
        </span>

        <div className="mt-1 flex items-center gap-1.5">
          {/* Count badge */}
          <span className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-px text-[10px] font-bold tabular-nums text-gray-600">
            {count}
          </span>

          {/* Status dot */}
          {status !== undefined && (
            <span
              className={[
                "inline-block h-2 w-2 rounded-full",
                status === "configured" ? "bg-emerald-400" : "bg-gray-300",
              ].join(" ")}
              title={status === "configured" ? "Configured" : "Not configured"}
            />
          )}
        </div>
      </div>
    </motion.button>
  );
}

const ResourceCard = memo(ResourceCardComponent);

export default ResourceCard;
