// @ts-nocheck
import React, { useMemo, useState } from "react";
import { X, Search, User } from "lucide-react";
import { ModernButton } from "../ui";
import { useFetchAdmins } from "../../../hooks/adminHooks/adminHooks";
import { useFetchTenantAdmins } from "../../../hooks/adminUserHooks";

const UserSelectModal = ({
  context = "admin",
  isOpen,
  onClose,
  onSelect,
  title = "Select User to Assign",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  const adminQuery = useFetchAdmins({ enabled: context === "admin" && isOpen });
  const tenantQuery = useFetchTenantAdmins({ enabled: context === "tenant" && isOpen });

  const users = context === "tenant" ? tenantQuery.data || [] : adminQuery.data || [];
  const loading = context === "tenant" ? tenantQuery.isLoading : adminQuery.isLoading;

  const filteredUsers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return (users || []).filter((user) =>
      [user.name, user.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchLower))
    );
  }, [users, searchTerm]);

  const handleSelect = () => {
    if (selectedUser) {
      onSelect?.(selectedUser);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchTerm("");
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div className="mb-4 max-h-96 space-y-2 overflow-y-auto">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--theme-color)] border-t-transparent" />
            </div>
          ) : filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelectedUser(user)}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                  selectedUser?.id === user.id
                    ? "border-[var(--theme-color)] bg-[rgb(var(--theme-color-50))]"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-color)] text-sm font-bold text-white">
                  {user.name?.[0] || user.email?.[0] || "U"}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{user.name || "Unnamed User"}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                {selectedUser?.id === user.id && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-color)]">
                    <svg
                      className="h-3 w-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-slate-500">
              <User className="mb-2 h-8 w-8" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <ModernButton onClick={handleSelect} disabled={!selectedUser} className="px-4 py-2">
            Assign
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default UserSelectModal;
