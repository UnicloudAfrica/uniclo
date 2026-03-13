import React, { useState, useCallback } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle,
  Clock,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import { PermissionChecklist } from "@/shared/components/PermissionChecklist";
import { useFetchPermissionRegistry } from "@/hooks/adminHooks/permissionHooks";
import {
  useFetchClientTeam,
  useDeleteClientTeamMember,
  useSetClientTeamPermissions,
} from "@/hooks/clientHooks/clientTeamHooks";
import ClientTeamInvite from "./ClientTeamInvite";
import type { ClientTeamMember, PermissionRegistry, UserPermissionOverride } from "@/types/rbac";

// ── Status helpers ─────────────────────────────────────────────────

type MemberStatus = "accepted" | "pending" | "expired";

function getMemberStatus(member: ClientTeamMember): MemberStatus {
  if (member.is_accepted) return "accepted";
  if (member.is_expired) return "expired";
  return "pending";
}

const statusConfig: Record<
  MemberStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  accepted: {
    label: "Active",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  expired: {
    label: "Expired",
    className: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
};

// ── StatusBadge ────────────────────────────────────────────────────

const StatusBadge: React.FC<{ status: MemberStatus }> = ({ status }) => {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ── MemberRow ──────────────────────────────────────────────────────

interface MemberRowProps {
  member: ClientTeamMember;
  onPermissions: (member: ClientTeamMember) => void;
  onRemove: (member: ClientTeamMember) => void;
  isRemoving: boolean;
}

const MemberRow: React.FC<MemberRowProps> = ({
  member,
  onPermissions,
  onRemove,
  isRemoving,
}) => {
  const status = getMemberStatus(member);
  const name = member.member?.name || "Invited User";
  const email = member.member?.email || "—";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        {/* Left: avatar + info */}
        <div className="flex items-center gap-4">
          {member.member?.avatar ? (
            <img
              src={member.member.avatar}
              alt={name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
              {initials}
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white">
                {name}
              </p>
              <StatusBadge status={status} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              {email}
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPermissions(member)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
            title="Manage permissions"
          >
            <Shield className="w-4 h-4" />
            Permissions
          </button>

          <button
            type="button"
            onClick={() => onRemove(member)}
            disabled={isRemoving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="Remove member"
          >
            <Trash2 className="w-4 h-4" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Permissions Panel (slide-over) ─────────────────────────────────

interface PermissionsPanelProps {
  member: ClientTeamMember;
  onClose: () => void;
}

const PermissionsPanel: React.FC<PermissionsPanelProps> = ({
  member,
  onClose,
}) => {
  const {
    data: registryData,
    isLoading: registryLoading,
  } = useFetchPermissionRegistry("client");

  const registry = registryData as PermissionRegistry | undefined;

  const setPermissions = useSetClientTeamPermissions();

  const handleSave = useCallback(
    (overrides: UserPermissionOverride[]) => {
      const payload = { id: member.id, overrides };
      setPermissions.mutate(
        payload as Parameters<typeof setPermissions.mutate>[0],
        { onSuccess: () => onClose() },
      );
    },
    [member.id, setPermissions, onClose],
  );

  const name = member.member?.name || "Invited User";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        role="presentation"
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Permissions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {name}
            </p>
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
        <div className="p-6">
          {registryLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-sm text-gray-500">
                Loading permissions...
              </span>
            </div>
          ) : registry ? (
            <PermissionChecklist
              registry={registry}
              currentPermissions={[]}
              onSave={handleSave}
              isSaving={setPermissions.isPending}
            />
          ) : (
            <p className="text-center text-sm text-gray-500 py-8">
              Unable to load permission registry.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────

const ClientTeam: React.FC = () => {
  const { data, isLoading, refetch } = useFetchClientTeam();
  const deleteMember = useDeleteClientTeamMember();

  const [showInvite, setShowInvite] = useState(false);
  const [permissionsMember, setPermissionsMember] =
    useState<ClientTeamMember | null>(null);

  const members: ClientTeamMember[] = data?.data ?? [];

  const handleRemove = useCallback(
    (member: ClientTeamMember) => {
      const name = member.member?.name || "this member";
      if (!window.confirm(`Remove ${name} from the team?`)) return;
      deleteMember.mutate({ id: member.id });
    },
    [deleteMember],
  );

  const handleInviteSuccess = useCallback(() => {
    setShowInvite(false);
    refetch();
  }, [refetch]);

  // Header action button
  const headerActions = (
    <button
      type="button"
      onClick={() => setShowInvite(true)}
      className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
    >
      <UserPlus className="h-4 w-4" />
      Invite Member
    </button>
  );

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell
        title={
          <span className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Team Management
          </span>
        }
        description="Manage your team members, invite new users, and configure permissions."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Team" },
        ]}
        actions={headerActions}
      >
        {/* Member List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-500 mt-3">Loading team members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-gray-500 dark:text-gray-400 mt-3">
                No team members yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Invite someone to get started.
              </p>
              <button
                type="button"
                onClick={() => setShowInvite(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>
          ) : (
            members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onPermissions={setPermissionsMember}
                onRemove={handleRemove}
                isRemoving={deleteMember.isPending}
              />
            ))
          )}
        </div>
      </ClientPageShell>

      {/* Invite Modal */}
      {showInvite && (
        <ClientTeamInvite
          onClose={() => setShowInvite(false)}
          onSuccess={handleInviteSuccess}
        />
      )}

      {/* Permissions Slide-over */}
      {permissionsMember && (
        <PermissionsPanel
          member={permissionsMember}
          onClose={() => setPermissionsMember(null)}
        />
      )}
    </>
  );
};

export default ClientTeam;
