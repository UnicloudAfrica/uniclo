import React, { useState } from "react";
import { Camera, Disc, Plus } from "lucide-react";
import SnapshotList from "./SnapshotList";
import ImageList from "./ImageList";
import {
  useSnapshots,
  useDeleteSnapshot,
  useImages,
  useDeleteImage,
} from "../../../../hooks/storageHooks";
import ModernCard from "../../ui/ModernCard";
import { ResourceEmptyState } from "../../ui/ResourceEmptyState";

interface StorageManagementContainerProps {
  projectId?: string;
  region?: string;
  initialTab?: "snapshots" | "images";
}

/**
 * StorageManagementContainer - manages snapshots and images
 * Images work at tenant level (no project required)
 * Snapshots still require project context (they're volume-specific)
 */
const StorageManagementContainer: React.FC<StorageManagementContainerProps> = ({
  projectId,
  region,
  initialTab = "snapshots",
}) => {
  const [activeTab, setActiveTab] = useState<"snapshots" | "images">(initialTab);

  // Snapshots - only fetch if we have project context
  // Snapshots are volume-specific and require project
  const shouldFetchSnapshots = !!projectId && !!region;
  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useSnapshots(
    projectId || "",
    region || "",
    undefined
  );
  const { mutate: deleteSnapshot } = useDeleteSnapshot();

  // Images - works at tenant level (no project required)
  const { data: images = [], isLoading: isLoadingImages } = useImages(projectId, region);
  const { mutate: deleteImage } = useDeleteImage();

  const tabs = [
    {
      id: "snapshots",
      label: "Snapshots",
      icon: Camera,
      count: shouldFetchSnapshots ? snapshots.length : 0,
    },
    { id: "images", label: "Machine Images", icon: Disc, count: images.length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {initialTab === "images" ? "Machine Images" : "Storage Management"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {initialTab === "images"
              ? "View and manage machine images available in your cloud environment."
              : "Manage your volume snapshots and custom machine images."}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                                flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${
                                  isActive
                                    ? "bg-white text-primary-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                }
                            `}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-gray-400"}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`
                                    ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] 
                                    ${isActive ? "bg-primary-100 text-primary-600" : "bg-gray-200 text-gray-500"}
                                `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ModernCard padding="none" className="overflow-hidden border-gray-200 shadow-sm">
        {activeTab === "snapshots" ? (
          shouldFetchSnapshots ? (
            <SnapshotList
              snapshots={snapshots}
              isLoading={isLoadingSnapshots}
              onDelete={(id) => deleteSnapshot({ id, projectId: projectId!, region: region! })}
            />
          ) : (
            <ResourceEmptyState
              icon={<Camera className="w-12 h-12 text-gray-300" />}
              title="Snapshots require project context"
              message="Select a project from the Projects page to view and manage volume snapshots."
            />
          )
        ) : (
          <ImageList
            images={images}
            isLoading={isLoadingImages}
            onDelete={(id) => deleteImage({ id, projectId, region })}
          />
        )}
      </ModernCard>
    </div>
  );
};

export default StorageManagementContainer;
