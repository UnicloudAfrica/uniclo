import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CircleUserRound,
  Loader2,
  Mail,
  MapPin,
  Shield,
  ShieldCheck,
  SquarePen,
  User as UserIcon,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { ModernButton, ModernCard, SkeletonCard } from "@/shared/components/ui";
import { useFetchAdminById } from "@/hooks/adminHooks/adminHooks";
import { PermissionChecklist } from "@/shared/components/PermissionChecklist";
import { useFetchUserPermissions, useUpdateUserPermissions } from "@/hooks/adminHooks/permissionHooks";
import logger from "@/utils/logger";

interface AdminRecord {
  id?: string | number;
  identifier?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  updated_at?: string;
  email?: string;
  phone?: string;
  country?: string;
  country_id?: string | number;
  city?: string;
  address?: string;
  state?: string;
  zip?: string;
  domain?: string;
  created_at?: string;
  force_password_reset?: boolean;
  verified?: number;
  mfa_enabled?: boolean;
}

const decodeId = (encodedId?: string) => {
  if (!encodedId) return null;
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (error) {
    logger.error("Failed to decode admin id", error);
    return null;
  }
};
const formatDate = (value: unknown) => {
  if (!value) return "Not available";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    logger.error("Could not format date", error);
    return "Unknown";
  }
};
function PermissionsTab({ userId }: { userId: string | number }) {
  const { data: permData, isLoading } = useFetchUserPermissions(userId);
  const { mutateAsync: updatePermissions, isPending: isSaving } = useUpdateUserPermissions();

  if (isLoading) {
    return <SkeletonCard className="my-4" />;
  }

  if (!permData) {
    return <div className="text-sm text-gray-500 py-4">Unable to load permissions.</div>;
  }

  const typedPermData = permData as { registry?: unknown; permissions?: unknown };

  return (
    <PermissionChecklist
      registry={typedPermData.registry as never}
      currentPermissions={typedPermData.permissions as never}
      onSave={async (overrides) => {
        await updatePermissions({
          userId,
          permissions: overrides,
        });
      }}
      isSaving={isSaving}
    />
  );
}

const AdminUserDetails = () => {
  const { adminId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  const decodedAdminId = useMemo(() => decodeId(adminId), [adminId]);

  const {
    data: adminDetails,
    isFetching,
    isError,
    error,
  } = useFetchAdminById(decodedAdminId, {
    enabled: !!decodedAdminId,
  });

  const adminRecord = useMemo<AdminRecord | null>(() => {
    if (!adminDetails || typeof adminDetails !== "object") return null;
    const payload = adminDetails as { data?: AdminRecord } & AdminRecord;
    return payload.data ?? payload;
  }, [adminDetails]);

  const goBack = () => navigate("/admin-dashboard/admin-users");
  const goToEdit = () => navigate(`/admin-dashboard/admin-users/${adminId}/edit`);

  const fullName = useMemo(() => {
    if (!adminRecord) return "";
    return [adminRecord.first_name, adminRecord.middle_name, adminRecord.last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
  }, [adminRecord]);

  const summaryCards = [
    {
      label: "Administrator",
      value: fullName || "Unnamed admin",
      hint: adminRecord?.role ? `Role • ${adminRecord.role}` : "Role not assigned",
      icon: CircleUserRound,
      accentBg: "bg-primary/10",
      accentText: "text-[var(--theme-color)]",
    },
    {
      label: "Status",
      value: adminRecord?.status
        ? adminRecord.status.charAt(0).toUpperCase() + adminRecord.status.slice(1)
        : "Unknown",
      hint: adminRecord?.updated_at
        ? `Updated ${formatDate(adminRecord.updated_at)}`
        : "No recent updates",
      icon: ShieldCheck,
      accentBg: adminRecord?.status === "active" ? "bg-emerald-50" : "bg-amber-50",
      accentText: adminRecord?.status === "active" ? "text-emerald-600" : "text-amber-600",
    },
    {
      label: "Primary Email",
      value: adminRecord?.email || "Email unavailable",
      hint: adminRecord?.phone ? `Phone • ${adminRecord.phone}` : "Phone number not provided",
      icon: Mail,
      accentBg: "bg-slate-100",
      accentText: "text-slate-700",
    },
    {
      label: "Location",
      value: adminRecord?.country || adminRecord?.country_id || "Not specified",
      hint: adminRecord?.city ? `City • ${adminRecord.city}` : "City not provided",
      icon: MapPin,
      accentBg: "bg-indigo-50",
      accentText: "text-indigo-600",
    },
  ];

  const profileDetails = [
    { label: "Email", value: adminRecord?.email || "—" },
    { label: "Phone", value: adminRecord?.phone || "—" },
    { label: "Role", value: adminRecord?.role || "Admin" },
    { label: "Status", value: adminRecord?.status || "—" },
    { label: "Identifier", value: adminRecord?.identifier || "—" },
    { label: "Domain", value: adminRecord?.domain || "—" },
  ];

  const locationDetails = [
    { label: "Address", value: adminRecord?.address || "—" },
    { label: "City", value: adminRecord?.city || "—" },
    { label: "State", value: adminRecord?.state || "—" },
    { label: "Country", value: adminRecord?.country || adminRecord?.country_id || "—" },
    { label: "Postal Code", value: adminRecord?.zip || "—" },
    { label: "Created", value: formatDate(adminRecord?.created_at) },
  ];

  const devicesDetails = [
    {
      label: "Force Password Reset",
      value: adminRecord?.force_password_reset ? "Enabled" : "Disabled",
    },
    { label: "Verified", value: adminRecord?.verified === 1 ? "Verified" : "Not verified" },
    { label: "MFA Enabled", value: adminRecord?.mfa_enabled ? "Enabled" : "Not enabled" },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center gap-3">
      <ModernButton variant="outline" onClick={goBack} className="gap-2">
        <ArrowLeft size={18} />
        Back to Admin Users
      </ModernButton>
      <ModernButton onClick={goToEdit} className="gap-2">
        <SquarePen size={18} />
        Edit Admin
      </ModernButton>
    </div>
  );

  return (
    <>
      <AdminPageShell
        title={`Admin • ${fullName || "Profile"}`}
        description={adminRecord?.email || "Review administrator access, profile, and controls."}
        actions={headerActions}
        contentClassName="space-y-6"
      >
        <TenantClientsSideMenu />

        {isFetching && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--theme-surface-alt)] bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--theme-color)]" />
            <p className="text-sm font-medium text-slate-600">Loading administrator profile...</p>
          </div>
        )}

        {!isFetching && (isError || !adminRecord) && (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-red-100 bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <p className="text-sm font-semibold text-red-700">Unable to load this administrator.</p>
            {error?.message && <p className="text-xs text-red-600">{error.message}</p>}
            <ModernButton onClick={goBack} className="mt-2">
              Return to listing
            </ModernButton>
          </div>
        )}

        {!isFetching && adminRecord && (
          <>
            {/* Tab Navigation */}
            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "profile"
                    ? "bg-[var(--theme-color)] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <UserIcon className="h-4 w-4" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  activeTab === "permissions"
                    ? "bg-[var(--theme-color)] text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <Shield className="h-4 w-4" />
                Permissions
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "profile" ? (
              <>
                <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {summaryCards.map(({ label, value, hint, icon: Icon, accentBg, accentText }: { label: React.ReactNode; value: React.ReactNode; hint?: React.ReactNode; icon: React.ComponentType<{ size?: number }>; accentBg?: string; accentText?: string }) => (
                    <div
                      key={label}
                      className="rounded-3xl border border-[var(--theme-surface-alt)] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentBg} ${accentText}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {label}
                          </p>
                          <p className="mt-1 text-base font-semibold text-slate-900">{value}</p>
                          {hint && <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </section>

                <ModernCard title="Contact & Access">
                  <div className="grid gap-6 md:grid-cols-2">
                    <dl className="space-y-4">
                      {profileDetails.slice(0, 3).map(({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <dl className="space-y-4">
                      {profileDetails.slice(3).map(({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </ModernCard>

                <ModernCard title="Location & Activity">
                  <div className="grid gap-6 md:grid-cols-2">
                    <dl className="space-y-4">
                      {locationDetails.slice(0, 3).map(({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <dl className="space-y-4">
                      {locationDetails.slice(3).map(({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
                        <div key={label} className="flex items-center justify-between gap-4">
                          <dt className="text-sm font-medium text-slate-500">{label}</dt>
                          <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </ModernCard>

                <ModernCard title="Security Controls">
                  <dl className="grid gap-4 md:grid-cols-3">
                    {devicesDetails.map(({ label, value }: { label: React.ReactNode; value: React.ReactNode }) => (
                      <div
                        key={label}
                        className="rounded-2xl border border-[var(--theme-surface-alt)] bg-[var(--theme-surface-alt)] px-4 py-3"
                      >
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {label}
                        </dt>
                        <dd className="mt-2 text-sm font-semibold text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </ModernCard>
              </>
            ) : (
              adminRecord.id !== undefined ? (
                <PermissionsTab userId={adminRecord.id} />
              ) : (
                <div className="text-sm text-gray-500 py-4">No user ID available for permissions.</div>
              )
            )}
          </>
        )}
      </AdminPageShell>
    </>
  );
};
export default AdminUserDetails;
