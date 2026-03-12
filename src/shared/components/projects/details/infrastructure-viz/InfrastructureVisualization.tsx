import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfraVizState } from "./useInfraVizState";
import ViewSwitcher from "./components/ViewSwitcher";
import ResourceExplainPanel from "./components/ResourceExplainPanel";
import type { InfraVizProps, ViewProps } from "./InfrastructureVisualization.types";
import LayeredDiagramView from "./views/LayeredDiagramView";
import InfographicCardsView from "./views/InfographicCardsView";
import BuildingMetaphorView from "./views/BuildingMetaphorView";

const InfrastructureVisualization: React.FC<InfraVizProps> = (props) => {
  const {
    activeView,
    setActiveView,
    selectedResource,
    selectResource,
    isPanelOpen,
    closePanel,
    highlightedTypes,
  } = useInfraVizState();

  const viewProps: ViewProps = {
    data: props,
    selectedResource,
    onSelectResource: selectResource,
    highlightedTypes,
  };

  return (
    <div className="relative w-full">
      {/* View Switcher */}
      <ViewSwitcher activeView={activeView} onChangeView={setActiveView} />

      {/* Visualization Container */}
      <div className="relative w-full h-[280px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gray-50 rounded-xl border border-gray-200 overflow-hidden shadow-inner">
        <AnimatePresence mode="wait">
          {activeView === "building" && (
            <motion.div
              key="building"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <BuildingMetaphorView {...viewProps} />
            </motion.div>
          )}
          {activeView === "layered" && (
            <motion.div
              key="layered"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LayeredDiagramView {...viewProps} />
            </motion.div>
          )}
          {activeView === "infographic" && (
            <motion.div
              key="infographic"
              className="w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <InfographicCardsView {...viewProps} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Explanation Panel - positioned INSIDE the container for desktop (absolute) */}
        <AnimatePresence>
          {isPanelOpen && selectedResource && (
            <ResourceExplainPanel
              resource={selectedResource}
              resourceCounts={props.resourceCounts}
              instanceStats={props.instanceStats}
              onClose={closePanel}
              highlightedTypes={highlightedTypes}
              onSelectResource={selectResource}
              onNavigateToResource={props.onResourceClick}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InfrastructureVisualization;
