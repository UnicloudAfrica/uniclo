import React, { useMemo } from "react";
import { Plus } from "lucide-react";
import { ModernCard, ModernButton, ModernTable, StatusPill } from "../../ui";
import { designTokens } from "../../../../styles/designTokens";

interface InstanceStats {
  total: number;
  running: number;
  provisioning: number;
  paymentPending: number;
}

interface Instance {
  id?: string | number;
  identifier?: string;
  name?: string;
  status?: string;
  flavor?: string;
  instance_type?: string;
  created_at?: string;
  [key: string]: any;
}

interface ProjectInstancesOverviewProps {
  instanceStats: InstanceStats;
  recentInstances?: Instance[];
  projectInstances?: Instance[];
  onViewInstance: (instance: Instance) => void;
  onAddInstance: () => void;
  onViewAllInstances: () => void;
  canCreateInstances?: boolean;
  resolvedProjectId?: string;
}

const ProjectInstancesOverview: React.FC<ProjectInstancesOverviewProps> = ({
  instanceStats,
  recentInstances = [],
  projectInstances = [],
  onViewInstance,
  onAddInstance,
  onViewAllInstances,
  canCreateInstances,
  resolvedProjectId,
}) => {
  // Define columns for ModernTable
  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Instance",
        render: (_: any, row: Instance) => (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">
              {row.name || row.identifier || "Unnamed Instance"}
            </p>
            <p className="text-xs text-gray-500">{row.identifier || "—"}</p>
          </div>
        ),
      },
      {
        key: "type",
        header: "Type",
        render: (_: any, row: Instance) => (
          <span className="text-gray-700">{row.flavor || row.instance_type || "—"}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (_: any, row: Instance) => <StatusPill status={row.status || "unknown"} />,
      },
      {
        key: "created_at",
        header: "Created",
        render: (value: string) => (
          <span className="text-gray-700">{value ? new Date(value).toLocaleString() : "—"}</span>
        ),
      },
      {
        key: "actions",
        header: <div className="text-right">Action</div>,
        align: "right" as const,
        render: (_: any, row: Instance) => (
          <div className="flex justify-end">
            <ModernButton
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => onViewInstance(row)}
            >
              View
            </ModernButton>
          </div>
        ),
      },
    ],
    [onViewInstance]
  );

  return (
    <ModernCard padding="lg" variant="outlined">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Instances overview</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review instance activity before jumping into the detailed tabs below.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModernButton
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
            onClick={onViewAllInstances}
            disabled={!resolvedProjectId}
          >
            View all instances
          </ModernButton>
          <ModernButton
            size="sm"
            className="flex items-center gap-2"
            onClick={onAddInstance}
            disabled={!resolvedProjectId}
          >
            <Plus size={16} />
            Add Instance
          </ModernButton>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl border p-4"
          style={{
            borderColor: designTokens.colors.primary[100],
            backgroundColor: designTokens.colors.primary[50],
          }}
        >
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: designTokens.colors.primary[700] }}
          >
            Total
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: designTokens.colors.primary[700] }}
          >
            {instanceStats.total}
          </p>
          <p className="text-xs" style={{ color: designTokens.colors.primary[600] }}>
            Instances discovered
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: designTokens.colors.success[100] }}
        >
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: designTokens.colors.success[700] }}
          >
            Running
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: designTokens.colors.success[700] }}
          >
            {instanceStats.running}
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: designTokens.colors.warning[100] }}
        >
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: designTokens.colors.warning[700] }}
          >
            Provisioning
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: designTokens.colors.warning[700] }}
          >
            {instanceStats.provisioning}
          </p>
        </div>
        <div
          className="rounded-xl border p-4"
          style={{ borderColor: designTokens.colors.warning[100] }}
        >
          <p
            className="text-xs font-semibold uppercase"
            style={{ color: designTokens.colors.warning[700] }}
          >
            Payment pending
          </p>
          <p
            className="mt-2 text-2xl font-semibold"
            style={{ color: designTokens.colors.warning[700] }}
          >
            {instanceStats.paymentPending}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">Most recent instances</p>
          <span className="text-xs text-gray-500">
            Showing {recentInstances.length} of {projectInstances.length}
          </span>
        </div>

        <ModernTable
          data={recentInstances}
          columns={columns}
          paginated={false}
          searchable={false}
          filterable={false}
          sortable={false}
          emptyMessage="No instances have been provisioned yet. Use the button above to start a deployment."
        />
      </div>
    </ModernCard>
  );
};

export default ProjectInstancesOverview;
