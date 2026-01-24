import React, { useEffect, useState } from "react";
import { Server, Key, Plus, RefreshCw } from "lucide-react";
import { useFetchPurchasedInstances } from "../../../hooks/adminHooks/instancesHook";
import KeyPairsContainer from "../../../shared/components/infrastructure/containers/KeyPairsContainer";
import {
  useFetchKeyPairs,
  useSyncKeyPairs,
  useDeleteKeyPair,
} from "../../../hooks/adminHooks/keyPairHooks";
import { ModernButton, ModernTable } from "../../../shared/components/ui";
import StatusPill from "../../../shared/components/ui/StatusPill";
import { ResourceCanvas } from "../../../shared/components/projects/details/ResourceLayout";

interface ComputeTabProps {
  project: any;
  initialSubView?: "instances" | "keypairs";
  onSubViewChange?: (subView: "instances" | "keypairs") => void;
}

const ComputeTab: React.FC<ComputeTabProps> = ({ project, initialSubView, onSubViewChange }) => {
  const [activeSubView, setActiveSubView] = useState<"instances" | "keypairs">(
    initialSubView || "instances"
  );

  // Adapters to match shared container interfaces
  const useKeyPairsAdapter = (projectId: string, region?: string) => {
    const query = useFetchKeyPairs(projectId, region);
    return {
      data: (query.data as any) || [],
      isFetching: query.isFetching,
      refetch: query.refetch,
    };
  };

  const {
    data: instancesResponse,
    isFetching,
    refetch,
  } = useFetchPurchasedInstances({
    project_id: project?.identifier,
  });

  const instances = instancesResponse?.data || [];

  useEffect(() => {
    if (initialSubView && initialSubView !== activeSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView, activeSubView]);

  const handleSubViewChange = (nextView: "instances" | "keypairs") => {
    setActiveSubView(nextView);
    onSubViewChange?.(nextView);
  };

  const columns = [
    {
      key: "name",
      header: "Instance",
      render: (_: any, instance: any) => (
        <div className="flex items-center gap-3">
          <Server size={16} className="text-gray-400" />
          <div>
            <p className="text-sm font-semibold text-gray-900">{instance.name || "Untitled"}</p>
            <p className="text-[10px] font-mono text-gray-400">{instance.identifier}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (status: string) => (
        <StatusPill
          label={status || "unknown"}
          tone={["active", "running"].includes(status?.toLowerCase()) ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "ips",
      header: "IP Addresses",
      render: (_: any, instance: any) => {
        const privateIp = instance.metadata?.private_ip || instance.private_ip;
        const publicIp =
          instance.metadata?.public_ip || instance.floatingIp?.address || instance.public_ip;
        return (
          <div className="text-xs space-y-1">
            {privateIp && (
              <div className="flex items-center gap-1.5 text-gray-600">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="font-mono">{privateIp}</span>
              </div>
            )}
            {publicIp && (
              <div className="flex items-center gap-1.5 text-blue-600">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="font-mono">{publicIp}</span>
              </div>
            )}
            {!privateIp && !publicIp && <span className="text-gray-400 italic">Not assigned</span>}
          </div>
        );
      },
    },
    {
      key: "specs",
      header: "Specs",
      render: (_: any, instance: any) => (
        <div className="text-xs">
          <p className="font-medium text-gray-900">{instance.compute?.name || "Standard"}</p>
          <p className="text-gray-500">
            {instance.compute?.vcpus || 0} vCPU / {instance.compute?.memory_mb || 0} MB
          </p>
        </div>
      ),
    },
    {
      key: "os",
      header: "OS / Image",
      render: (_: any, instance: any) => (
        <div className="text-xs text-gray-600">{instance.osImage?.name || "Custom Image"}</div>
      ),
    },
    {
      key: "created",
      header: "Created",
      render: (created_at: string) => (
        <div className="text-xs text-gray-500">
          {created_at ? new Date(created_at).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <button
          onClick={() => handleSubViewChange("instances")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubView === "instances"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Instances
        </button>
        <button
          onClick={() => handleSubViewChange("keypairs")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubView === "keypairs"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Key Pairs
        </button>
      </div>

      {activeSubView === "instances" ? (
        <ResourceCanvas
          icon={Server}
          title="Virtual Instances"
          description="Manage virtual machines and compute workloads"
          count={instances.length}
          actions={
            <>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                isLoading={isFetching}
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                Refresh
              </ModernButton>
              <ModernButton variant="primary" size="sm">
                <Plus size={14} />
                Provision Instance
              </ModernButton>
            </>
          }
        >
          <ModernTable
            data={instances}
            columns={columns}
            loading={isFetching}
            emptyMessage="No instances found for this project."
          />
        </ResourceCanvas>
      ) : (
        <KeyPairsContainer
          hierarchy="admin"
          projectId={project?.identifier}
          region={project?.region}
          hooks={{
            useList: useKeyPairsAdapter,
            useSync: useSyncKeyPairs,
            useDelete: useDeleteKeyPair,
          }}
          wrapper={({ children, headerActions }) => (
            <ResourceCanvas
              icon={Key}
              title="Key Pairs"
              description="SSH keys for secure instance access"
              actions={headerActions}
            >
              {children}
            </ResourceCanvas>
          )}
        />
      )}
    </div>
  );
};

export default ComputeTab;
