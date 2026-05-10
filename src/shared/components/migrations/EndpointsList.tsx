/**
 * EndpointsList — friendly list of registered external endpoints.
 *
 * Wow refactor matches MigrationsList:
 *   - MoodIndicator per row (happy when connected, alarmed when failed)
 *   - StatusBadge with friendly labels via orbit `friendlyStatus("hypervisor-connection", ...)`
 *   - ResourceShell empty state with 🛰️ illustration + "Register an endpoint" CTA
 *   - AsyncButton refresh + Test connection
 *   - ConfirmActionDialog for destructive delete (replaces window.confirm())
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, Wifi } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import {
  MoodIndicator,
  StatusBadge,
  ResourceShell,
  ConfirmActionDialog,
  AsyncButton,
  friendlyStatus,
} from "@/shared/components/orbit";
import {
  useFetchExternalEndpoints,
  useDeleteExternalEndpoint,
  useTestEndpointConnection,
} from "@/shared/hooks/resources";
import type { ExternalEndpoint } from "@/shared/hooks/resources/externalEndpointHooks";

interface EndpointsListProps {
  context: "admin" | "tenant" | "client";
  createPath?: string;
  onRegisterNew?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  vm: "Virtual machine",
  database: "Database",
  storage: "Storage",
};

// Map MaaS connection_status to the hypervisor-connection domain
// (untested → pending mood, connected → happy, failed → alarmed).
function mapConnStatus(s: string | undefined): string {
  if (s === "connected") return "detected";
  if (s === "failed") return "failed";
  return "pending";
}

const EndpointsList: React.FC<EndpointsListProps> = ({
  context: _context,
  onRegisterNew,
}) => {
  const _navigate = useNavigate();
  const { data: endpoints, isLoading, error, refetch } = useFetchExternalEndpoints();
  const deleteMutation = useDeleteExternalEndpoint();
  const testConnection = useTestEndpointConnection();

  const [confirmDelete, setConfirmDelete] = useState<ExternalEndpoint | null>(null);

  const dataList = useMemo(() => {
    if (!endpoints) return [];
    return Array.isArray(endpoints) ? endpoints : [];
  }, [endpoints]);

  const columns: Column<ExternalEndpoint>[] = useMemo(
    () => [
      {
        key: "mood",
        header: "",
        render: (_, row) => {
          const fs = friendlyStatus("hypervisor-connection", mapConnStatus(row.connection_status));
          return (
            <div className="flex items-center justify-center">
              <MoodIndicator mood={fs.mood} size="md" />
            </div>
          );
        },
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">{row.name}</div>
            <div className="text-xs font-mono text-gray-400 dark:text-gray-500">{row.identifier}</div>
          </div>
        ),
      },
      {
        key: "resource_type",
        header: "What",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {TYPE_LABELS[row.resource_type] ?? row.resource_type}
          </span>
        ),
      },
      {
        key: "host",
        header: "Address",
        render: (_, row) => (
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
            {row.host}
            {row.port && <span className="text-gray-400 dark:text-gray-500">:{row.port}</span>}
          </span>
        ),
      },
      {
        key: "provider",
        header: "Provider",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm capitalize text-gray-700 dark:text-gray-300">
            {row.provider ?? "Unknown"}
          </span>
        ),
      },
      {
        key: "connection_status",
        header: "Status",
        sortable: true,
        render: (_, row) => {
          const fs = friendlyStatus("hypervisor-connection", mapConnStatus(row.connection_status));
          return (
            <StatusBadge
              tone={fs.tone}
              label={fs.technical}
              friendlyLabel={fs.friendly}
              size="sm"
            />
          );
        },
      },
      {
        key: "estimated_size_bytes",
        header: "Size",
        render: (_, row) => {
          if (!row.estimated_size_bytes) {
            return <span className="text-xs text-gray-400 dark:text-gray-500">—</span>;
          }
          const gb = row.estimated_size_bytes / 1073741824;
          return (
            <span className="text-sm tabular-nums text-gray-700 dark:text-gray-300">
              {gb.toFixed(1)} GB
            </span>
          );
        },
      },
    ],
    [],
  );

  const actions: Action<ExternalEndpoint>[] = useMemo(
    () => [
      {
        label: "Test connection",
        icon: <Wifi size={14} />,
        onClick: (row) => {
          testConnection.mutate({ endpointId: row.identifier });
        },
      },
      {
        label: "Forget this endpoint",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => setConfirmDelete(row),
      },
    ],
    [testConnection],
  );

  const showEmpty = !isLoading && !error && dataList.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <AsyncButton
          variant="ghost"
          size="sm"
          icon={<RefreshCw size={14} />}
          loadingLabel="Refreshing…"
          successLabel="Up to date"
          onClick={async () => {
            await refetch();
          }}
        >
          Refresh
        </AsyncButton>
        {onRegisterNew && (
          <AsyncButton
            variant="primary"
            size="md"
            icon={<Plus size={14} />}
            onClick={() => onRegisterNew()}
          >
            Connect a server
          </AsyncButton>
        )}
      </div>

      <ResourceShell
        loading={isLoading}
        error={error}
        onRetry={refetch}
        empty={showEmpty}
        emptyTitle="No servers connected yet"
        emptyDescription="Tell us about a server — physical, virtual, on-prem, or in the cloud — and we'll get it ready to migrate or replicate."
        emptyIcon={<span aria-hidden="true" className="text-5xl">🛰️</span>}
        emptyAction={onRegisterNew ? { label: "Connect a server", onClick: onRegisterNew } : undefined}
      >
        <ModernTable<ExternalEndpoint>
          data={dataList}
          columns={columns}
          loading={false}
          searchable
          searchKeys={["name", "identifier", "host", "provider", "resource_type"]}
          searchPlaceholder="Find a server by name, host, or provider…"
          paginated
          pageSize={10}
          actions={actions}
          emptyMessage={null}
        />
      </ResourceShell>

      <ConfirmActionDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (!confirmDelete) return;
          await deleteMutation.mutateAsync({ id: confirmDelete.identifier });
          setConfirmDelete(null);
        }}
        title={`Forget "${confirmDelete?.name ?? "this server"}"?`}
        description="We'll remove this server from your list. Active migrations or replications using it will block this — finish or cancel those first."
        severity="danger"
        confirmLabel="Yes, forget it"
        cancelLabel="No, keep it"
      />
    </div>
  );
};

export default EndpointsList;
