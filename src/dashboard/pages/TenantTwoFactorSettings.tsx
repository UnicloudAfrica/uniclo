import { useState } from "react";
import { Loader2, ShieldCheck, Users, AlertTriangle } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import {
  useFetchTenantTwoFactorPolicy,
  useUpdateTenantTwoFactorPolicy,
  useFetchTenantTwoFactorExemptions,
  useToggleTenantTwoFactorExemption,
  type TenantExemptUser,
} from "@/hooks/tenantHooks/twoFactorPolicyHooks";

/**
 * TenantTwoFactorSettings — Tenant-admin UI for the per-tenant 2FA
 * policy. Wraps the `tenant/v1/security/2fa/*` endpoints.
 *
 * Only flips the per-tenant `force_2fa` flag — has no power over the
 * platform-wide `force_admin_2fa` setting (that's super-admin only).
 */
const TenantTwoFactorSettings = () => {
  const policy = useFetchTenantTwoFactorPolicy();
  const exemptions = useFetchTenantTwoFactorExemptions();
  const updatePolicy = useUpdateTenantTwoFactorPolicy();
  const toggleExemption = useToggleTenantTwoFactorExemption();

  const [pendingRevokeId, setPendingRevokeId] = useState<number | null>(null);

  const handleToggleStaffPolicy = (next: boolean) => {
    if (
      next === false &&
      !globalThis.window.confirm(
        "Disabling force-2FA means new staff users in your tenant won't be required to enrol. Continue?",
      )
    ) {
      return;
    }
    updatePolicy.mutate({ force_2fa: next });
  };

  const handleToggleClientPolicy = (next: boolean) => {
    if (
      next === true &&
      !globalThis.window.confirm(
        "Enabling this will require ALL clients in your tenant to enrol in 2FA on their next request. This adds friction at the customer-facing edge — confirm only if you've messaged them in advance.",
      )
    ) {
      return;
    }
    updatePolicy.mutate({ force_client_2fa: next });
  };

  const handleRevoke = (user: TenantExemptUser) => {
    if (
      !globalThis.window.confirm(
        `Revoke 2FA exemption for ${user.email}? They will be required to enrol on their next request.`,
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
    <TenantPageShell
      title="Two-factor authentication policy"
      description="Enforce 2FA enrolment for all users in your tenant. Per-user exemptions are listed below."
      contentClassName="space-y-6"
    >
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Force tenant 2FA
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              When enabled, every user in your tenant must enrol in 2FA before they can access the
              dashboard. When disabled, 2FA is opt-in.
            </p>
          </div>
          {policy.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data?.force_2fa)}
              onClick={() => handleToggleStaffPolicy(!data?.force_2fa)}
              disabled={updatePolicy.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data?.force_2fa ? "bg-blue-600" : "bg-slate-300"
              } ${updatePolicy.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data?.force_2fa ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {data?.stats.staff && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="Total staff" value={data.stats.staff.total} />
            <Stat label="Enrolled" value={data.stats.staff.enrolled} tone="success" />
            <Stat label="Exempt" value={data.stats.staff.exempt} tone="warning" />
            <Stat
              label="Unenrolled"
              value={data.stats.staff.unenrolled}
              tone={data.stats.staff.unenrolled > 0 ? "danger" : "neutral"}
            />
          </div>
        )}
      </section>

      {/* Tenant clients toggle */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              Force client 2FA
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Applies to your tenant's clients (end-users). This adds friction at sign-in — enable
              only if your customers expect it (e.g. B2B SaaS resellers handling sensitive data).
            </p>
          </div>
          {policy.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          ) : (
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(data?.force_client_2fa)}
              onClick={() => handleToggleClientPolicy(!data?.force_client_2fa)}
              disabled={updatePolicy.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                data?.force_client_2fa ? "bg-purple-600" : "bg-slate-300"
              } ${updatePolicy.isPending ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  data?.force_client_2fa ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          )}
        </div>

        {data?.stats.clients && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <Stat label="Total clients" value={data.stats.clients.total} />
            <Stat label="Enrolled" value={data.stats.clients.enrolled} tone="success" />
            <Stat label="Exempt" value={data.stats.clients.exempt} tone="warning" />
            <Stat
              label="Unenrolled"
              value={data.stats.clients.unenrolled}
              tone={data.stats.clients.unenrolled > 0 ? "danger" : "neutral"}
            />
          </div>
        )}
      </section>

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
            Exempted users bypass the tenant 2FA policy entirely. Use sparingly — typically only for
            shared service accounts or break-glass recovery.
          </p>
        </div>

        {exemptions.isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : exemptList.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4 text-center">
            No exemptions granted in your tenant.
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
    </TenantPageShell>
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

export default TenantTwoFactorSettings;
