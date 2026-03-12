import React, { useState, useMemo, useCallback } from "react";
import {
  HardDrive,
  Plus,
  RefreshCw,
  Database,
  Archive,
  Camera,
  Trash2,
  ArrowUpCircle,
  Link,
  Unlink,
  X,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useSnapshots, useCreateSnapshot, useDeleteSnapshot } from "@/hooks/storageHooks";
import { useApiContext } from "@/hooks/useApiContext";
import ToastUtils from "@/utils/toastUtil";
import { ModernTable } from "@/shared/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Volume {
  id: string | number;
  name?: string;
  size_gb?: number;
  volume_type?: string;
  status?: string;
  provider_resource_id?: string;
  created_at?: string;
  instance_name?: string;
  instance_id?: string;
  description?: string;
}

interface Snapshot {
  id: string | number;
  name?: string;
  volume_id?: string;
  volume_name?: string;
  size_gb?: number;
  status?: string;
  created_at?: string;
  description?: string;
}

interface ProjectStorageTabProps {
  projectId?: string;
  region?: string;
  volumes?: any[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

type StorageSubView = "volumes" | "snapshots";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const volumeStatusColors: Record<string, string> = {
  "in-use": "bg-green-100 text-green-700",
  available: "bg-blue-100 text-blue-700",
  creating: "bg-yellow-100 text-yellow-700",
  deleting: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  deleted: "bg-gray-100 text-gray-500",
  extending: "bg-yellow-100 text-yellow-700",
  attaching: "bg-yellow-100 text-yellow-700",
  detaching: "bg-yellow-100 text-yellow-700",
};

const snapshotStatusColors: Record<string, string> = {
  available: "bg-green-100 text-green-700",
  creating: "bg-yellow-100 text-yellow-700",
  deleting: "bg-red-100 text-red-700",
  error: "bg-red-100 text-red-700",
  deleted: "bg-gray-100 text-gray-500",
};

const getApiPrefix = (context: string) => (context === "admin" ? "" : "/business");

// ---------------------------------------------------------------------------
// Summary Card (shared)
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
    indigo: "bg-indigo-50",
    cyan: "bg-cyan-50",
  };
  const iconColors: Record<string, string> = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    indigo: "text-indigo-600",
    cyan: "text-cyan-600",
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
// Confirmation Dialog
// ---------------------------------------------------------------------------

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            {confirmLabel || "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Forms
// ---------------------------------------------------------------------------

function CreateVolumeForm({
  onSubmit,
  onCancel,
  isLoading,
}: {
  onSubmit: (data: { name: string; size_gb: number; description: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [name, setName] = useState("");
  const [sizeGb, setSizeGb] = useState("10");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      size_gb: parseInt(sizeGb, 10) || 10,
      description: description.trim(),
    });
  };

  return (
    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Create New Volume</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Volume Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-volume"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Size (GB)</label>
          <input
            type="number"
            value={sizeGb}
            onChange={(e) => setSizeGb(e.target.value)}
            min={1}
            max={16384}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="md:col-span-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            Create Volume
          </button>
        </div>
      </form>
    </div>
  );
}

function ExtendVolumeForm({
  volume,
  onSubmit,
  onCancel,
  isLoading,
}: {
  volume: Volume;
  onSubmit: (newSize: number) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const currentSize = volume.size_gb || 1;
  const [newSize, setNewSize] = useState(String(currentSize + 10));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const size = parseInt(newSize, 10);
    if (size <= currentSize) {
      ToastUtils.error("New size must be larger than the current size");
      return;
    }
    onSubmit(size);
  };

  return (
    <div className="bg-yellow-50/50 border border-yellow-200 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Extend Volume: {volume.name || "Unnamed"}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4"
      >
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Current Size</label>
          <div className="px-3 py-2 text-sm text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">
            {currentSize} GB
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">New Size (GB)</label>
          <input
            type="number"
            value={newSize}
            onChange={(e) => setNewSize(e.target.value)}
            min={currentSize + 1}
            max={16384}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="flex gap-2 sm:mt-0 mt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            Extend
          </button>
        </div>
      </form>
    </div>
  );
}

function CreateSnapshotForm({
  volumes,
  onSubmit,
  onCancel,
  isLoading,
}: {
  volumes: Volume[];
  onSubmit: (data: { volume_id: string; name: string; description: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [volumeId, setVolumeId] = useState(volumes.length > 0 ? String(volumes[0].id) : "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volumeId || !name.trim()) return;
    onSubmit({ volume_id: volumeId, name: name.trim(), description: description.trim() });
  };

  return (
    <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Create New Snapshot</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Volume</label>
          <select
            value={volumeId}
            onChange={(e) => setVolumeId(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="" disabled>
              Select a volume
            </option>
            {volumes.map((v) => (
              <option key={v.id} value={String(v.id)}>
                {v.name || `Volume ${v.id}`} ({v.size_gb || 0} GB)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Snapshot Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-snapshot"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <div className="md:col-span-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !name.trim() || !volumeId}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            Create Snapshot
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Volumes Sub-View
// ---------------------------------------------------------------------------

function VolumesView({
  projectId,
  region,
  volumes,
  isLoading,
  onRefresh,
}: {
  projectId: string;
  region: string;
  volumes: Volume[];
  isLoading: boolean;
  onRefresh?: () => void;
}) {
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  const prefix = getApiPrefix(context);
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [extendingVolume, setExtendingVolume] = useState<Volume | null>(null);
  const [deletingVolumeId, setDeletingVolumeId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const inUseCount = useMemo(() => volumes.filter((v) => v.status === "in-use").length, [volumes]);
  const availableCount = useMemo(
    () => volumes.filter((v) => v.status === "available").length,
    [volumes]
  );
  const totalStorageGb = useMemo(
    () => volumes.reduce((sum, v) => sum + (v.size_gb || 0), 0),
    [volumes]
  );

  const invalidateVolumes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["volumes", projectId] });
    onRefresh?.();
  }, [queryClient, projectId, onRefresh]);

  // -- Create Volume
  const handleCreateVolume = async (data: {
    name: string;
    size_gb: number;
    description: string;
  }) => {
    setActionLoading("create");
    try {
      await axios.post(
        `${apiBaseUrl}${prefix}/volumes`,
        { project_id: projectId, region, ...data },
        { headers: authHeaders, withCredentials: true }
      );
      ToastUtils.success("Volume creation initiated");
      setShowCreateForm(false);
      invalidateVolumes();
    } catch (err: any) {
      ToastUtils.error(err.response?.data?.message || "Failed to create volume");
    } finally {
      setActionLoading(null);
    }
  };

  // -- Delete Volume
  const handleDeleteVolume = async () => {
    if (!deletingVolumeId) return;
    setActionLoading(`delete-${deletingVolumeId}`);
    try {
      await axios.delete(`${apiBaseUrl}${prefix}/volumes/${deletingVolumeId}`, {
        params: { project_id: projectId, region },
        headers: authHeaders,
        withCredentials: true,
      });
      ToastUtils.success("Volume deleted successfully");
      setDeletingVolumeId(null);
      invalidateVolumes();
    } catch (err: any) {
      ToastUtils.error(err.response?.data?.message || "Failed to delete volume");
    } finally {
      setActionLoading(null);
    }
  };

  // -- Extend Volume
  const handleExtendVolume = async (newSize: number) => {
    if (!extendingVolume) return;
    const volId = String(extendingVolume.id);
    setActionLoading(`extend-${volId}`);
    try {
      await axios.post(
        `${apiBaseUrl}${prefix}/volumes/${volId}/extend`,
        { project_id: projectId, region, new_size_gb: newSize },
        { headers: authHeaders, withCredentials: true }
      );
      ToastUtils.success("Volume extend initiated");
      setExtendingVolume(null);
      invalidateVolumes();
    } catch (err: any) {
      ToastUtils.error(err.response?.data?.message || "Failed to extend volume");
    } finally {
      setActionLoading(null);
    }
  };

  // -- Attach Volume
  const handleAttachVolume = async (vol: Volume) => {
    const instanceId = prompt("Enter the Instance ID to attach this volume to:");
    if (!instanceId) return;
    const volId = String(vol.id);
    setActionLoading(`attach-${volId}`);
    try {
      await axios.post(
        `${apiBaseUrl}${prefix}/volumes/${volId}/attach`,
        { project_id: projectId, region, instance_id: instanceId },
        { headers: authHeaders, withCredentials: true }
      );
      ToastUtils.success("Volume attach initiated");
      invalidateVolumes();
    } catch (err: any) {
      ToastUtils.error(err.response?.data?.message || "Failed to attach volume");
    } finally {
      setActionLoading(null);
    }
  };

  // -- Detach Volume
  const handleDetachVolume = async (vol: Volume) => {
    const volId = String(vol.id);
    setActionLoading(`detach-${volId}`);
    try {
      await axios.post(
        `${apiBaseUrl}${prefix}/volumes/${volId}/detach`,
        { project_id: projectId, region },
        { headers: authHeaders, withCredentials: true }
      );
      ToastUtils.success("Volume detach initiated");
      invalidateVolumes();
    } catch (err: any) {
      ToastUtils.error(err.response?.data?.message || "Failed to detach volume");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard icon={HardDrive} label="Total Volumes" value={volumes.length} color="blue" />
        <SummaryCard icon={Database} label="In Use" value={inUseCount} color="green" />
        <SummaryCard icon={Archive} label="Available" value={availableCount} color="purple" />
        <SummaryCard
          icon={HardDrive}
          label="Total Storage"
          value={`${totalStorageGb} GB`}
          color="orange"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {volumes.length} volume{volumes.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={14} />
            Create Volume
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateVolumeForm
          onSubmit={handleCreateVolume}
          onCancel={() => setShowCreateForm(false)}
          isLoading={actionLoading === "create"}
        />
      )}

      {/* Extend Form */}
      {extendingVolume && (
        <ExtendVolumeForm
          volume={extendingVolume}
          onSubmit={handleExtendVolume}
          onCancel={() => setExtendingVolume(null)}
          isLoading={actionLoading === `extend-${extendingVolume.id}`}
        />
      )}

      {/* Volume Table */}
      <ModernTable<Volume>
        data={volumes}
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            render: (_val, vol) => (
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {vol.name || "Unnamed Volume"}
                </div>
                {vol.provider_resource_id && (
                  <div className="text-xs text-gray-400 font-mono">
                    {vol.provider_resource_id.length > 16
                      ? `${vol.provider_resource_id.substring(0, 16)}...`
                      : vol.provider_resource_id}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "size_gb",
            header: "Size",
            sortable: true,
            render: (_val, vol) => (
              <span className="text-sm text-gray-700">
                {vol.size_gb ? `${vol.size_gb} GB` : "-"}
              </span>
            ),
          },
          {
            key: "volume_type",
            header: "Type",
            sortable: true,
            render: (_val, vol) => (
              <span className="text-sm text-gray-700">{vol.volume_type || "standard"}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (_val, vol) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  volumeStatusColors[vol.status || ""] || "bg-gray-100 text-gray-600"
                }`}
              >
                {vol.status || "unknown"}
              </span>
            ),
          },
          {
            key: "instance_name",
            header: "Attached To",
            sortable: true,
            render: (_val, vol) => (
              <span className="text-sm text-gray-500">
                {vol.instance_name || vol.instance_id || "-"}
              </span>
            ),
          },
          {
            key: "created_at",
            header: "Created",
            sortable: true,
            render: (_val, vol) => (
              <span className="text-sm text-gray-500">
                {vol.created_at ? new Date(vol.created_at).toLocaleDateString() : "-"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (_val, vol) => {
              const volId = String(vol.id);
              const isInUse = vol.status === "in-use";
              const isAvailable = vol.status === "available";
              const isActionable = isInUse || isAvailable;

              return (
                <div className="flex items-center justify-end gap-1">
                  {/* Attach / Detach */}
                  {isAvailable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAttachVolume(vol);
                      }}
                      disabled={!!actionLoading}
                      title="Attach to instance"
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === `attach-${volId}` ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Link size={14} />
                      )}
                    </button>
                  )}
                  {isInUse && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDetachVolume(vol);
                      }}
                      disabled={!!actionLoading}
                      title="Detach from instance"
                      className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === `detach-${volId}` ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Unlink size={14} />
                      )}
                    </button>
                  )}

                  {/* Extend */}
                  {isActionable && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExtendingVolume(vol);
                      }}
                      disabled={!!actionLoading}
                      title="Extend volume size"
                      className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      <ArrowUpCircle size={14} />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingVolumeId(volId);
                    }}
                    disabled={!!actionLoading || isInUse}
                    title={isInUse ? "Detach volume before deleting" : "Delete volume"}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            },
          },
        ]}
        searchable={true}
        searchKeys={["name", "status", "volume_type", "instance_name"]}
        paginated={volumes.length > 10}
        pageSize={10}
        exportable={false}
        filterable={false}
        enableAnimations={false}
        emptyMessage={
          <div className="text-center py-6">
            <HardDrive className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No volumes yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a volume to add block storage to your instances
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      {deletingVolumeId && (
        <ConfirmDialog
          title="Delete Volume"
          message="Are you sure you want to delete this volume? This action cannot be undone and all data on the volume will be lost."
          confirmLabel="Delete Volume"
          onConfirm={handleDeleteVolume}
          onCancel={() => setDeletingVolumeId(null)}
          isLoading={actionLoading === `delete-${deletingVolumeId}`}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Snapshots Sub-View
// ---------------------------------------------------------------------------

function SnapshotsView({
  projectId,
  region,
  volumes,
}: {
  projectId: string;
  region: string;
  volumes: Volume[];
}) {
  const {
    data: snapshotsData,
    isFetching: isLoadingSnapshots,
    refetch: refetchSnapshots,
  } = useSnapshots(projectId, region);

  const createSnapshotMutation = useCreateSnapshot();
  const deleteSnapshotMutation = useDeleteSnapshot();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(null);

  const snapshots: Snapshot[] = useMemo(() => {
    if (!snapshotsData) return [];
    if (Array.isArray(snapshotsData)) return snapshotsData;
    if (Array.isArray((snapshotsData as any).data)) return (snapshotsData as any).data;
    return [];
  }, [snapshotsData]);

  const totalSnapshotSize = useMemo(
    () => snapshots.reduce((sum, s) => sum + (s.size_gb || 0), 0),
    [snapshots]
  );

  const handleCreateSnapshot = (data: { volume_id: string; name: string; description: string }) => {
    createSnapshotMutation.mutate(
      {
        project_id: projectId,
        region,
        volume_id: data.volume_id,
        name: data.name,
        description: data.description || undefined,
      },
      {
        onSuccess: () => {
          setShowCreateForm(false);
        },
      }
    );
  };

  const handleDeleteSnapshot = () => {
    if (!deletingSnapshotId) return;
    deleteSnapshotMutation.mutate(
      { id: deletingSnapshotId, projectId, region },
      {
        onSuccess: () => {
          setDeletingSnapshotId(null);
        },
      }
    );
  };

  // Build a volume name lookup
  const volumeNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    volumes.forEach((v) => {
      map[String(v.id)] = v.name || `Volume ${v.id}`;
    });
    return map;
  }, [volumes]);

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={Camera}
          label="Total Snapshots"
          value={snapshots.length}
          color="indigo"
        />
        <SummaryCard
          icon={HardDrive}
          label="Total Size"
          value={`${totalSnapshotSize} GB`}
          color="cyan"
        />
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          {snapshots.length} snapshot{snapshots.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => refetchSnapshots()}
            disabled={isLoadingSnapshots}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoadingSnapshots ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={showCreateForm || volumes.length === 0}
            title={volumes.length === 0 ? "Create a volume first" : "Create a snapshot"}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus size={14} />
            Create Snapshot
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <CreateSnapshotForm
          volumes={volumes}
          onSubmit={handleCreateSnapshot}
          onCancel={() => setShowCreateForm(false)}
          isLoading={createSnapshotMutation.isPending}
        />
      )}

      {/* Snapshots Table */}
      <ModernTable<Snapshot>
        data={snapshots}
        columns={[
          {
            key: "name",
            header: "Name",
            sortable: true,
            render: (_val, snap) => (
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {snap.name || "Unnamed Snapshot"}
                </div>
                {snap.description && (
                  <div className="text-xs text-gray-400 truncate max-w-[200px]">
                    {snap.description}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "volume_name",
            header: "Volume",
            sortable: true,
            render: (_val, snap) => (
              <span className="text-sm text-gray-700">
                {snap.volume_name ||
                  (snap.volume_id ? volumeNameMap[snap.volume_id] || snap.volume_id : "-")}
              </span>
            ),
          },
          {
            key: "size_gb",
            header: "Size",
            sortable: true,
            render: (_val, snap) => (
              <span className="text-sm text-gray-700">
                {snap.size_gb ? `${snap.size_gb} GB` : "-"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            sortable: true,
            render: (_val, snap) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  snapshotStatusColors[snap.status || ""] || "bg-gray-100 text-gray-600"
                }`}
              >
                {snap.status || "unknown"}
              </span>
            ),
          },
          {
            key: "created_at",
            header: "Created",
            sortable: true,
            render: (_val, snap) => (
              <span className="text-sm text-gray-500">
                {snap.created_at ? new Date(snap.created_at).toLocaleDateString() : "-"}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            align: "right" as const,
            render: (_val, snap) => (
              <div className="flex items-center justify-end gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingSnapshotId(String(snap.id));
                  }}
                  disabled={deleteSnapshotMutation.isPending}
                  title="Delete snapshot"
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
        searchable={true}
        searchKeys={["name", "status", "volume_name"]}
        paginated={snapshots.length > 10}
        pageSize={10}
        exportable={false}
        filterable={false}
        enableAnimations={false}
        emptyMessage={
          <div className="text-center py-6">
            <Camera className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">No snapshots yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a snapshot to back up your volume data
            </p>
          </div>
        }
      />

      {/* Delete Confirmation */}
      {deletingSnapshotId && (
        <ConfirmDialog
          title="Delete Snapshot"
          message="Are you sure you want to delete this snapshot? This action cannot be undone."
          confirmLabel="Delete Snapshot"
          onConfirm={handleDeleteSnapshot}
          onCancel={() => setDeletingSnapshotId(null)}
          isLoading={deleteSnapshotMutation.isPending}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProjectStorageTab({
  projectId,
  region,
  volumes = [],
  isLoading = false,
  onRefresh,
}: ProjectStorageTabProps) {
  const [activeSubView, setActiveSubView] = useState<StorageSubView>("volumes");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Block Storage</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage volumes and snapshots for your project
          </p>
        </div>
      </div>

      {/* Sub-View Toggle */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-gray-100 pb-3 md:pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveSubView("volumes")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubView === "volumes"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <HardDrive size={16} />
          Volumes
        </button>
        <button
          onClick={() => setActiveSubView("snapshots")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubView === "snapshots"
              ? "bg-blue-50 text-blue-600"
              : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Camera size={16} />
          Snapshots
        </button>
      </div>

      {/* Active Sub-View */}
      {activeSubView === "volumes" ? (
        <VolumesView
          projectId={projectId || ""}
          region={region || ""}
          volumes={volumes as Volume[]}
          isLoading={isLoading}
          onRefresh={onRefresh}
        />
      ) : (
        <SnapshotsView
          projectId={projectId || ""}
          region={region || ""}
          volumes={volumes as Volume[]}
        />
      )}
    </div>
  );
}
