// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  CircleUserRound,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  SquarePen,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell.tsx";
import TenantClientsSideMenu from "../components/tenantUsersActiveTab";
import { ModernButton } from "../../shared/components/ui";
import { ModernCard } from "../../shared/components/ui";
import { useFetchAdminById } from "../../hooks/adminHooks/adminHooks";

const decodeId = (encodedId: any) => {
  if (!encodedId) return null;
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (error) {
    console.error("Failed to decode admin id", error);
    return null;
  }
};
const formatDate = (value: any) => {
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
    console.error("Could not format date", error);
    return "Unknown";
  }
};
const AdminUserDetails = () => {
  const { adminId } = useParams();
  const navigate = useNavigate();

  const decodedAdminId = useMemo(() => decodeId(adminId), [adminId]);

  const {
    data: adminDetails,
    isFetching,
    isError,
    error,
  } = useFetchAdminById(decodedAdminId, {
    enabled: !!decodedAdminId,
  });

  const adminRecord = useMemo(() => adminDetails?.data ?? adminDetails, [adminDetails]);

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
      accentText: "text-[#288DD1]",
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
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-[#EAECF0] bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-[#288DD1]" />
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
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map(({ label, value, hint, icon: Icon, accentBg, accentText }) => (
                <div
                  key={label}
                  className="rounded-3xl border border-[#EAECF0] bg-white p-5 shadow-sm transition hover:border-primary/50 hover:shadow-md"
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
                  {profileDetails.slice(0, 3).map(({ label, value }: any) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <dt className="text-sm font-medium text-slate-500">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <dl className="space-y-4">
                  {profileDetails.slice(3).map(({ label, value }: any) => (
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
                  {locationDetails.slice(0, 3).map(({ label, value }: any) => (
                    <div key={label} className="flex items-center justify-between gap-4">
                      <dt className="text-sm font-medium text-slate-500">{label}</dt>
                      <dd className="text-sm font-semibold text-slate-900">{value}</dd>
                    </div>
                  ))}
                </dl>
                <dl className="space-y-4">
                  {locationDetails.slice(3).map(({ label, value }: any) => (
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
                {devicesDetails.map(({ label, value }: any) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-[#EAECF0] bg-[#F8FAFC] px-4 py-3"
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
        )}
      </AdminPageShell>
    </>
  );
};
export default AdminUserDetails;
