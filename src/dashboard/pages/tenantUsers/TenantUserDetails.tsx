import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Shield, User as UserIcon } from "lucide-react";
import TenantPageShell from "../../components/TenantPageShell";
import { ModernCard, ModernButton } from "@/shared/components/ui";
import { PermissionChecklist } from "@/shared/components/PermissionChecklist";
import ToastUtils from "@/utils/toastUtil";
import { useFetchTenantAdminById, useDeleteTenantAdmin } from "@/hooks/adminUserHooks";
import {
  useFetchTenantPermissionRegistry,
  useFetchTenantMemberPermissions,
  useUpdateTenantMemberPermissions,
} from "@/hooks/tenantHooks/tenantPermissionHooks";
import type { UserPermissionOverride } from "@/types/rbac";

interface TenantUserRecord {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  pivot?: { role?: string; accepted_at?: string; [key: string]: unknown };
  [key: string]: unknown;
}

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="space-y-1">
    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm font-semibold text-slate-900">{value ?? "—"}</p>
  </div>
);

type TabKey = "profile" | "permissions";

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "permissions", label: "Permissions", icon: Shield },
];

function TenantPermissionsTab({ userId }: { userId: string }) {
  const { data: registry, isLoading: isRegistryLoading } = useFetchTenantPermissionRegistry();
  const { data: permissionsData, isLoading: isPermsLoading } =
    useFetchTenantMemberPermissions(userId);
  const { mutateAsync: updatePermissions, isPending: isSaving } =
    useUpdateTenantMemberPermissions();

  const isLoading = isRegistryLoading || isPermsLoading;

  const handleSave = async (overrides: UserPermissionOverride[]) => {
    try {
      await updatePermissions({ memberId: userId, permissions: overrides });
      ToastUtils.success("Permissions updated successfully.");
    } catch (error) {
      ToastUtils.error((error as Error)?.message || "Failed to update permissions.");
    }
  };

  if (isLoading) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">Loading permissions…</div>
    );
  }

  if (!registry || !permissionsData) {
    return (
      <div className="py-10 text-center text-sm text-slate-500">
        Unable to load permissions data.
      </div>
    );
  }

  return (
    <PermissionChecklist
      registry={permissionsData.registry ?? registry}
      currentPermissions={permissionsData.permissions ?? []}
      onSave={handleSave}
      isSaving={isSaving}
    />
  );
}

export default function TenantUserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");

  const { data: user, isFetching: isLoading } = useFetchTenantAdminById(userId ?? "");
  const { mutateAsync: removeUser, isPending: isDeleting } = useDeleteTenantAdmin();

  const handleDelete = async () => {
    if (!userId) return;
    const confirm = globalThis.window.confirm("Remove this user from your tenant workspace?");
    if (!confirm) return;

    try {
      await removeUser(userId);
      ToastUtils.success("Tenant user removed.");
      navigate("/dashboard/clients");
    } catch (error) {
      ToastUtils.error((error as Error)?.message || "Failed to remove tenant user.");
    }
  };

  return (
    <TenantPageShell
      title="Tenant user"
      description="Manage access and invitations for your tenant administrators."
      homeHref="/dashboard/clients"
      actions={
        <ModernButton variant="outline" onClick={() => navigate(-1)}>
          Back
        </ModernButton>
      }
      contentClassName="space-y-6"
    >
      {/* ── Tab bar ── */}
      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile tab ── */}
      {activeTab === "profile" && (
        <ModernCard padding="lg" className="space-y-6">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading tenant user…</div>
          ) : user ? (
            <>
              {(() => {
                const u = user as TenantUserRecord;
                return (
                  <>
                    <div className="flex flex-col gap-2">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                          u.email ||
                          "Tenant user"}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Role: {u.pivot?.role ?? u.role ?? "member"}
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <InfoRow label="Email" value={u.email} />
                      <InfoRow label="Phone" value={u.phone} />
                      <InfoRow
                        label="Invitation status"
                        value={u.pivot?.accepted_at ? "Accepted" : "Pending acceptance"}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ModernButton
                        variant="primary"
                        onClick={() => navigate(`/dashboard/tenant-users/${userId}/edit`)}
                      >
                        Edit user
                      </ModernButton>
                      <ModernButton
                        variant="outline"
                        tone="destructive"
                        onClick={handleDelete}
                        isDisabled={isDeleting}
                        isLoading={isDeleting}
                      >
                        Remove access
                      </ModernButton>
                    </div>
                  </>
                );
              })()}
            </>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">Tenant user not found.</div>
          )}
        </ModernCard>
      )}

      {/* ── Permissions tab ── */}
      {activeTab === "permissions" && (
        <ModernCard padding="lg">
          {userId ? (
            <TenantPermissionsTab userId={userId} />
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              No user ID available.
            </div>
          )}
        </ModernCard>
      )}
    </TenantPageShell>
  );
}
