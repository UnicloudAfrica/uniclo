import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
  Globe,
  Building2,
  Shield,
  KeyRound,
  Lock,
  RefreshCw,
  DollarSign,
  PauseCircle,
  PlayCircle,
  Ban,
} from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import ToastUtils from "../../utils/toastUtil";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";

const statusToneMap = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  suspended: "neutral",
};

const statusLabelMap = {
  pending: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const formatSegment = (value) =>
  value ? value.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "—";

const RegionApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fastTrackMode, setFastTrackMode] = useState("owner_only");
  const [fastTrackNotes, setFastTrackNotes] = useState("");
  const [updatingFastTrack, setUpdatingFastTrack] = useState(false);
  const [grantTenantId, setGrantTenantId] = useState("");
  const [grantingFastTrack, setGrantingFastTrack] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    domain: "",
    domain_id: "",
  });
  const { data: allTenants = [] } = useFetchTenants();

  useEffect(() => {
    fetchRegionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovalById(id);
      setRegion(response.data);
      setFastTrackMode(response.data?.fast_track_mode || "owner_only");
      setFastTrackNotes(response.data?.fast_track_notes || "");
    } catch (error) {
      console.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password || !credentials.domain) {
      ToastUtils.error("Please fill in all required fields");
      return;
    }

    try {
      setVerifying(true);
      await adminRegionApi.verifyCredentials(id, credentials, { scope: "approval" });
      setShowCredentialModal(false);
      setCredentials({ username: "", password: "", domain: "", domain_id: "" });
      fetchRegionDetail();
      ToastUtils.success("Credentials verified successfully");
    } catch (error) {
      console.error("Error verifying credentials:", error);
      ToastUtils.error(error?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleApprove = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=approve`);
  };

  const handleReject = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=reject`);
  };

  const handleSuspend = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=suspend`);
  };

  const handleReactivate = async () => {
    if (!window.confirm("Are you sure you want to reactivate this region?")) {
      return;
    }
    try {
      await adminRegionApi.reactivateRegion(id);
      fetchRegionDetail();
      ToastUtils.success("Region reactivated");
    } catch (error) {
      console.error("Error reactivating region:", error);
      ToastUtils.error(error?.message || "Unable to reactivate region");
    }
  };

  const handleUpdateFee = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=update_fee`);
  };

  const handleFastTrackSave = async () => {
    try {
      setUpdatingFastTrack(true);
      await adminRegionApi.updateFastTrackSettings(id, {
        fast_track_mode: fastTrackMode,
        fast_track_notes: fastTrackNotes,
      });
      await fetchRegionDetail();
    } catch (error) {
      console.error("Error updating fast track:", error);
    } finally {
      setUpdatingFastTrack(false);
    }
  };

  const handleGrantFastTrack = async () => {
    if (!grantTenantId) {
      ToastUtils.error("Select a tenant to grant access.");
      return;
    }
    try {
      setGrantingFastTrack(true);
      await adminRegionApi.grantFastTrack(id, grantTenantId);
      setGrantTenantId("");
      await fetchRegionDetail();
    } catch (error) {
      console.error("Error granting fast track:", error);
    } finally {
      setGrantingFastTrack(false);
    }
  };

  const handleRevokeFastTrack = async (tenantId) => {
    if (!window.confirm("Revoke fast-track access for this tenant?")) return;
    try {
      await adminRegionApi.revokeFastTrack(id, tenantId);
      await fetchRegionDetail();
    } catch (error) {
      console.error("Error revoking fast track:", error);
    }
  };

  const credentialSummary = region?.msp_credential_summary || {};
  const hasMspCredentials = Boolean(region?.has_msp_credentials);
  const recentRevenue = region?.recent_revenue_shares || [];

  const formatCurrency = (value) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(Number(value ?? 0));

  const overviewItems = useMemo(
    () => [
      { label: "Region Code", value: region?.code || "—", icon: KeyRound },
      { label: "Country", value: region?.country_code || "—", icon: Globe },
      { label: "City", value: region?.city || "—", icon: MapPin },
      {
        label: "Platform Fee",
        value:
          region?.platform_fee_percentage != null
            ? `${region.platform_fee_percentage}%`
            : "—",
        icon: DollarSign,
      },
      { label: "Base URL", value: region?.base_url || "—", icon: Building2 },
      {
        label: "Ownership Type",
        value: formatSegment(region?.ownership_type),
        icon: Building2,
      },
      {
        label: "Fulfillment Mode",
        value: formatSegment(region?.fulfillment_mode),
        icon: Shield,
      },
    ],
    [region]
  );

  const ownerItems = useMemo(() => {
    if (!region?.owner_tenant) return [];
    return [
      {
        label: "Tenant Name",
        value: region.owner_tenant.name || "—",
      },
      {
        label: "Tenant ID",
        value: region.owner_tenant.id || "—",
      },
      {
        label: "Tenant Email",
        value: region.owner_tenant.email || "—",
      },
    ];
  }, [region]);

  const statusTone = statusToneMap[region?.approval_status] || "warning";
  const statusLabel = statusLabelMap[region?.approval_status] || "Pending Approval";
  const fastTrackGrants = region?.fast_track_grants || [];
  const grantOptions = useMemo(() => {
    const grantedIds = new Set(fastTrackGrants.map((grant) => grant.tenant_id));
    return (allTenants || []).filter((tenant) => !grantedIds.has(tenant.id));
  }, [fastTrackGrants, allTenants]);

  const renderFastTrackSection = () => (
    <ModernCard padding="lg" className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Fast-track Controls</h2>
          <p className="text-sm text-gray-500">
            Decide who can skip payments when provisioning through this region.
          </p>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Fast-track mode
          </label>
          <select
            value={fastTrackMode}
            onChange={(event) => setFastTrackMode(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200"
          >
            <option value="owner_only">Owner only</option>
            <option value="grant_only">Grants only</option>
            <option value="disabled">Disabled</option>
          </select>
          <textarea
            value={fastTrackNotes}
            onChange={(event) => setFastTrackNotes(event.target.value)}
            placeholder="Notes for ops teams (optional)"
            className="mt-2 h-20 w-full resize-none rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200"
          />
          <ModernButton
            variant="primary"
            size="sm"
            isLoading={updatingFastTrack}
            onClick={handleFastTrackSave}
            className="mt-2"
          >
            Save fast-track settings
          </ModernButton>
        </div>
        <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Add fast-track grant
          </label>
          <select
            value={grantTenantId}
            onChange={(event) => setGrantTenantId(event.target.value)}
            disabled={fastTrackMode === "disabled"}
            className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-sm focus:border-primary-300 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">Select tenant</option>
            {grantOptions.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name || tenant.slug || tenant.identifier || tenant.id}
              </option>
            ))}
          </select>
          <ModernButton
            variant="outline"
            size="sm"
            disabled={!grantTenantId || fastTrackMode === "disabled"}
            isLoading={grantingFastTrack}
            onClick={handleGrantFastTrack}
          >
            Grant access
          </ModernButton>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">Current grants</h3>
        {fastTrackGrants.length === 0 ? (
          <p className="text-sm text-gray-500">No tenants have explicit fast-track access.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left">Tenant</th>
                  <th className="px-4 py-2 text-left">Granted At</th>
                  <th className="px-4 py-2 text-left">Notes</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {fastTrackGrants.map((grant) => (
                  <tr key={grant.id}>
                    <td className="px-4 py-2 text-gray-800">
                      {grant.tenant_name || grant.tenant_id}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {grant.granted_at
                        ? new Date(grant.granted_at).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-gray-600">{grant.notes || "—"}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                        onClick={() => handleRevokeFastTrack(grant.tenant_id)}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModernCard>
  );

  const headerMeta = region ? (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <StatusPill label={statusLabel} tone={statusTone} />
      {region.fulfillment_mode && (
        <span className="capitalize">{formatSegment(region.fulfillment_mode)} fulfillment</span>
      )}
      {region.ownership_type && (
        <>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="capitalize">
            {formatSegment(region.ownership_type)} ownership
          </span>
        </>
      )}
      {region.platform_fee_percentage != null && (
        <>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span>{region.platform_fee_percentage}% platform fee</span>
        </>
      )}
    </div>
  ) : null;

  const buildHeaderActions = () => {
    const actions = [
      <ModernButton
        key="back"
        variant="outline"
        size="sm"
        onClick={() => navigate("/admin-dashboard/region-approvals")}
      >
        Back to approvals
      </ModernButton>,
    ];

    if (!region) {
      return <div className="flex flex-wrap gap-2">{actions}</div>;
    }

    if (region.approval_status === "pending") {
      actions.push(
        <ModernButton
          key="approve"
          variant="primary"
          size="sm"
          onClick={handleApprove}
          className="flex items-center gap-2"
        >
          <CheckCircle size={16} />
          Approve
        </ModernButton>,
        <ModernButton
          key="reject"
          variant="danger"
          size="sm"
          onClick={handleReject}
          className="flex items-center gap-2"
        >
          <Ban size={16} />
          Reject
        </ModernButton>
      );
    }

    if (region.approval_status === "approved") {
      actions.push(
        <ModernButton
          key="update-fee"
          variant="outline"
          size="sm"
          onClick={handleUpdateFee}
          className="flex items-center gap-2"
        >
          <DollarSign size={16} />
          Update Fee
        </ModernButton>,
        <ModernButton
          key="suspend"
          variant="danger"
          size="sm"
          onClick={handleSuspend}
          className="flex items-center gap-2"
        >
          <PauseCircle size={16} />
          Suspend
        </ModernButton>
      );
    }

    if (region.approval_status === "suspended") {
      actions.push(
        <ModernButton
          key="reactivate"
          variant="primary"
          size="sm"
          onClick={handleReactivate}
          className="flex items-center gap-2"
        >
          <PlayCircle size={16} />
          Reactivate
        </ModernButton>
      );
    }

    if (region.fulfillment_mode === "automated") {
      actions.push(
        <ModernButton
          key="verify"
          variant="ghost"
          size="sm"
          onClick={() => setShowCredentialModal(true)}
          className="flex items-center gap-2"
        >
          <KeyRound size={16} />
          Verify Credentials
        </ModernButton>
      );
    }

    actions.push(
      <ModernButton
        key="refresh"
        variant="ghost"
        size="sm"
        onClick={fetchRegionDetail}
        className="flex items-center gap-2"
      >
        <RefreshCw size={16} />
        Refresh
      </ModernButton>
    );

    return <div className="flex flex-wrap gap-2">{actions}</div>;
  };

  const renderLoadingShell = () => (
    <AdminPageShell
      title="Region Approval"
      description="Review platform region request details."
      actions={buildHeaderActions()}
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </AdminPageShell>
  );

  const renderNotFoundShell = () => (
    <AdminPageShell
      title="Region Approval"
      description="Review platform region request details."
      actions={buildHeaderActions()}
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <ModernCard className="max-w-md text-center space-y-3">
        <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
        <p className="text-sm text-gray-600">Region approval could not be found.</p>
        <ModernButton
          variant="primary"
          onClick={() => navigate("/admin-dashboard/region-approvals")}
        >
          Back to approvals
        </ModernButton>
      </ModernCard>
    </AdminPageShell>
  );

  const renderRevenueSection = () => {
    if (!recentRevenue.length) return null;
    return (
      <ModernCard padding="lg" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent Revenue Shares</h2>
          <p className="text-sm text-gray-500">
            Latest disbursements recorded for this region.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Gross</th>
                <th className="px-4 py-2 text-left">Platform Fee</th>
                <th className="px-4 py-2 text-left">Tenant Share</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentRevenue.map((share) => (
                <tr key={share.id}>
                  <td className="px-4 py-2 text-gray-700">
                    {share.created_at
                      ? new Date(share.created_at).toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatCurrency(share.gross_amount)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatCurrency(share.platform_fee_amount)}
                  </td>
                  <td className="px-4 py-2 text-gray-700">
                    {formatCurrency(share.tenant_share_amount)}
                  </td>
                  <td className="px-4 py-2 text-gray-700 capitalize">
                    {share.status || "pending"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ModernCard>
    );
  };

  if (loading) {
    return (
      <>
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        {renderLoadingShell()}
      </>
    );
  }

  if (!region) {
    return (
      <>
        <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          closeMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        {renderNotFoundShell()}
      </>
    );
  }

  return (
    <>
      <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminPageShell
        title={region.name || "Region Approval"}
        description={`${region.code} • ${region.country_code}`}
        subHeaderContent={headerMeta}
        actions={buildHeaderActions()}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Region Approvals", href: "/admin-dashboard/region-approvals" },
          { label: region.name || "Approval Detail" },
        ]}
        contentClassName="space-y-6"
      >
        <ModernCard padding="lg">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {overviewItems.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3"
              >
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                  {label}
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-900 break-words">
                  {value || "—"}
                </p>
              </div>
            ))}
          </div>
        </ModernCard>

        {ownerItems.length > 0 && (
          <ModernCard padding="lg" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Owner Tenant</h2>
              <p className="text-sm text-gray-500">
                Tenant responsible for operating this region.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {ownerItems.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </ModernCard>
        )}

        <ModernCard padding="lg" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Credential Summary</h2>
              <p className="text-sm text-gray-500">
                MSP administrative credentials used for automated provisioning.
              </p>
            </div>
            {region.fulfillment_mode === "automated" && (
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => setShowCredentialModal(true)}
                className="flex items-center gap-2"
              >
                <Lock size={16} />
                Manage Credentials
              </ModernButton>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Domain
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {credentialSummary.domain || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Default Project
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {credentialSummary.default_project || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Credentials Stored
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {hasMspCredentials ? "Yes" : "No"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Username Preview
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {credentialSummary.username_preview || "—"}
              </p>
            </div>
          </div>

          {region.fulfillment_mode === "automated" && (
            <div
              className={`rounded-xl border px-4 py-3 ${region.msp_credentials_verified_at
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-yellow-200 bg-yellow-50 text-yellow-700"
                }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {region.msp_credentials_verified_at ? (
                    <CheckCircle size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                  <div>
                    <p className="text-sm font-semibold">
                      {region.msp_credentials_verified_at
                        ? "Credentials Verified"
                        : "Credentials Not Verified"}
                    </p>
                    <p className="text-xs">
                      {region.msp_credentials_verified_at
                        ? `Last verified: ${new Date(
                          region.msp_credentials_verified_at
                        ).toLocaleString()}`
                        : "Automated provisioning requires verified MSP admin credentials."}
                    </p>
                  </div>
                </div>
                {!region.msp_credentials_verified_at && (
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={() => setShowCredentialModal(true)}
                    className="flex items-center gap-2"
                  >
                    <KeyRound size={16} />
                    Verify Credentials
                  </ModernButton>
                )}
              </div>
            </div>
          )}
        </ModernCard>

        {renderFastTrackSection()}

        {renderRevenueSection()}

        {region.admin_notes && (
          <ModernCard padding="lg" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {region.admin_notes}
            </p>
          </ModernCard>
        )}

        {(region.approval_status === "rejected" || region.approval_status === "suspended") &&
          region.rejection_reason && (
            <ModernCard padding="lg" className="space-y-3 border border-red-100 bg-red-50">
              <h2 className="text-lg font-semibold text-red-700">
                {region.approval_status === "rejected" ? "Rejection Reason" : "Suspension Reason"}
              </h2>
              <p className="text-sm text-red-800 whitespace-pre-wrap">
                {region.rejection_reason}
              </p>
            </ModernCard>
          )}
      </AdminPageShell>

      {showCredentialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <ModernCard padding="xl" className="w-full max-w-lg space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verify MSP Admin Credentials
              </h3>
              <p className="text-sm text-gray-500">
                Provide the MSP admin credentials to enable automated provisioning for this
                region.
              </p>
            </div>
            <form onSubmit={handleVerifyCredentials} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Username<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="MSP admin username"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Password<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="MSP admin password"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Domain<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.domain}
                    onChange={(e) => setCredentials({ ...credentials, domain: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="cloud_msp"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Domain ID <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={credentials.domain_id}
                    onChange={(e) => setCredentials({ ...credentials, domain_id: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    placeholder="dom-xxxxx"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
                <strong>Note:</strong> MSP admins authenticate using the default project token.
                Ensure the credentials include the <strong>msp_admin</strong> role.
              </div>

              <div className="flex items-center justify-end gap-3">
                <ModernButton
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCredentialModal(false)}
                  className="px-4"
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant="primary"
                  isLoading={verifying}
                  className="px-5"
                >
                  Verify Credentials
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        </div>
      )}
    </>
  );
};

export default RegionApprovalDetail;
