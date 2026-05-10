import { useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert, Users, AlertTriangle } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  useFetchAdminTwoFactorPolicy,
  useUpdateAdminTwoFactorPolicy,
  useFetchAdminTwoFactorExemptions,
  useToggleAdminTwoFactorExemption,
  type ExemptUser,
} from "@/hooks/adminHooks/twoFactorPolicyHooks";

/**
 * AdminTwoFactorSettings — Super-admin UI for the platform-wide 2FA
 * policy. Wraps the `admin/v1/security/2fa/*` endpoints.
 *
 * Two panels:
 *   1. Force admin 2FA toggle + summary stats.
 *   2. Per-user exemption list with revoke action.
 *
 * Granting a NEW exemption is not done from here — admins go to the
 * specific user's profile and toggle the exemption there. This page
 * shows who's currently exempt + lets you revoke.
 */
const AdminTwoFactorSettings = () => {
  const policy = useFetchAdminTwoFactorPolicy();
  const exemptions = useFetchAdminTwoFactorExemptions();
  const updatePolicy = useUpdateAdminTwoFactorPolicy();
  const toggleExemption = useToggleAdminTwoFactorExemption();

  const [pendingRevokeId, setPendingRevokeId] = useState<number | null>(null);

  const handleToggleAdminPolicy = (next: boolean) => {
    if (
      next === false &&
      !globalThis.window.confirm(
        "Disabling force-2FA means new admin accounts can be created without 2FA. Continue?",
      )
    ) {
      return;
    }
    updatePolicy.mutate({ force_admin_2fa: next });
  };

  const handleToggleTenantlessClientPolicy = (next: boolean) => {
    if (
      next === true &&
      !globalThis.window.confirm(
        "Enabling this will require ALL platform-direct (tenantless) clients to enrol in 2FA on their next request. Continue?",
      )
    ) {
      return;
    }
    updatePolicy.mutate({ force_tenantless_client_2fa: next });
  };

  const handleRevoke = (user: ExemptUser) => {
    if (
      !globalThis.window.confirm(
        `Revoke 2FA exemption for ${user.email}? They will be required to enroll on their next request.`,
      )
    ) {
      return;
    }
    setPendingRevokeId(user.id);
    toggleExemption.mutate(
      { userId: user.id, exempt_from_2fa: false },
      {
        onSettled: () => setPendingRevokeId(null),
      },
    );
  };

  const data = policy.data;
  const exemptList = exemptions.data ?? [];

  return (
    <AdminPageShell
      title="Two-factor authentication policy"
      description="Control whether all platform admins must enrol in 2FA. Per-user exemptions are listed below."
      contentClassName="space-y-6"
    >
      {/* Policy toggle */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Force admin 2FA
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              When enabled, every admin must enrol in 2FA before they can access the dashboard.
              When disabled, 2FA is opt-in.
            </p>
          </div>
          {policy.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data?.force_admin_2fa)}
              onClick={() => handleToggleAdminPolicy(!data?.force_admin_2fa)}
              disabled={updatePolicy.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data?.force_admin_2fa ? "bg-blue-600" : "bg-slate-300"
              } ${updatePolicy.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data?.force_admin_2fa ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="Total admins" value={data.stats.total_admins} />
            <Stat label="Enrolled" value={data.stats.enrolled_admins} tone="success" />
            <Stat label="Exempt" value={data.stats.exempt_admins} tone="warning" />
            <Stat
              label="Unenrolled"
              value={data.stats.unenrolled_non_exempt_admins}
              tone={data.stats.unenrolled_non_exempt_admins > 0 ? "danger" : "neutral"}
            />
          </div>
        )}
      </section>

      {/* Tenantless clients toggle */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              Force tenantless client 2FA
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Applies to platform-direct clients (clients without a tenant). Tenant-scoped clients
              are governed by their tenant's own policy.
            </p>
          </div>
          {policy.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data?.force_tenantless_client_2fa)}
              onClick={() => handleToggleTenantlessClientPolicy(!data?.force_tenantless_client_2fa)}
              disabled={updatePolicy.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data?.force_tenantless_client_2fa ? "bg-purple-600" : "bg-slate-300"
              } ${updatePolicy.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data?.force_tenantless_client_2fa ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {data?.stats.tenantless_clients && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="Total clients" value={data.stats.tenantless_clients.total} />
            <Stat
              label="Enrolled"
              value={data.stats.tenantless_clients.enrolled}
              tone="success"
            />
            <Stat
              label="Exempt"
              value={data.stats.tenantless_clients.exempt}
              tone="warning"
            />
            <Stat
              label="Unenrolled"
              value={data.stats.tenantless_clients.unenrolled}
              tone={data.stats.tenantless_clients.unenrolled > 0 ? "danger" : "neutral"}
            />
          </div>
        )}
      </section>

      {/* Exemptions list */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Current 2FA exemptions
          </h2>
          <span className="text-xs text-slate-500">
            {exemptList.length} user{exemptList.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="rounded-lg border border-amber-100 bg-amber-50 p-3 mb-4 flex gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            Exempted accounts bypass the 2FA policy entirely. Use sparingly — break-glass accounts
            for incident response, or service-style admins where TOTP isn't workable.
          </p>
        </div>

        {exemptions.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : exemptList.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4 text-center">
            No exemptions granted. All admins must follow the policy.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {exemptList.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.name || user.email}
                    {user.is_super_admin && (
                      <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                        <ShieldAlert className="h-3 w-3" />
                        Super
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(user)}
                  disabled={pendingRevokeId === user.id}
                  className="ml-4 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  {pendingRevokeId === user.id ? "Revoking..." : "Revoke"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </AdminPageShell>
  );
};

const Stat = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "danger";
}) => {
  const tones: Record<typeof tone, string> = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    danger: "border-red-200 bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-xl border px-3 py-3 ${tones[tone]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[11px] uppercase tracking-wide font-medium">{label}</p>
    </div>
  );
};

export default AdminTwoFactorSettings;
