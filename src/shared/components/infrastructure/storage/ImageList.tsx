import React from "react";
import { Trash2, Disc, HardDrive, Eye, EyeOff } from "lucide-react";
import ModernTable from "../../ui/ModernTable";
import StatusPill from "../../ui/StatusPill";
import { ResourceEmptyState } from "../../ui/ResourceEmptyState";

export interface MachineImage {
  id: string;
  name: string;
  status: string;
  size: number;
  disk_format?: string;
  visibility: string;
  created_at: string;
  raw?: any;
}

interface ImageListProps {
  images: MachineImage[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

const ImageList: React.FC<ImageListProps> = ({ images, isLoading, onDelete }) => {
  const columns = [
    {
      key: "name",
      header: "Name",
      accessor: "name",
      render: (name: string, row: MachineImage) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-secondary-100 rounded-lg text-secondary-600">
            <Disc className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{name || "Unnamed Image"}</div>
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
      key: "disk_format",
      header: "Format",
      accessor: "disk_format",
      render: (format: string) => (
        <div className="flex items-center text-sm text-gray-600">
          <HardDrive className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
          {format?.toUpperCase() || "RAW"}
        </div>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      accessor: "visibility",
      render: (visibility: string) => (
        <div className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
          {visibility === "public" ? (
            <Eye className="w-3 h-3 mr-1 text-green-500" />
          ) : (
            <EyeOff className="w-3 h-3 mr-1 text-gray-400" />
          )}
          {visibility?.charAt(0).toUpperCase() + visibility?.slice(1)}
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
            if (window.confirm("Are you sure you want to delete this machine image?")) {
              onDelete(id);
            }
          }}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete Image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  if (!isLoading && images.length === 0) {
    return (
      <ResourceEmptyState
        icon={<Disc className="w-12 h-12 text-gray-300" />}
        title="No machine images found"
        message="Machine images allow you to launch new instances with pre-configured software and data."
      />
    );
  }

  return <ModernTable columns={columns} data={images} loading={isLoading} />;
};

export default ImageList;
