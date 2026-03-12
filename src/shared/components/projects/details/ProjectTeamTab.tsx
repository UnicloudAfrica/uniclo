/**
 * ProjectTeamTab — Self-contained, role-aware team management tab.
 *
 * Works for Admin, Tenant, and Client:
 *   - Admin:  full management (assign/revoke policies, manage members, invite, user actions)
 *   - Tenant: manage members + invite + assign/revoke policies
 *   - Client: view members + invite (no policy management)
 *
 * Uses context-aware shared hooks so the same component routes to the correct API.
 */
import React, { useCallback, useMemo, useState } from "react";
import { Mail, RefreshCw, UserPlus, Users, XCircle } from "lucide-react";
import { ModernButton, ModernTable, ConfirmDialog } from "../../ui";
import ToastUtils from "@/utils/toastUtil";
import {
  useInviteProjectMember,
  useAssignProjectUserPolicy,
  useRevokeProjectUserPolicy,
} from "@/shared/hooks/resources/projectHooks";
import { useCloudPolicies } from "@/shared/hooks/resources/cloudPolicyHooks";
import type { ProjectUser, CloudPolicy } from "@/types/project";

// ─── Types ────────────────────────────────────────────────────────

type Hierarchy = "admin" | "tenant" | "client";

interface ProjectTeamTabProps {
  /** Project identifier used for API calls */
  projectId?: string;
  /** Region for cloud-policy filtering */
  region?: string;
  /** Provider for cloud-policy filtering (e.g. "zadara") */
  provider?: string;
  /** Role of the logged-in user */
  hierarchy: Hierarchy;
  /** Project users — typically comes from the project status response */
  projectUsers?: ProjectUser[];
  /** Callback after invite/member-change so the parent can refetch project data */
  onRefresh?: () => Promise<unknown> | void;
  /** Open the bulk member-manager modal (Admin only) */
  onManageMembers?: () => void;
  /** Callback for user action buttons (Admin only; e.g. sync, promote) */
  onUserAction?: (user: ProjectUser, actionKey: string) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────

const formatMemberName = (user: ProjectUser): string => {
  if (user.full_name) return user.full_name;
  if (user.name) return user.name;
  const first = user.first_name || user.firstName || "";
  const middle = user.middle_name || user.middleName || "";
  const last = user.last_name || user.lastName || "";
  return [first, middle, last].filter(Boolean).join(" ") || user.email || "Unknown";
};

// ─── Component ────────────────────────────────────────────────────

const ProjectTeamTab: React.FC<ProjectTeamTabProps> = ({
  projectId,
  region,
  provider,
  hierarchy,
  projectUsers = [],
  onRefresh,
  onManageMembers,
  onUserAction,
}) => {
  const [activeTab, setActiveTab] = useState<"members" | "invite">("members");

  // Invite form state
  const [inviteForm, setInviteForm] = useState({ name: "", email: "" });

  // Revoke policy confirmation dialog state
  const [revokeConfirm, setRevokeConfirm] = useState<{
    open: boolean;
    user?: ProjectUser;
    policy?: CloudPolicy;
  }>({ open: false });

  // Hooks (context-aware — route to correct API based on role)
  const { mutateAsync: inviteMember, isPending: isInviting } = useInviteProjectMember();

  // Cloud policies — visible to admin & tenant
  const canManagePolicies = hierarchy === "admin" || hierarchy === "tenant";
  const { data: cloudPoliciesRaw } = useCloudPolicies(
    { provider: provider || "zadara", region, active_only: "true" },
    { enabled: canManagePolicies && Boolean(region) }
  );
  const cloudPolicies: CloudPolicy[] = useMemo(
    () => (Array.isArray(cloudPoliciesRaw) ? (cloudPoliciesRaw as CloudPolicy[]) : []),
    [cloudPoliciesRaw]
  );

  const { mutateAsync: assignPolicy, isPending: isAssigningPolicy } = useAssignProjectUserPolicy();
  const { mutateAsync: revokePolicy, isPending: isRevokingPolicy } = useRevokeProjectUserPolicy();

  // ─── Handlers ─────────────────────────────────────────────────

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      ToastUtils.error("Please provide both name and email.");
      return;
    }
    if (!projectId) return;
    try {
      await inviteMember({
        identifier: projectId,
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
      });
      ToastUtils.success("Invitation sent successfully!");
      setInviteForm({ name: "", email: "" });
      await onRefresh?.();
    } catch {
      // Error handled by toastApi in the hook
    }
  };

  const handleAssignPolicy = useCallback(
    async (user: ProjectUser, policyId: number) => {
      if (!projectId) return;
      try {
        ToastUtils.info("Assigning policy...", { id: `policy-${user.id}` });
        await assignPolicy({
          projectId,
          userId: user.id,
          policyId,
        });
        ToastUtils.success("Policy assigned successfully", { id: `policy-${user.id}` });
        await onRefresh?.();
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (err instanceof Error ? err.message : "Failed to assign policy");
        ToastUtils.error(msg, { id: `policy-${user.id}` });
      }
    },
    [projectId, assignPolicy, onRefresh]
  );

  const handleRevokePolicy = useCallback(
    (user: ProjectUser, policy: CloudPolicy) => {
      if (!projectId) return;
      setRevokeConfirm({ open: true, user, policy });
    },
    [projectId]
  );

  const confirmRevokePolicy = async () => {
    const { user, policy } = revokeConfirm;
    if (!projectId || !user || !policy) return;
    try {
      ToastUtils.info(`Revoking ${policy.name}...`, { id: `policy-${user.id}` });
      await revokePolicy({
        projectId,
        userId: user.id,
        policyId: policy.id,
      });
      ToastUtils.success("Policy revoked successfully", { id: `policy-${user.id}` });
      await onRefresh?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to revoke policy");
      ToastUtils.error(msg, { id: `policy-${user.id}` });
    } finally {
      setRevokeConfirm({ open: false });
    }
  };

  // ─── Table columns ────────────────────────────────────────────

  const columns = useMemo(() => {
    const cols: {
      key: string;
      header: string;
      render: (_: unknown, user: ProjectUser) => React.ReactNode;
    }[] = [
      {
        key: "user_info",
        header: "MEMBER",
        render: (_, user) => (
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-tight">{formatMemberName(user)}</span>
            <span className="text-[10px] text-gray-400 break-all">{user.email}</span>
          </div>
        ),
      },
      {
        key: "role",
        header: "ROLE",
        render: (_, user) => (
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
    ];

    // Cloud policies column — admin & tenant only
    if (canManagePolicies) {
      cols.push({
        key: "policies",
        header: "CLOUD POLICIES",
        render: (_, user) => {
          const userPolicies = user.status?.cloud_policies ?? [];
          const assignedIds = userPolicies.map((cp) => cp.id);
          const unassigned = cloudPolicies.filter(
            (p) => !p.is_compulsory && !assignedIds.includes(p.id)
          );

          return (
            <div className="flex flex-col gap-2 min-w-[180px]">
              <div className="flex flex-wrap gap-1.5">
                {userPolicies.length > 0 ? (
                  userPolicies.map((policy) => (
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
                          onClick={() => handleRevokePolicy(user, policy)}
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
                  <span className="text-[10px] text-gray-400 italic">No cloud policies</span>
                )}
              </div>

              {unassigned.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    className="text-[10px] bg-white border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer transition-all hover:border-gray-400"
                    onChange={(e) => {
                      const policyId = e.target.value;
                      if (!policyId) return;
                      handleAssignPolicy(user, Number(policyId));
                      e.target.value = "";
                    }}
                    value=""
                    disabled={isAssigningPolicy}
                  >
                    <option value="" disabled>
                      + Add cloud policy
                    </option>
                    {unassigned.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          );
        },
      });
    }

    // Actions column — admin only (user-level actions like sync, promote, etc.)
    if (hierarchy === "admin" && onUserAction) {
      cols.push({
        key: "actions",
        header: "ACTIONS",
        render: (_, user) => {
          const userActions = user.actions || {};
          return (
            <div className="flex flex-wrap gap-2">
              {Object.entries(userActions).map(([key, action]) => {
                if (!action.show) return null;
                return (
                  <ModernButton
                    key={key}
                    size="xs"
                    variant="outline"
                    className="h-7 text-[10px] px-2"
                    onClick={() => onUserAction(user, key)}
                  >
                    {action.label || key}
                  </ModernButton>
                );
              })}
            </div>
          );
        },
      });
    }

    return cols;
  }, [
    canManagePolicies,
    cloudPolicies,
    hierarchy,
    isAssigningPolicy,
    isRevokingPolicy,
    onUserAction,
    handleAssignPolicy,
    handleRevokePolicy,
  ]);

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Access</h3>
          <p className="text-sm text-gray-500">
            {hierarchy === "client"
              ? "View project team members and invite collaborators."
              : "Keep collaborators aligned\u2014invite operators or tweak roles fast."}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("members")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                activeTab === "members"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Members
            </button>
            <button
              onClick={() => setActiveTab("invite")}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                activeTab === "invite"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Invite
            </button>
          </div>
        </div>
      </div>

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {/* Admin-only: Manage Team button */}
          {hierarchy === "admin" && onManageMembers && (
            <div className="flex justify-end">
              <ModernButton size="sm" variant="outline" onClick={onManageMembers}>
                Manage Team
              </ModernButton>
            </div>
          )}

          {projectUsers.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <ModernTable
                data={projectUsers.map((user) => ({ ...user, id: user.id }))}
                columns={columns}
                searchable={false}
                filterable={false}
                exportable={false}
                paginated={projectUsers.length > 10}
                enableAnimations={false}
                emptyMessage="No team members found."
              />
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h4 className="text-sm font-medium text-gray-900 mb-1">No team members yet</h4>
              <p className="text-sm text-gray-500 mb-4">
                Invite collaborators to start working on this project together.
              </p>
              <ModernButton size="sm" variant="primary" onClick={() => setActiveTab("invite")}>
                <UserPlus className="w-4 h-4" />
                Invite Member
              </ModernButton>
            </div>
          )}
        </div>
      )}

      {/* Invite Tab */}
      {activeTab === "invite" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900">Invite a Team Member</h4>
              <p className="text-sm text-gray-500">
                Send an email invite to add someone to this project.
              </p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <ModernButton
                type="button"
                variant="secondary"
                onClick={() => setInviteForm({ name: "", email: "" })}
              >
                Clear
              </ModernButton>
              <ModernButton
                type="submit"
                variant="primary"
                disabled={isInviting || !inviteForm.name.trim() || !inviteForm.email.trim()}
              >
                {isInviting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Send Invite
                  </>
                )}
              </ModernButton>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        isOpen={revokeConfirm.open}
        title="Revoke Policy"
        message={
          revokeConfirm.user && revokeConfirm.policy
            ? `Revoke "${revokeConfirm.policy.name}" for ${revokeConfirm.user.email}?`
            : "Are you sure you want to revoke this policy?"
        }
        confirmLabel="Revoke"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isRevokingPolicy}
        onCancel={() => setRevokeConfirm({ open: false })}
        onConfirm={confirmRevokePolicy}
      />
    </div>
  );
};

export default ProjectTeamTab;
