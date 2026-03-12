import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  MapPin,
  Info,
  Archive,
  Network,
  RotateCcw,
  Clock,
  Hash,
  Layers,
} from "lucide-react";

interface ProjectSettingsTabProps {
  project: {
    id?: string | number;
    identifier?: string;
    name?: string;
    description?: string;
    provider?: string;
    region?: string;
    status?: string;
    type?: string;
    metadata?: Record<string, unknown>;
    created_at?: string;
    updated_at?: string;
  };
  onUpdateProject?: (data: { name: string; description: string }) => Promise<void>;
  onDeleteProject?: () => Promise<void>;
  onArchiveProject?: () => Promise<void>;
  onActivateProject?: () => Promise<void>;
}

export default function ProjectSettingsTab({
  project,
  onUpdateProject,
  onDeleteProject,
  onArchiveProject,
  onActivateProject,
}: ProjectSettingsTabProps) {
  const [name, setName] = useState(project.name || "");
  const [description, setDescription] = useState(project.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(project.updated_at || "");

  // Archive modal
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isArchived = project.status === "inactive";

  // Sync state when project prop changes (e.g. after refetch)
  useEffect(() => {
    setName(project.name || "");
    setDescription(project.description || "");
    setLastUpdated(project.updated_at || "");
  }, [project.name, project.description, project.updated_at]);

  const hasChanges = name !== (project.name || "") || description !== (project.description || "");

  const handleSave = async () => {
    if (!onUpdateProject || !hasChanges) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateProject({ name, description });
      setSaveSuccess(true);
      setLastUpdated(new Date().toISOString());
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!onArchiveProject) return;
    setIsArchiving(true);
    try {
      await onArchiveProject();
      setShowArchiveModal(false);
      setArchiveConfirmText("");
    } catch {
      // Error handled by parent
    } finally {
      setIsArchiving(false);
    }
  };

  const handleActivate = async () => {
    if (!onActivateProject) return;
    setIsArchiving(true);
    try {
      await onActivateProject();
    } catch {
      // Error handled by parent
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDeleteProject) return;
    setIsDeleting(true);
    try {
      await onDeleteProject();
      setShowDeleteModal(false);
      setDeleteConfirmText("");
    } catch {
      // Error handled by parent
    } finally {
      setIsDeleting(false);
    }
  };

  const networkPreset = (project.metadata as Record<string, unknown>)?.network_preset as string;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6 max-w-3xl">
      {/* General Information */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Settings size={18} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">General Information</h3>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe this project..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            {saveSuccess && (
              <span className="text-sm text-green-600 font-medium">Saved successfully!</span>
            )}
          </div>
        </div>
      </div>

      {/* Project Details (Read-Only) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          <Info size={18} className="text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700">Project Details</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <InfoField icon={Hash} label="Project ID" value={project.identifier || "-"} />
            <InfoField icon={MapPin} label="Region" value={(project.region || "-").toUpperCase()} />
            <InfoField
              icon={Info}
              label="Status"
              value={(project.status || "unknown")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            />
            <InfoField
              icon={Network}
              label="Network Preset"
              value={
                networkPreset
                  ? networkPreset.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
                  : "Standard"
              }
            />
            <InfoField
              icon={Layers}
              label="Project Type"
              value={(project.type || "vpc").toUpperCase()}
            />
            <InfoField
              icon={Clock}
              label="Created"
              value={project.created_at ? formatDate(project.created_at) : "-"}
            />
            <InfoField
              icon={Clock}
              label="Last Updated"
              value={lastUpdated ? formatDate(lastUpdated) : "-"}
            />
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
        <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle size={18} className="text-red-500" />
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* Archive / Activate Project */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 py-3 border-b border-gray-100">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                {isArchived ? "Reactivate Project" : "Archive Project"}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {isArchived
                  ? "This project is archived. Reactivate it to resume normal operations."
                  : "Archive this project. It can be reactivated later."}
              </p>
            </div>
            {isArchived ? (
              <button
                onClick={handleActivate}
                disabled={isArchiving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
              >
                <RotateCcw size={14} />
                {isArchiving ? "Activating..." : "Reactivate"}
              </button>
            ) : (
              <button
                onClick={() => setShowArchiveModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100"
              >
                <Archive size={14} />
                Archive
              </button>
            )}
          </div>

          {/* Delete Project */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 py-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Delete Project</h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Permanently delete this project and all associated resources. This action cannot be
                undone.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-5 py-4 bg-orange-50 border-b border-orange-200 flex items-center gap-2">
              <Archive size={18} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-orange-700">Archive Project</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Archiving this project will deactivate it and prevent any new operations. All
                existing resources will remain intact and the project can be reactivated later.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type <span className="font-mono font-bold text-orange-600">archive</span> to
                  confirm
                </label>
                <input
                  type="text"
                  value={archiveConfirmText}
                  onChange={(e) => setArchiveConfirmText(e.target.value)}
                  placeholder="archive"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowArchiveModal(false);
                    setArchiveConfirmText("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiveConfirmText !== "archive" || isArchiving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Archive size={14} />
                  {isArchiving ? "Archiving..." : "Archive Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              <h3 className="text-sm font-semibold text-red-700">Delete Project</h3>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                This will <span className="font-semibold text-red-600">permanently delete</span>{" "}
                this project and all associated resources including instances, volumes, and
                networks. This action <span className="font-semibold">cannot be undone</span>.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type{" "}
                  <span className="font-mono font-bold text-red-600">
                    {project.name || project.identifier}
                  </span>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={project.name || project.identifier || ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={
                    deleteConfirmText !== (project.name || project.identifier) || isDeleting
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Delete Project"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
