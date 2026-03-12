import React from "react";
import { Loader2, X } from "lucide-react";

const PROJECT_MEMBERSHIP_SCOPES = [
  {
    value: "internal",
    label: "Internal (admins)",
    description: "Share with all platform admins only.",
  },
  {
    value: "tenant",
    label: "Tenant workspace",
    description: "Attach to a tenant and their accepted members.",
  },
  {
    value: "client",
    label: "Client",
    description: "Attach to a client's workspace or tenant membership if available.",
  },
];

export interface ProjectMembershipSelectorProps {
  assignmentScope: string;
  lockAssignmentScope: boolean;
  shouldFetchMembers: boolean;
  isMembersFetching: boolean;
  selectedMembers: any[];
  selectedMemberIds: Set<number>;
  suggestedMembers: any[];
  showRestoreMembers: boolean;
  onAssignmentScopeChange: (value: string) => void;
  onToggleMember: (member: any) => void;
  onRestoreMembers: () => void;
}

const ProjectMembershipSelector: React.FC<ProjectMembershipSelectorProps> = ({
  assignmentScope,
  lockAssignmentScope,
  shouldFetchMembers,
  isMembersFetching,
  selectedMembers,
  selectedMemberIds,
  suggestedMembers,
  showRestoreMembers,
  onAssignmentScopeChange,
  onToggleMember,
  onRestoreMembers,
}) => {
  const assignmentScopeDetails =
    PROJECT_MEMBERSHIP_SCOPES.find((option) => option.value === assignmentScope) ||
    PROJECT_MEMBERSHIP_SCOPES[0];

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Assignment Scope</label>
        {lockAssignmentScope ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {assignmentScopeDetails?.label || "Internal (admins)"}
            </p>
            {assignmentScopeDetails?.description ? (
              <p className="mt-1 text-xs text-gray-500">{assignmentScopeDetails.description}</p>
            ) : null}
            <p className="mt-2 text-[11px] text-gray-400">
              Controlled by Customer Context in the workflow step.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {PROJECT_MEMBERSHIP_SCOPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onAssignmentScopeChange(option.value)}
                className={`rounded-2xl border p-4 text-left transition-all ${
                  assignmentScope === option.value
                    ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500 mt-1">{option.description}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Project Members</label>
          {showRestoreMembers && (
            <button
              type="button"
              onClick={onRestoreMembers}
              className="text-xs text-primary-600 hover:underline"
              disabled={isMembersFetching}
            >
              Restore default selection
            </button>
          )}
        </div>

        {shouldFetchMembers ? (
          <>
            <div className="min-h-[48px] rounded-2xl border border-gray-200 px-3 py-2 bg-white">
              {isMembersFetching && selectedMembers.length === 0 ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading members...
                </div>
              ) : selectedMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member: any) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center bg-primary-600 text-white text-xs px-3 py-1 rounded-full"
                    >
                      {member.name || member.email || `User #${member.id}`}
                      <button
                        type="button"
                        className="ml-2 text-white hover:text-gray-100"
                        onClick={() => onToggleMember(member)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No members selected yet. Use the suggestions below to choose who should join the
                  project.
                </p>
              )}
            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-white">
              <div className="px-4 py-2 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Suggested members
              </div>
              {isMembersFetching ? (
                <div className="flex items-center px-4 py-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching latest workspace members...
                </div>
              ) : suggestedMembers.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {suggestedMembers.map((member: any) => {
                    const isSelected = selectedMemberIds.has(Number(member.id));
                    return (
                      <label
                        key={member.id}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected}
                          onChange={() => onToggleMember(member)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {member.name || member.email || `User #${member.id}`}
                          </p>
                          {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
                          {member.role && (
                            <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                              {member.role}
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No suggested members for this scope yet. Adjust the assignment settings or choose
                  a different customer context.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Select a matching tenant or user to load membership suggestions.
          </p>
        )}
      </div>
    </div>
  );
};

export default ProjectMembershipSelector;
