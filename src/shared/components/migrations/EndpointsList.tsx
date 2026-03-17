/**
 * EndpointsList — Shared table listing external endpoints for Migration-as-a-Service.
 *
 * Used across admin, tenant, and client dashboards via page wrappers.
 */
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Trash2, Wifi, Search } from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import MigrationStatusBadge from "./MigrationStatusBadge";
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
  vm: "Virtual Machine",
  database: "Database",
  storage: "Storage",
};

const EndpointsList: React.FC<EndpointsListProps> = ({
  context: _context,
  onRegisterNew,
}) => {
  const navigate = useNavigate();
  const { data: endpoints, isLoading, refetch } = useFetchExternalEndpoints();
  const deleteMutation = useDeleteExternalEndpoint();
  const testConnection = useTestEndpointConnection();

  const dataList = useMemo(() => {
    if (!endpoints) return [];
    return Array.isArray(endpoints) ? endpoints : [];
  }, [endpoints]);

  const columns: Column<ExternalEndpoint>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {row.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.identifier}
            </div>
          </div>
        ),
      },
      {
        key: "resource_type",
        header: "Type",
        sortable: true,
        render: (_, row) => (
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {TYPE_LABELS[row.resource_type] ?? row.resource_type}
          </span>
        ),
      },
      {
        key: "host",
        header: "Host",
        render: (_, row) => (
          <div className="text-sm">
            <span className="text-gray-700 dark:text-gray-300">{row.host}</span>
            {row.port && (
              <span className="text-gray-400 dark:text-gray-500">
                :{row.port}
              </span>
            )}
          </div>
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
        render: (_, row) => (
          <MigrationStatusBadge
            status={row.connection_status ?? "untested"}
            variant="connection"
          />
        ),
      },
      {
        key: "estimated_size_bytes",
        header: "Size",
        render: (_, row) => {
          if (!row.estimated_size_bytes) {
            return (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Unknown
              </span>
            );
          }
          const gb = row.estimated_size_bytes / 1073741824;
          return (
            <span className="text-sm text-gray-700 dark:text-gray-300">
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
        label: "Test",
        icon: <Wifi size={14} />,
        onClick: (row) => {
          testConnection.mutate({ endpointId: row.identifier });
        },
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (confirm(`Delete endpoint "${row.name}"?`)) {
            deleteMutation.mutate({ id: row.identifier });
          }
        },
      },
    ],
    [testConnection, deleteMutation],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
        {onRegisterNew && (
          <button
            onClick={onRegisterNew}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={16} />
            Register Endpoint
          </button>
        )}
      </div>

      <ModernTable<ExternalEndpoint>
        data={dataList}
        columns={columns}
        loading={isLoading}
        searchable
        searchKeys={["name", "identifier", "host", "provider", "resource_type"]}
        searchPlaceholder="Search endpoints..."
        paginated
        pageSize={10}
        actions={actions}
        emptyMessage={
          <div className="flex flex-col items-center py-12 text-center">
            <Search
              size={40}
              className="mb-3 text-gray-300 dark:text-gray-600"
            />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No endpoints registered yet
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Register an external server to get started with migrations.
            </p>
          </div>
        }
      />
    </div>
  );
};

export default EndpointsList;
