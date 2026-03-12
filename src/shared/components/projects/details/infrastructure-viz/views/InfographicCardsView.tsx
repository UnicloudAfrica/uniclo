/**
 * InfographicCardsView.tsx
 *
 * An infographic-style card layout showing all 12 cloud resource types
 * organized into four horizontal layer rows: Connectivity, Network, Security,
 * and Compute. Each row displays a layer label on the left with resource cards
 * arranged to the right.
 *
 * Features:
 * - Subtle tinted backgrounds per layer (using LAYER_ORDER colors)
 * - Staggered entrance animation via framer-motion
 * - Responsive: cards scroll horizontally on small screens, wrap on large screens
 * - Clickable cards open the explanation panel
 * - Highlighted / selected cards get visual emphasis
 */
import React, { useCallback, useMemo } from "react";
import { motion } from "framer-motion";

import ResourceCard from "../components/ResourceCard";
import { LAYER_ORDER, getResourcesByLayerForProvider } from "../resourceExplanations";
import type { ResourceTypeId } from "../resourceExplanations";
import type { ViewProps } from "../InfrastructureVisualization.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResourceCount(data: ViewProps["data"], typeId: ResourceTypeId): number {
  if (typeId === "instances") return data.instanceStats.total;
  return (data.resourceCounts[typeId] as number) ?? 0;
}

function getStatus(
  data: ViewProps["data"],
  typeId: ResourceTypeId
): "configured" | "not_configured" | undefined {
  const ns = data.networkStatus;
  if (!ns) return undefined;

  switch (typeId) {
    case "vpcs":
      return ns.vpc?.configured ? "configured" : "not_configured";
    case "internet_gateways":
      return ns.internet_gateway?.configured ? "configured" : "not_configured";
    case "subnets":
      return ns.subnets?.configured ? "configured" : "not_configured";
    case "security_groups":
      return ns.security_groups?.configured ? "configured" : "not_configured";
    default:
      return undefined;
  }
}

// ---------------------------------------------------------------------------
// Layer row animation
// ---------------------------------------------------------------------------

const layerRowVariants = {
  hidden: { opacity: 0 },
  visible: (layerIndex: number) => ({
    opacity: 1,
    transition: {
      delay: layerIndex * 0.08,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const InfographicCardsView: React.FC<ViewProps> = ({
  data,
  selectedResource,
  onSelectResource,
  highlightedTypes,
}) => {
  const handleCardClick = useCallback(
    (typeId: ResourceTypeId) => {
      onSelectResource({ typeId });
    },
    [onSelectResource]
  );

  // Pre-compute resources per layer so we can track a global card index
  // for stagger animation across the entire view.
  // Filter by provider support and hide empty layers.
  const layersWithResources = useMemo(() => {
    let globalIndex = 0;
    return LAYER_ORDER.map((layer) => {
      const resources = getResourcesByLayerForProvider(layer.id, data.provider).map((res) => ({
        ...res,
        globalIndex: globalIndex++,
      }));
      return { layer, resources };
    }).filter(({ resources }) => resources.length > 0);
  }, [data.provider]);

  return (
    <div className="w-full h-full overflow-y-auto overflow-x-hidden p-2 sm:p-3 md:p-4 space-y-2 sm:space-y-2.5">
      {layersWithResources.map(({ layer, resources }, layerIndex) => (
        <motion.div
          key={layer.id}
          custom={layerIndex}
          variants={layerRowVariants}
          initial="hidden"
          animate="visible"
          className={[
            "rounded-xl border border-gray-100",
            layer.bgColor,
            "px-3 py-2.5 sm:px-4 sm:py-3",
          ].join(" ")}
        >
          {/* Layer header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center h-6 w-6 rounded-md bg-white/70">
              <layer.icon className={`${layer.color} h-3.5 w-3.5`} />
            </div>
            <div className="min-w-0">
              <h4 className={`text-xs font-bold leading-tight ${layer.color}`}>{layer.label}</h4>
              <p className="text-[10px] text-gray-500 leading-tight truncate">
                {layer.description}
              </p>
            </div>
          </div>

          {/* Resource cards */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-x-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {resources.map((res) => {
              const count = getResourceCount(data, res.id);
              const isHighlighted = highlightedTypes.includes(res.id);
              const isSelected = selectedResource?.typeId === res.id;
              const status = getStatus(data, res.id);

              return (
                <div key={res.id} className="flex-shrink-0 sm:flex-shrink">
                  <ResourceCard
                    icon={res.icon}
                    label={res.label}
                    count={count}
                    color={res.color}
                    bgColor={res.bgColor}
                    isHighlighted={isHighlighted}
                    isSelected={isSelected}
                    status={status}
                    index={res.globalIndex}
                    onClick={() => handleCardClick(res.id)}
                  />
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default InfographicCardsView;
