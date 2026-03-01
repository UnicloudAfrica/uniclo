import React from "react";
import { Network } from "lucide-react";
import ProjectDetailsResourcePlaceholder from "./ProjectDetailsResourcePlaceholder";
import { getNetworkingResourceMeta, type NetworkingResourceId } from "./projectDetailsNetworking";

type NetworkingRenderer = () => React.ReactNode;

type NetworkingRendererMap = Partial<Record<NetworkingResourceId, NetworkingRenderer>>;

interface ProjectNetworkingContentProps {
  resourceId: string;
  renderers: NetworkingRendererMap;
  placeholderMessage?: string;
}

const ProjectNetworkingContent: React.FC<ProjectNetworkingContentProps> = ({
  resourceId,
  renderers,
  placeholderMessage,
}) => {
  const renderer = renderers[resourceId as NetworkingResourceId];
  if (renderer) return <>{renderer()}</>;

  const meta = getNetworkingResourceMeta(resourceId);
  return (
    <ProjectDetailsResourcePlaceholder
      title={meta?.label || "Networking"}
      description={meta?.description || "Select a resource to manage its configuration."}
      icon={meta?.icon || Network}
      message={placeholderMessage}
    />
  );
};

export default ProjectNetworkingContent;
export type { NetworkingRendererMap };
