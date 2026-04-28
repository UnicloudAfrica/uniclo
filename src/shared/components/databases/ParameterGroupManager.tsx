/**
 * ParameterGroupManager -- Database parameter configuration tuning.
 *
 * Displays current parameter group, lists available groups with "Apply" action,
 * create new group form, parameter editor with searchable key/value table,
 * and reset to defaults.
 */
import React, { useState, useMemo } from "react";
import {
  Settings2,
  Plus,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Pencil,
  Trash2,
  Clock,
  Server,
} from "lucide-react";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFetchParameterGroups,
  useCreateParameterGroup,
  useUpdateParameterGroup,
  useDeleteParameterGroup,
  useResetParameterGroupDefaults,
  useApplyParameterGroup,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase, ParameterGroup } from "@/types/managedDatabase";

// ─── Types ──────────────────────────────────────────────────────

interface ParameterGroupManagerProps {
  database: ManagedDatabase;
  onRefresh?: () => void;
}

// ─── Parameter Group Status Badge ───────────────────────────────

const PgStatusBadge: React.FC<{ status: string | null | undefined }> = ({ status }) => {
  if (!status) return null;

  const config: Record<string, { icon: React.FC<{ size: number; className?: string }>; label: string; className: string }> = {
    active: { icon: CheckCircle2, label: "Active", className: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20" },
    applying: { icon: Loader2, label: "Applying", className: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-blue-500/20" },
    "pending-reboot": { icon: Clock, label: "Pending Reboot", className: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 ring-amber-500/20" },
  };

  const entry = config[status] ?? { icon: Clock, label: status, className: "bg-gray-100 text-gray-600 ring-gray-500/20" };
  const Icon = entry.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${entry.className}`}>
      <Icon size={12} className={status === "applying" ? "animate-spin" : ""} />
      {entry.label}
    </span>
  );
};

// ─── Parameter Editor ───────────────────────────────────────────

interface ParameterEditorProps {
  parameters: Record<string, unknown>;
  onChange: (params: Record<string, unknown>) => void;
  readOnly?: boolean;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({ parameters, onChange, readOnly }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const entries = useMemo(() => {
    const all = Object.entries(parameters ?? {});
    if (!searchQuery.trim()) return all;
    const q = searchQuery.toLowerCase();
    return all.filter(([key, val]) =>
      key.toLowerCase().includes(q) || String(val).toLowerCase().includes(q)
    );
  }, [parameters, searchQuery]);

  const handleValueChange = (key: string, value: string) => {
    const updated = { ...parameters };
    // Try to preserve numeric types
    const numVal = Number(value);
    updated[key] = value === "" ? "" : !isNaN(numVal) && value.trim() === String(numVal) ? numVal : value;
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search parameters..."
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-1.5 pl-8 pr-3 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                Parameter
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {entries.map(([key, val]) => (
              <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {key}
                </td>
                <td className="px-3 py-2">
                  {readOnly ? (
                    <span className="font-mono text-gray-900 dark:text-gray-100">
                      {String(val)}
                    </span>
                  ) : (
                    <input
                      type="text"
                      value={String(val)}
                      onChange={(e) => handleValueChange(key, e.target.value)}
                      className="w-full rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-0.5 font-mono text-xs text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center text-gray-400">
                  {searchQuery ? "No parameters matching search." : "No parameters configured."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-400">
        {entries.length} parameter{entries.length !== 1 ? "s" : ""}
        {searchQuery && ` matching "${searchQuery}"`}
      </p>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────

const ParameterGroupManager: React.FC<ParameterGroupManagerProps> = ({ database, onRefresh }) => {
  const identifier = database.identifier ?? database.id;
  const { data: groupsRaw, isLoading, refetch } = useFetchParameterGroups(database.engine);
  const createMutation = useCreateParameterGroup();
  const updateMutation = useUpdateParameterGroup();
  const deleteMutation = useDeleteParameterGroup();
  const resetMutation = useResetParameterGroupDefaults();
  const applyMutation = useApplyParameterGroup();

  const groups = Array.isArray(groupsRaw) ? (groupsRaw as ParameterGroup[]) : [];

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, unknown>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  // Find the currently applied group
  const currentGroup = groups.find((g) => g.id === (database as unknown as Record<string, unknown>).parameter_group_id);

  const handleCreate = async () => {
    if (!createName.trim()) return;
    setActionResult(null);
    try {
      await createMutation.mutateAsync({
        name: createName.trim(),
        engine: database.engine,
        engine_version: database.engine_version,
        description: createDescription.trim() || undefined,
      });
      setShowCreateForm(false);
      setCreateName("");
      setCreateDescription("");
      setActionResult({ success: true, message: "Parameter group created." });
      refetch();
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Failed to create." });
    }
  };

  const handleApply = async (groupId: number) => {
    setActionResult(null);
    try {
      await applyMutation.mutateAsync({ identifier, groupId });
      setActionResult({ success: true, message: "Parameter group applied. A reboot may be required." });
      onRefresh?.();
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Failed to apply." });
    }
  };

  const handleSaveParams = async (groupId: number) => {
    setActionResult(null);
    try {
      await updateMutation.mutateAsync({ groupId, params: editedParams });
      setEditingGroupId(null);
      setEditedParams({});
      setActionResult({ success: true, message: "Parameters updated. A reboot may be required." });
      refetch();
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Failed to update." });
    }
  };

  const handleReset = async (groupId: number) => {
    setActionResult(null);
    try {
      await resetMutation.mutateAsync(groupId);
      setActionResult({ success: true, message: "Parameter group reset to defaults." });
      refetch();
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Failed to reset." });
    }
  };

  const handleDelete = async (groupId: number) => {
    setActionResult(null);
    try {
      await deleteMutation.mutateAsync(groupId);
      setConfirmDeleteId(null);
      setActionResult({ success: true, message: "Parameter group deleted." });
      refetch();
    } catch (err: unknown) {
      setActionResult({ success: false, message: err instanceof Error ? err.message : "Failed to delete." });
    }
  };

  if (isLoading) {
    return (
      <ModernCard className="p-6 text-center">
        <Loader2 size={20} className="mx-auto mb-2 animate-spin text-blue-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading parameter groups...</p>
      </ModernCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Parameter Group */}
      <ModernCard className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings2 size={16} className="text-indigo-500" />
            Database Parameters
          </h3>
          <div className="flex gap-2">
            <ModernButton variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw size={14} />
            </ModernButton>
            {!showCreateForm && (
              <ModernButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
                <Plus size={14} className="mr-1" />
                New Group
              </ModernButton>
            )}
          </div>
        </div>

        {currentGroup ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {currentGroup.name}
              </span>
              <PgStatusBadge status={(database as unknown as Record<string, unknown>).parameter_group_status as string | null} />
              {currentGroup.is_default && (
                <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  DEFAULT
                </span>
              )}
            </div>
            {currentGroup.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentGroup.description}</p>
            )}
            <div className="text-xs text-gray-400">
              {currentGroup.engine} {currentGroup.engine_version} -- {Object.keys(currentGroup.parameters ?? {}).length} parameters
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No parameter group assigned. Using engine defaults.
          </div>
        )}
      </ModernCard>

      {/* Action Result */}
      {actionResult && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 ${
            actionResult.success
              ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
          }`}
        >
          {actionResult.success ? (
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
          )}
          <p
            className={`text-sm ${
              actionResult.success
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {actionResult.message}
          </p>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <ModernCard className="p-5 border-indigo-200 dark:border-indigo-800">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Create Parameter Group
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="e.g. High Performance PostgreSQL"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <p className="text-xs text-gray-400">
              Engine: {database.engine} {database.engine_version} -- Group will start with engine defaults.
            </p>
            <div className="flex gap-2 pt-1">
              <ModernButton
                variant="primary"
                size="sm"
                disabled={!createName.trim()}
                loading={createMutation.isPending}
                onClick={handleCreate}
              >
                Create Group
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateName("");
                  setCreateDescription("");
                }}
              >
                Cancel
              </ModernButton>
            </div>
          </div>
        </ModernCard>
      )}

      {/* Available Parameter Groups */}
      {groups.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Available Parameter Groups
          </h4>
          {groups.map((group) => {
            const isEditing = editingGroupId === group.id;
            const isDeleting = confirmDeleteId === group.id;
            const isCurrent = currentGroup?.id === group.id;

            return (
              <ModernCard
                key={group.id}
                className={`p-4 ${isCurrent ? "ring-1 ring-indigo-300 dark:ring-indigo-700" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {group.name}
                      </span>
                      {isCurrent && (
                        <span className="rounded bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600 dark:text-indigo-300">
                          ACTIVE
                        </span>
                      )}
                      {group.is_default && (
                        <span className="rounded bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          DEFAULT
                        </span>
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {group.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                      <span>
                        {group.engine} {group.engine_version}
                      </span>
                      <span className="flex items-center gap-1">
                        <Server size={10} />
                        {group.database_count} database{group.database_count !== 1 ? "s" : ""}
                      </span>
                      <span>{Object.keys(group.parameters ?? {}).length} params</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {!isEditing && !isDeleting && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!isCurrent && (
                        <ModernButton
                          variant="outline"
                          size="xs"
                          loading={applyMutation.isPending}
                          onClick={() => handleApply(group.id)}
                        >
                          Apply
                        </ModernButton>
                      )}
                      {!group.is_default && (
                        <>
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditedParams({ ...(group.parameters ?? {}) });
                            }}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(group.id)}
                            className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Parameter Editor */}
                {isEditing && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <ParameterEditor
                      parameters={editedParams}
                      onChange={setEditedParams}
                    />
                    <div className="flex items-center gap-2">
                      <ModernButton
                        variant="primary"
                        size="sm"
                        loading={updateMutation.isPending}
                        onClick={() => handleSaveParams(group.id)}
                      >
                        Save Changes
                      </ModernButton>
                      <ModernButton
                        variant="outline"
                        size="sm"
                        loading={resetMutation.isPending}
                        onClick={() => handleReset(group.id)}
                      >
                        <RotateCcw size={12} className="mr-1" />
                        Reset Defaults
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGroupId(null);
                          setEditedParams({});
                        }}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}

                {/* Read-only Parameter View (non-editing) */}
                {!isEditing && isCurrent && (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <ParameterEditor
                      parameters={group.parameters ?? {}}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                )}

                {/* Delete Confirmation */}
                {isDeleting && (
                  <div className="mt-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs font-medium text-red-700 dark:text-red-300">
                      Delete this parameter group?
                    </p>
                    {group.database_count > 0 && (
                      <p className="text-[11px] text-red-500">
                        {group.database_count} database(s) are using this group. They must be reassigned first.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <ModernButton
                        variant="danger"
                        size="xs"
                        disabled={group.database_count > 0}
                        loading={deleteMutation.isPending}
                        onClick={() => handleDelete(group.id)}
                      >
                        Confirm Delete
                      </ModernButton>
                      <ModernButton
                        variant="ghost"
                        size="xs"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </ModernButton>
                    </div>
                  </div>
                )}
              </ModernCard>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {groups.length === 0 && !showCreateForm && (
        <ModernCard className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/30 dark:to-violet-900/30">
            <Settings2 className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
            No Parameter Groups
          </h3>
          <p className="mx-auto max-w-sm text-sm text-gray-500 dark:text-gray-400 mb-4">
            Parameter groups let you tune engine-specific settings like memory allocation,
            connection limits, and query behavior.
          </p>
          <ModernButton variant="primary" size="sm" onClick={() => setShowCreateForm(true)}>
            <Plus size={14} className="mr-1" />
            Create Parameter Group
          </ModernButton>
        </ModernCard>
      )}
    </div>
  );
};

export default ParameterGroupManager;
