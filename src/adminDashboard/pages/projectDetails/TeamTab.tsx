import React, { useState } from "react";
import { User, XCircle } from "lucide-react";
import { ModernButton, ModernTable } from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil";

interface TeamTabProps {
  project: any;
  allProjectUsers: any[];
  cloudPolicies: any[];
  assignPolicy: any;
  revokePolicy: any;
  handleUserAction: (user: any, actionKey: string) => Promise<void>;
  refetchProjectDetails: () => Promise<any>;
  refetchProjectStatus: () => Promise<any>;
  isAssigningPolicy: boolean;
  isRevokingPolicy: boolean;
  setIsMemberModalOpen: (open: boolean) => void;
  formatMemberName: (user: any) => string;
  handleInviteSubmit: (e: React.FormEvent) => Promise<void>;
  inviteForm: {
    name: string;
    email: string;
    role: string;
    note: string;
  };
  setInviteForm: (form: any) => void;
}

const TeamTab: React.FC<TeamTabProps> = ({
  project,
  allProjectUsers,
  cloudPolicies,
  assignPolicy,
  revokePolicy,
  handleUserAction,
  refetchProjectDetails,
  refetchProjectStatus,
  isAssigningPolicy,
  isRevokingPolicy,
  setIsMemberModalOpen,
  formatMemberName,
  handleInviteSubmit,
  inviteForm,
  setInviteForm,
}) => {
  const [activeTeamTab, setActiveTeamTab] = useState<"provisioning" | "invite">("provisioning");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
          <p className="text-sm text-gray-500">
            Keep collaborators aligned—invite operators or tweak roles fast.
          </p>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTeamTab("provisioning")}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
              activeTeamTab === "provisioning"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTeamTab("invite")}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
              activeTeamTab === "invite"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Invite
          </button>
        </div>
      </div>

      {activeTeamTab === "provisioning" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <ModernButton size="sm" variant="outline" onClick={() => setIsMemberModalOpen(true)}>
              Manage Team
            </ModernButton>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <ModernTable
              data={allProjectUsers.map((user: any) => ({ ...user, id: user.id }))}
              columns={[
                {
                  key: "user_info",
                  header: "MEMBER",
                  render: (_, user: any) => (
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 leading-tight">
                        {formatMemberName(user)}
                      </span>
                      <span className="text-[10px] text-gray-400 break-all">{user.email}</span>
                    </div>
                  ),
                },
                {
                  key: "role",
                  header: "ROLE",
                  render: (_, user: any) => (
                    <div className="flex flex-col">
                      <span className="text-gray-900 border px-2 py-0.5 rounded-full text-[10px] w-fit font-mono font-bold uppercase mb-1">
                        {user.status?.role ||
                          (Array.isArray(user.roles) ? user.roles[0] : user.role) ||
                          "Member"}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.status?.provider_account ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[8px] font-bold border border-green-200">
                            ACCOUNT READY
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 text-[8px] font-bold border border-gray-200">
                            NO ACCOUNT
                          </span>
                        )}
                        {user.status?.aws_policy && (
                          <span
                            className="px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[8px] font-bold border border-blue-200"
                            title="Storage Policy Attached"
                          >
                            STORAGE
                          </span>
                        )}
                        {user.status?.symp_policy && (
                          <span
                            className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[8px] font-bold border border-indigo-200"
                            title="Network Policy Attached"
                          >
                            NETWORK
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "policies",
                  header: "CLOUD POLICIES",
                  render: (_, user: any) => (
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <div className="flex flex-wrap gap-1.5">
                        {user.status?.cloud_policies && user.status.cloud_policies.length > 0 ? (
                          user.status.cloud_policies.map((policy: any) => (
                            <div
                              key={policy.id}
                              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                policy.status === "active"
                                  ? "bg-blue-50 border-blue-200 text-blue-800"
                                  : "bg-gray-50 border-gray-200 text-gray-500"
                              }`}
                            >
                              <span>{policy.name}</span>
                              {policy.status === "active" && !policy.is_compulsory && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Revoke ${policy.name} for ${user.email}?`)) {
                                      try {
                                        const toastId = `policy-action-${user.id}`;
                                        ToastUtils.info(`Revoking ${policy.name}...`, {
                                          id: toastId,
                                        });
                                        const res = await revokePolicy({
                                          projectId: project?.identifier || project?.id,
                                          userId: user.id,
                                          policyId: policy.id,
                                        });
                                        ToastUtils.success(
                                          res?.data?.message || "Policy revoked successfully",
                                          { id: toastId }
                                        );
                                        refetchProjectDetails();
                                        refetchProjectStatus();
                                      } catch (err: any) {
                                        const msg =
                                          err?.response?.data?.message ||
                                          err?.message ||
                                          "Failed to revoke policy";
                                        ToastUtils.error(msg, {
                                          id: `policy-action-${user.id}`,
                                        });
                                      }
                                    }
                                  }}
                                  className="text-blue-400 hover:text-red-500 transition-colors"
                                  title={`Revoke ${policy.name}`}
                                  disabled={isRevokingPolicy}
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              )}
                              {policy.is_compulsory && (
                                <span className="text-[8px] text-blue-400/80 font-bold">(REQ)</span>
                              )}
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            No cloud policies
                          </span>
                        )}
                      </div>

                      {cloudPolicies.some((p) => {
                        const assignedIds = (user.status?.cloud_policies || []).map(
                          (cp: any) => cp.id
                        );
                        return !p.is_compulsory && !assignedIds.includes(p.id);
                      }) && (
                        <div className="flex items-center gap-2">
                          <select
                            className="text-[10px] bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all hover:border-gray-400"
                            onChange={async (e) => {
                              const policyId = e.target.value;
                              if (!policyId) return;
                              try {
                                const toastId = `policy-action-${user.id}`;
                                ToastUtils.info("Assigning policy...", { id: toastId });
                                const res = await assignPolicy({
                                  projectId: project?.identifier || project?.id,
                                  userId: user.id,
                                  policyId: Number(policyId),
                                });
                                ToastUtils.success(
                                  res?.data?.message || "Policy assigned successfully",
                                  { id: toastId }
                                );
                                refetchProjectDetails();
                                refetchProjectStatus();
                              } catch (err: any) {
                                const msg =
                                  err?.response?.data?.message ||
                                  err?.message ||
                                  "Failed to assign policy";
                                ToastUtils.error(msg, { id: `policy-action-${user.id}` });
                              }
                              e.target.value = ""; // reset
                            }}
                            value=""
                            disabled={isAssigningPolicy}
                          >
                            <option value="" disabled>
                              + Add cloud policy
                            </option>
                            {cloudPolicies
                              ?.filter((p) => {
                                const assignedIds = (user.status?.cloud_policies || []).map(
                                  (cp: any) => cp.id
                                );
                                return !p.is_compulsory && !assignedIds.includes(p.id);
                              })
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: "actions",
                  header: "ACTIONS",
                  render: (_, user: any) => {
                    const userActions = user.actions || {};
                    return (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(userActions).map(([key, action]: [string, any]) => {
                          if (!action.show) return null;
                          return (
                            <ModernButton
                              key={key}
                              size="xs"
                              variant="outline"
                              className="h-7 text-[10px] px-2"
                              onClick={() => handleUserAction(user, key)}
                            >
                              {action.label || key}
                            </ModernButton>
                          );
                        })}
                      </div>
                    );
                  },
                },
              ]}
              searchable={false}
              filterable={false}
              exportable={false}
              paginated={false}
              enableAnimations={false}
              emptyMessage="No team members found."
            />
          </div>
        </div>
      )}

      {activeTeamTab === "invite" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="flex justify-end">
              <ModernButton type="submit" variant="primary">
                Send Invite
              </ModernButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamTab;
