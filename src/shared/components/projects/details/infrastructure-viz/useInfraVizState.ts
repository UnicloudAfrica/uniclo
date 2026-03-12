/**
 * useInfraVizState.ts
 *
 * Central state management hook for the infrastructure visualization.
 * Manages: active view mode, selected resource, panel open/close, highlighted types.
 */
import { useState, useCallback, useMemo } from "react";
import type { ViewMode, SelectedResource } from "./InfrastructureVisualization.types";
import type { ResourceTypeId } from "./resourceExplanations";
import { RESOURCE_EXPLANATIONS } from "./resourceExplanations";

export function useInfraVizState() {
  const [activeView, setActiveView] = useState<ViewMode>("layered");
  const [selectedResource, setSelectedResource] = useState<SelectedResource | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const selectResource = useCallback((resource: SelectedResource | null) => {
    if (resource === null) {
      setIsPanelOpen(false);
      setTimeout(() => setSelectedResource(null), 300);
    } else {
      setSelectedResource(resource);
      setIsPanelOpen(true);
    }
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
    setTimeout(() => setSelectedResource(null), 300);
  }, []);

  // Compute which resource types should be highlighted (related to selected)
  const highlightedTypes = useMemo<ResourceTypeId[]>(() => {
    if (!selectedResource) return [];
    const explanation = RESOURCE_EXPLANATIONS[selectedResource.typeId];
    return explanation ? [selectedResource.typeId, ...explanation.relatedResources] : [];
  }, [selectedResource]);

  return {
    activeView,
    setActiveView,
    selectedResource,
    selectResource,
    isPanelOpen,
    closePanel,
    highlightedTypes,
  };
}
