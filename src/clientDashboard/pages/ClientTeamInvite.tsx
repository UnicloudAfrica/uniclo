import React, { useState, useCallback } from "react";
import { X, UserPlus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { PermissionChecklist } from "@/shared/components/PermissionChecklist";
import { useFetchPermissionRegistry } from "@/hooks/adminHooks/permissionHooks";
import { useInviteClientTeamMember } from "@/hooks/clientHooks/clientTeamHooks";
import type { PermissionRegistry, UserPermissionOverride } from "@/types/rbac";

// ── Types ──────────────────────────────────────────────────────────

interface ClientTeamInviteProps {
  onClose: () => void;
  onSuccess: () => void;
}

// ── Component ──────────────────────────────────────────────────────

const ClientTeamInvite: React.FC<ClientTeamInviteProps> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const inviteMember = useInviteClientTeamMember();
  const {
    data: registryData,
    isLoading: registryLoading,
  } = useFetchPermissionRegistry("client", { enabled: showPermissions });

  const registry = registryData as PermissionRegistry | undefined;

  const isValid = name.trim().length > 0 && email.trim().length > 0;

  const handlePermissionSave = useCallback(
    (overrides: UserPermissionOverride[]) => {
      const granted = overrides
        .filter((o) => o.granted)
        .map((o) => o.permission);
      setSelectedPermissions(granted);
    },
    [],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValid) return;

      const payload: { name: string; email: string; permissions?: string[] } = {
        name: name.trim(),
        email: email.trim(),
      };

      if (selectedPermissions.length > 0) {
        payload.permissions = selectedPermissions;
      }

      inviteMember.mutate(payload, {
        onSuccess: () => {
          onSuccess();
        },
      });
    },
    [name, email, selectedPermissions, isValid, inviteMember, onSuccess],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="presentation"
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invite Team Member
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="invite-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Name
            </label>
            <input
              id="invite-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="invite-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Optional permissions section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              type="button"
              onClick={() => setShowPermissions((prev) => !prev)}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <span>
                Set Permissions{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </span>
              {showPermissions ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {showPermissions && (
              <div className="px-4 pb-4">
                {registryLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-500">
                      Loading permissions...
                    </span>
                  </div>
                ) : registry ? (
                  <>
                    {selectedPermissions.length > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                        {selectedPermissions.length} permission
                        {selectedPermissions.length !== 1 ? "s" : ""} selected
                      </p>
                    )}
                    <PermissionChecklist
                      registry={registry}
                      currentPermissions={selectedPermissions}
                      onSave={handlePermissionSave}
                      isSaving={false}
                    />
                  </>
                ) : (
                  <p className="text-sm text-gray-500 py-4 text-center">
                    Unable to load permission registry.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || inviteMember.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                isValid && !inviteMember.isPending
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {inviteMember.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientTeamInvite;
