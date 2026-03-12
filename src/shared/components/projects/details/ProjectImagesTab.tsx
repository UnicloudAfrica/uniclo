import React, { useMemo, useState } from "react";
import {
  MonitorSmartphone,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { useImages, useDeleteImage } from "../../../../hooks/storageHooks";
import { ModernTable } from "@/shared/components/ui";
import type { Column } from "@/shared/components/ui/ModernTable/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MachineImage {
  id: string;
  name?: string;
  status?: string;
  visibility?: string;
  os_type?: string;
  os_distro?: string;
  size?: number;
  min_disk?: number;
  created_at?: string;
  updated_at?: string;
  provider_resource_id?: string;
}

interface ProjectImagesTabProps {
  projectId?: string;
  region?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  queued: "bg-yellow-100 text-yellow-700",
  saving: "bg-blue-100 text-blue-700",
  deleted: "bg-red-100 text-red-700",
  killed: "bg-red-100 text-red-700",
  pending_delete: "bg-red-100 text-red-700",
  deactivated: "bg-gray-100 text-gray-500",
};

const visibilityConfig: Record<string, { label: string; color: string }> = {
  public: { label: "Public", color: "bg-blue-100 text-blue-700" },
  private: { label: "Private", color: "bg-gray-100 text-gray-700" },
  shared: { label: "Shared", color: "bg-purple-100 text-purple-700" },
  community: { label: "Community", color: "bg-teal-100 text-teal-700" },
};

/** Return a Lucide-friendly OS icon class name plus label. */
function getOsInfo(image: MachineImage): { label: string; icon: "linux" | "windows" | "other" } {
  const raw = (image.os_type || image.os_distro || image.name || "").toLowerCase();

  if (raw.includes("windows") || raw.includes("win")) {
    return { label: "Windows", icon: "windows" };
  }
  if (
    raw.includes("linux") ||
    raw.includes("ubuntu") ||
    raw.includes("centos") ||
    raw.includes("debian") ||
    raw.includes("rhel") ||
    raw.includes("fedora") ||
    raw.includes("suse") ||
    raw.includes("alma") ||
    raw.includes("rocky")
  ) {
    return { label: "Linux", icon: "linux" };
  }
  return { label: raw || "Unknown", icon: "other" };
}

function OsIcon({ type }: { type: "linux" | "windows" | "other" }) {
  if (type === "linux") {
    // Penguin-style SVG icon for Linux
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4 text-amber-600"
      >
        <path d="M12 2C9.5 2 8 4.5 8 7c0 1.5.5 3 1 4l-3 5h12l-3-5c.5-1 1-2.5 1-4 0-2.5-1.5-5-4-5z" />
        <path d="M10 21h4" />
        <circle cx="10" cy="7" r="0.5" fill="currentColor" />
        <circle cx="14" cy="7" r="0.5" fill="currentColor" />
      </svg>
    );
  }

  if (type === "windows") {
    // Windows-style grid icon
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-500">
        <path d="M3 12V6.5l8-1.1V12H3zm9-6.8L22 3.5V12H12V5.2zM3 13h8v6.6l-8-1.1V13zm9 0h10v8.5l-10-1.3V13z" />
      </svg>
    );
  }

  return <MonitorSmartphone size={16} className="text-gray-400" />;
}

function formatSizeGB(bytes?: number): string {
  if (bytes == null || bytes === 0) return "-";
  // If already in GB (small number), show directly; otherwise convert from bytes
  if (bytes > 1_000_000) {
    return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  }
  return `${bytes} GB`;
}

function extractImages(response: unknown): MachineImage[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  const res = response as Record<string, unknown>;
  if (Array.isArray(res.data)) return res.data as MachineImage[];
  if (res.images && Array.isArray(res.images)) return res.images as MachineImage[];
  return [];
}

// ---------------------------------------------------------------------------
// Summary Card (matching ProjectStorageTab)
// ---------------------------------------------------------------------------

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    orange: "bg-orange-50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${bgColors[color] || "bg-gray-50"} flex items-center justify-center`}
        >
          <Icon size={20} className={iconColors[color] || "text-gray-600"} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProjectImagesTab({ projectId, region }: ProjectImagesTabProps) {
  const { data: imagesResponse, isFetching, refetch } = useImages(projectId, region);
  const deleteImage = useDeleteImage();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const images = useMemo(() => extractImages(imagesResponse), [imagesResponse]);

  // Summary counts
  const publicCount = images.filter((i) => (i.visibility || "").toLowerCase() === "public").length;
  const privateCount = images.filter(
    (i) => (i.visibility || "").toLowerCase() === "private"
  ).length;
  const sharedCount = images.filter((i) => {
    const v = (i.visibility || "").toLowerCase();
    return v === "shared" || v === "community";
  }).length;

  const handleDelete = async (image: MachineImage) => {
    setDeletingId(image.id);
    try {
      await deleteImage.mutateAsync({
        id: image.id,
        projectId,
        region,
      });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  // Column definitions for ModernTable
  const imageColumns: Column<MachineImage>[] = useMemo(
    () => [
      {
        key: "name",
        header: "NAME",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => (
          <div>
            <div className="font-medium text-gray-900 text-sm">{image.name || "Unnamed Image"}</div>
            {image.provider_resource_id && (
              <div className="text-xs text-gray-400 font-mono">
                {image.provider_resource_id.substring(0, 16)}...
              </div>
            )}
          </div>
        ),
      },
      {
        key: "os_type",
        header: "OS TYPE",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => {
          const osInfo = getOsInfo(image);
          return (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <OsIcon type={osInfo.icon} />
              <span>{osInfo.label}</span>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "STATUS",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              statusColors[(image.status || "").toLowerCase()] || "bg-gray-100 text-gray-600"
            }`}
          >
            {image.status || "unknown"}
          </span>
        ),
      },
      {
        key: "visibility",
        header: "VISIBILITY",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => {
          const vis =
            visibilityConfig[(image.visibility || "").toLowerCase()] || visibilityConfig.private;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${vis.color}`}
            >
              {(image.visibility || "").toLowerCase() === "public" ? (
                <Eye size={12} />
              ) : (
                <EyeOff size={12} />
              )}
              {vis.label}
            </span>
          );
        },
      },
      {
        key: "size",
        header: "SIZE",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => (
          <span className="text-sm text-gray-700">
            {formatSizeGB(image.size ?? image.min_disk)}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "CREATED",
        sortable: true,
        render: (_value: unknown, image: MachineImage) => (
          <span className="text-sm text-gray-500">
            {image.created_at ? new Date(image.created_at).toLocaleDateString() : "-"}
          </span>
        ),
      },
      {
        key: "actions",
        header: "ACTIONS",
        align: "right" as const,
        render: (_value: unknown, image: MachineImage) =>
          confirmDeleteId === image.id ? (
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => handleDelete(image)}
                disabled={deletingId === image.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId === image.id ? (
                  <RefreshCw size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Confirm
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeleteId(image.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-white border border-red-200 rounded-md hover:bg-red-50"
            >
              <Trash2 size={12} />
              Delete
            </button>
          ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmDeleteId, deletingId]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Machine Images</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse and manage VM images available to this project
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch?.()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={ImageIcon} label="Total Images" value={images.length} color="blue" />
        <SummaryCard icon={Eye} label="Public" value={publicCount} color="green" />
        <SummaryCard icon={EyeOff} label="Private" value={privateCount} color="purple" />
        <SummaryCard icon={MonitorSmartphone} label="Shared" value={sharedCount} color="orange" />
      </div>

      {/* Images Table */}
      <ModernTable<MachineImage>
        data={images}
        columns={imageColumns}
        searchable
        searchPlaceholder="Filter by image name or OS type..."
        searchKeys={["name", "os_type", "os_distro"]}
        paginated={images.length > 10}
        pageSize={10}
        loading={isFetching && images.length === 0}
        exportable={false}
        filterable={false}
        enableAnimations={false}
        emptyMessage="No images found."
      />
    </div>
  );
}
