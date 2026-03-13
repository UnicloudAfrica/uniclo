/**
 * PermissionChecklist — A reusable permission editor UI.
 *
 * Displays permissions grouped by category with toggle switches.
 * Used in admin user details, tenant member details, and client team management.
 */
import React, { useState, useCallback } from "react";
import type { PermissionRegistry, UserPermissionOverride } from "@/types/rbac";

interface PermissionChecklistProps {
  /** The permission registry (grouped permissions). */
  registry: PermissionRegistry;
  /** Currently granted permissions for this user. */
  currentPermissions: string[];
  /** Called when the user toggles permissions and clicks save. */
  onSave: (overrides: UserPermissionOverride[]) => void;
  /** Whether the save action is in progress. */
  isSaving?: boolean;
  /** If true, all toggles are disabled (view-only mode). */
  readOnly?: boolean;
}

/**
 * Convert a permission key like 'billing.view' to 'Billing View'.
 */
function formatPermissionLabel(key: string): string {
  return key
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function PermissionChecklist({
  registry,
  currentPermissions,
  onSave,
  isSaving = false,
  readOnly = false,
}: PermissionChecklistProps) {
  const [localPermissions, setLocalPermissions] = useState<Set<string>>(
    new Set(currentPermissions)
  );
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = useCallback(
    (permission: string) => {
      if (readOnly) return;
      setLocalPermissions((prev) => {
        const next = new Set(prev);
        if (next.has(permission)) {
          next.delete(permission);
        } else {
          next.add(permission);
        }
        return next;
      });
      setHasChanges(true);
    },
    [readOnly]
  );

  const handleToggleGroup = useCallback(
    (groupPerms: string[]) => {
      if (readOnly) return;
      setLocalPermissions((prev) => {
        const next = new Set(prev);
        const allGranted = groupPerms.every((p) => next.has(p));
        if (allGranted) {
          groupPerms.forEach((p) => next.delete(p));
        } else {
          groupPerms.forEach((p) => next.add(p));
        }
        return next;
      });
      setHasChanges(true);
    },
    [readOnly]
  );

  const handleSave = useCallback(() => {
    const allPerms = Object.values(registry).flat();
    const overrides: UserPermissionOverride[] = allPerms.map((perm) => ({
      permission: perm,
      granted: localPermissions.has(perm),
    }));
    onSave(overrides);
    setHasChanges(false);
  }, [localPermissions, registry, onSave]);

  const groups = Object.entries(registry);

  return (
    <div className="space-y-6">
      {groups.map(([group, permissions]) => {
        const allGranted = permissions.every((p) => localPermissions.has(p));
        const someGranted = permissions.some((p) => localPermissions.has(p));

        return (
          <div key={group} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{group}</h4>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleToggleGroup(permissions)}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {allGranted ? "Revoke All" : "Grant All"}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {permissions.map((perm) => {
                const isGranted = localPermissions.has(perm);
                return (
                  <label
                    key={perm}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isGranted}
                        onChange={() => handleToggle(perm)}
                        disabled={readOnly}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-9 h-5 rounded-full transition-colors ${
                          isGranted
                            ? "bg-blue-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        } ${readOnly ? "opacity-50" : "cursor-pointer"}`}
                        onClick={() => handleToggle(perm)}
                        role="presentation"
                      />
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          isGranted ? "translate-x-4" : ""
                        }`}
                        onClick={() => handleToggle(perm)}
                        role="presentation"
                      />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {formatPermissionLabel(perm)}
                    </span>
                  </label>
                );
              })}
            </div>

            {someGranted && !allGranted && (
              <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                Partial access — {permissions.filter((p) => localPermissions.has(p)).length} of{" "}
                {permissions.length} permissions granted
              </div>
            )}
          </div>
        );
      })}

      {!readOnly && (
        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
              hasChanges && !isSaving
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isSaving ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      )}
    </div>
  );
}

export default PermissionChecklist;
