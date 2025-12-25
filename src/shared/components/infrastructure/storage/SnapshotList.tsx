import React from "react";
import { Trash2, Camera, Database, HardDrive } from "lucide-react";
import ModernTable from "../../ui/ModernTable";
import StatusPill from "../../ui/StatusPill";
import { ResourceEmptyState } from "../../ui/ResourceEmptyState";

export interface Snapshot {
  id: string;
  name: string;
  status: string;
  size: number;
  volume_id?: string;
  created_at: string;
  raw?: any;
}

interface SnapshotListProps {
  snapshots: Snapshot[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const SnapshotList: React.FC<SnapshotListProps> = ({ snapshots, isLoading, onDelete }) => {
  const columns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (name: string, row: Snapshot) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name || "Unnamed Snapshot"}</div>
            <div className="text-xs text-gray-500 font-mono">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: "status",
      render: (status: string) => <StatusPill status={status} />,
    },
    {
      key: "size",
      header: "Size",
      accessor: "size",
      render: (size: number) => (
        <div className="flex items-center text-sm text-gray-600">
          <Database className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          {typeof size === "number" ? `${size} GB` : "N/A"}
        </div>
      ),
    },
    {
      key: "volume_id",
      header: "Source Volume",
      accessor: "volume_id",
      render: (volumeId: string) => (
        <div className="flex items-center text-sm text-gray-600 font-mono">
          <HardDrive className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          {volumeId || "N/A"}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      accessor: "created_at",
      render: (date: string) => (
        <div className="text-sm text-gray-500">{new Date(date).toLocaleString()}</div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: "id",
      align: "right" as const,
      render: (id: string) => (
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this snapshot?")) {
              onDelete(id);
            }
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Snapshot"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (!isLoading && snapshots.length === 0) {
    return (
      <ResourceEmptyState
        icon={<Camera className="w-12 h-12 text-gray-300" />}
        title="No snapshots found"
        message="Volume snapshots provide point-in-time backups of your data volumes."
      />
    );
  }

  return <ModernTable columns={columns} data={snapshots} loading={isLoading} />;
};

export default SnapshotList;
