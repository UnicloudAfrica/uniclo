import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Wifi, Trash2 } from "lucide-react";
import ModernTable, { type Column } from "../ui/ModernTable";
import ModernButton from "../ui/ModernButton";
import {
  DESTINATION_TYPE_LABELS,
  useFetchDestinations,
  useDeleteDestination,
  useTestDestination,
  type IntegrationDestination,
  type DestinationType,
} from "@/shared/hooks/resources/integrationHooks";

interface DestinationsListProps {
  integrationKey?: string;
}

const columns: Column<IntegrationDestination>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
  },
  {
    key: "destination_type",
    header: "Type",
    render: (value: unknown) => {
      const label = DESTINATION_TYPE_LABELS[value as DestinationType] ?? String(value);
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
          {label}
        </span>
      );
    },
    sortable: true,
  },
  {
    key: "source_region",
    header: "Source Region",
    sortable: true,
  },
  {
    key: "target_region",
    header: "Target Region",
    sortable: true,
  },
  {
    key: "is_default",
    header: "Default",
    render: (value: unknown) =>
      value ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
          Default
        </span>
      ) : null,
  },
  {
    key: "is_active",
    header: "Status",
    render: (value: unknown) => (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          value
            ? "bg-green-50 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}
      >
        {value ? "Active" : "Inactive"}
      </span>
    ),
  },
];

const DestinationsList: React.FC<DestinationsListProps> = ({
  integrationKey = "anycloudflow",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  // Resolve the role-correct "new" URL from the current path so this
  // shared component works under /admin-dashboard, /dashboard, and
  // /client-dashboard without the page wrapper having to pass it in.
  const role = location.pathname.startsWith("/admin-dashboard")
    ? "admin-dashboard"
    : location.pathname.startsWith("/client-dashboard")
      ? "client-dashboard"
      : "dashboard";
  const goNew = () => navigate(`/${role}/destinations/new`);

  const { data: destinations = [], isLoading } = useFetchDestinations(integrationKey);
  const deleteMutation = useDeleteDestination();
  const testMutation = useTestDestination();

  const handleDelete = (destination: IntegrationDestination) => {
    if (!window.confirm(`Delete destination "${destination.name}"?`)) return;
    deleteMutation.mutate({ integrationKey, destinationId: destination.id });
  };

  const handleTest = (destination: IntegrationDestination) => {
    testMutation.mutate({ integrationKey, destinationId: destination.id });
  };

  return (
    <>
      <ModernTable
        data={destinations}
        columns={columns}
        title="Backup & Replication Destinations"
        searchable
        searchPlaceholder="Search destinations..."
        searchKeys={["name", "source_region", "target_region", "destination_type"]}
        sortable
        paginated
        pageSize={10}
        loading={isLoading}
        actions={[
          {
            label: "Test",
            icon: <Wifi className="w-3.5 h-3.5" />,
            onClick: handleTest,
          },
          {
            label: "Delete",
            icon: <Trash2 className="w-3.5 h-3.5" />,
            tone: "danger",
            onClick: handleDelete,
          },
        ]}
        headerActions={
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => goNew()}
          >
            <Plus className="w-4 h-4" />
            Add a destination
          </ModernButton>
        }
        emptyMessage={
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <span aria-hidden="true" className="text-5xl">📍</span>
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
              No destinations yet
            </p>
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
              Tell us where backups should land — an S3 bucket, an SFTP server, an NFS share, or another VM. You can add as many as you like.
            </p>
            <div className="mt-3">
              <ModernButton variant="primary" size="sm" onClick={() => goNew()}>
                <Plus className="w-4 h-4" />
                Add your first destination
              </ModernButton>
            </div>
          </div>
        }
      />

      {/* Create flow now lives at /{role}/destinations/new (RES-162) */}
    </>
  );
};

export default DestinationsList;
