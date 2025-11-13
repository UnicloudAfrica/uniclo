import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShieldCheck, Users, X } from "lucide-react";
import ModernButton from "../../adminDashboard/components/ModernButton";

const statusPillClasses =
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide";

const formatRole = (role) => {
  if (!role) return null;
  if (Array.isArray(role)) {
    return role.join(", ");
  }
  return role;
};

const ProjectMemberManagerModal = ({
  isOpen,
  onClose,
  members = [],
  selectedIds = new Set(),
  onToggleMember,
  onSave,
  isLoading = false,
  isSaving = false,
  errorMessage = "",
  ownerWarning = "",
}) => {
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSearchValue("");
    }
  }, [isOpen]);

  const selectedSet = useMemo(() => {
    if (selectedIds instanceof Set) {
      return selectedIds;
    }
    if (Array.isArray(selectedIds)) {
      return new Set(selectedIds);
    }
    return new Set();
  }, [selectedIds]);

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) return [];
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      return members;
    }
    return members.filter((member) => {
      const haystack = `${member.name || ""} ${member.email || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [members, searchValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4 font-Outfit">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b px-6 py-4">
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900">Manage project members</p>
            <p className="text-sm text-slate-500">
              Select who can access this project. Removing a user revokes their access immediately.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            disabled={isSaving}
            aria-label="Close member manager"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 px-4 py-2 focus-within:ring-2 focus-within:ring-sky-100">
              <Search size={14} className="text-slate-400" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search by name or email"
                className="h-5 flex-1 border-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-600">
              <Users size={16} className="text-slate-400" />
              {selectedSet.size} selected
            </span>
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Fetching available users…
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-slate-500">
                No users match your search.
              </div>
            ) : (
              filteredMembers.map((member) => {
                const roleLabel = formatRole(member.role);
                return (
                  <label
                    key={member.id}
                    className="flex items-start gap-3 border-b border-slate-100 px-5 py-3 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-200"
                      checked={selectedSet.has(member.id)}
                      onChange={() => onToggleMember?.(member.id)}
                      disabled={isSaving}
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {member.name || member.email || `User #${member.id}`}
                        </p>
                        {member.isOwner && (
                          <span className={`${statusPillClasses} border-sky-200 bg-sky-50 text-sky-700`}>
                            <ShieldCheck size={12} />
                            Owner
                          </span>
                        )}
                        {member.isCurrent && !member.isOwner && (
                          <span className={`${statusPillClasses} border-emerald-200 bg-emerald-50 text-emerald-700`}>
                            Current
                          </span>
                        )}
                        {!member.isCurrent && (
                          <span className={`${statusPillClasses} border-slate-200 bg-slate-50 text-slate-500`}>
                            Suggested
                          </span>
                        )}
                      </div>
                      {member.email && (
                        <p className="text-xs text-slate-500">{member.email}</p>
                      )}
                      {roleLabel && (
                        <p className="text-xs text-slate-400">Role: {roleLabel}</p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {ownerWarning ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {ownerWarning}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4">
          <button
            type="button"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <ModernButton
            className="min-w-[140px] justify-center"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{isSaving ? "Saving..." : "Save changes"}</span>
          </ModernButton>
        </div>
      </div>
    </div>
  );
};

export default ProjectMemberManagerModal;
