import React, { useEffect, useMemo, useState } from "react";
import { Key, Plus, RefreshCw, Server } from "lucide-react";
import { ModernButton, ModernTable } from "../../ui";
import StatusPill from "../../ui/StatusPill";
import KeyPairsContainer from "../../infrastructure/containers/KeyPairsContainer";
import { ResourceCanvas } from "./ResourceLayout";
import type { KeyPairHooks } from "../../infrastructure/containers/KeyPairsContainer";

type ComputeSubView = "instances" | "keypairs";

interface Instance {
  id?: string | number;
  identifier?: string;
  name?: string;
  status?: string;
  metadata?: { private_ip?: string; public_ip?: string };
  private_ip?: string;
  public_ip?: string;
  floatingIp?: { address: string };
  compute?: { name?: string; vcpus?: number; memory_mb?: number };
  osImage?: { name?: string };
  created_at?: string;
}

interface ProjectComputeTabProps {
  projectId?: string;
  region?: string;
  hierarchy: "admin" | "tenant" | "client";
  useInstances: (
    params: { project_id?: string },
    options?: { enabled?: boolean }
  ) => {
    data?: { data: Instance[] } | Instance[];
    isFetching?: boolean;
    refetch?: () => void;
  };
  keyPairHooks: KeyPairHooks;
  initialSubView?: ComputeSubView;
  onSubViewChange?: (subView: ComputeSubView) => void;
  onProvisionInstance?: () => void;
}

const extractInstances = (
  response: { data: Instance[] | { data: Instance[] } } | Instance[] | undefined | null
): Instance[] => {
  if (!response) return [];
  const res = response as Record<string, unknown>;
  if (Array.isArray(res.data)) return res.data as Instance[];
  const nestedData = res.data as Record<string, unknown>;
  if (nestedData && Array.isArray(nestedData.data)) return nestedData.data as Instance[];
  if (Array.isArray(response)) return response as Instance[];
  return [];
};

const ProjectComputeTab: React.FC<ProjectComputeTabProps> = ({
  projectId,
  region,
  hierarchy,
  useInstances,
  keyPairHooks,
  initialSubView = "instances",
  onSubViewChange,
  onProvisionInstance,
}) => {
  const [activeSubView, setActiveSubView] = useState<ComputeSubView>(initialSubView);
  const canProvisionInstance = typeof onProvisionInstance === "function";

  const {
    data: instancesResponse,
    isFetching,
    refetch,
  } = useInstances({ project_id: projectId }, { enabled: Boolean(projectId) });

  const instances = useMemo(() => {
    const items = extractInstances(instancesResponse as never);
    return items.filter((instance) => (instance?.status || "").toLowerCase() !== "pending_payment");
  }, [instancesResponse]);

  useEffect(() => {
    if (initialSubView && initialSubView !== activeSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView, activeSubView]);

  const handleSubViewChange = (nextView: ComputeSubView) => {
    setActiveSubView(nextView);
    onSubViewChange?.(nextView);
  };

  const columns = [
    {
      key: "name",
      header: "Instance",
      render: (_: unknown, instance: Instance) => (
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
      render: (_: unknown, instance: Instance) => {
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
      render: (_: unknown, instance: Instance) => (
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
      render: (_: unknown, instance: Instance) => (
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

  const useKeyPairsAdapter = (projectIdValue: string, regionValue?: string, options = {}) => {
    const query = keyPairHooks.useList(projectIdValue, regionValue, options);
    return {
      data: (query.data as unknown as Record<string, unknown>[]) || [],
      isFetching: query.isFetching,
      refetch: query.refetch,
    };
  };

  return (
    <div className="space-y-6">
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
                onClick={() => refetch?.()}
                isLoading={isFetching}
              >
                <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
                Refresh
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={onProvisionInstance}
                isDisabled={!canProvisionInstance}
              >
                <Plus size={14} />
                Provision Instance
              </ModernButton>
            </>
          }
        >
          <ModernTable
            data={instances}
            columns={columns as never}
            loading={isFetching}
            emptyMessage="No instances found for this project."
          />
        </ResourceCanvas>
      ) : (
        <KeyPairsContainer
          hierarchy={hierarchy}
          projectId={projectId || ""}
          region={region || ""}
          hooks={{
            useList: useKeyPairsAdapter as never,
            useSync: keyPairHooks.useSync,
            useDelete: keyPairHooks.useDelete,
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

export default ProjectComputeTab;
