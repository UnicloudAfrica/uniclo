import React, { useState } from "react";
import { Plus, Wifi, Trash2 } from "lucide-react";
import ModernTable, { type Column } from "../ui/ModernTable";
import ModernButton from "../ui/ModernButton";
import CreateDestinationModal from "./CreateDestinationModal";
import {
  DESTINATION_TYPE_LABELS,
  useFetchDestinations,
  useCreateDestination,
  useDeleteDestination,
  useTestDestination,
  type IntegrationDestination,
  type DestinationType,
} from "@/shared/hooks/resources/integrationHooks";

type AnyRecord = Record<string, unknown>;

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
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: destinations = [], isLoading } = useFetchDestinations(integrationKey);
  const createMutation = useCreateDestination();
  const deleteMutation = useDeleteDestination();
  const testMutation = useTestDestination();

  const handleCreate = (data: AnyRecord) => {
    createMutation.mutate(
      { integrationKey, data },
      {
        onSuccess: () => setShowCreateModal(false),
      },
    );
  };

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
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Destination
          </ModernButton>
        }
      />

      <CreateDestinationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        isCreating={createMutation.isPending}
      />
    </>
  );
};

export default DestinationsList;
