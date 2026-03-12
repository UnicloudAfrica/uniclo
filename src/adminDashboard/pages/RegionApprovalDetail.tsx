import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  MapPin,
  Globe,
  Building2,
  Shield,
  KeyRound,
  DollarSign,
} from "lucide-react";
import adminRegionApi from "@/services/adminRegionApi";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";
import ToastUtils from "@/utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard, ModernButton, StatusPill } from "@/shared/components/ui";
import logger from "@/utils/logger";

import type {
  RegionApproval,
  ApprovalStatus,
  CredentialForm,
  TenantOption,
  FastTrackGrant,
  FastTrackMode,
  RevenueShare,
} from "./regionApprovalDetail/types";

import {
  getErrorMessage,
  statusToneMap,
  statusLabelMap,
  formatSegment,
} from "./regionApprovalDetail/utils";

import CredentialModal from "./regionApprovalDetail/CredentialModal";
import FastTrackSection from "./regionApprovalDetail/FastTrackSection";
import RevenueSection from "./regionApprovalDetail/RevenueSection";
import CredentialSummaryCard from "./regionApprovalDetail/CredentialSummaryCard";
import HeaderActions from "./regionApprovalDetail/HeaderActions";

const RegionApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [region, setRegion] = useState<RegionApproval | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [fastTrackMode, setFastTrackMode] = useState<FastTrackMode>("owner_only");
  const [fastTrackNotes, setFastTrackNotes] = useState("");
  const [updatingFastTrack, setUpdatingFastTrack] = useState(false);
  const [grantTenantId, setGrantTenantId] = useState("");
  const [grantingFastTrack, setGrantingFastTrack] = useState(false);
  const [credentials, setCredentials] = useState<CredentialForm>({
    username: "",
    password: "",
    domain: "",
    domain_id: "",
  });
  const { data: allTenantsData } = useFetchTenants();
  const allTenants = useMemo<TenantOption[]>(() => {
    return Array.isArray(allTenantsData) ? (allTenantsData as TenantOption[]) : [];
  }, [allTenantsData]);

  const fetchRegionDetail = React.useCallback(async () => {
    if (!id) {
      setRegion(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = (await adminRegionApi.fetchRegionApprovalById(id)) as {
        data?: RegionApproval;
      };
      const regionData = response.data ?? null;
      setRegion(regionData);
      setFastTrackMode(regionData?.fast_track_mode || "owner_only");
      setFastTrackNotes(regionData?.fast_track_notes || "");
    } catch (error: unknown) {
      logger.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegionDetail();
  }, [fetchRegionDetail]);

  const handleVerifyCredentials = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password || !credentials.domain) {
      ToastUtils.error("Please fill in all required fields");
      return;
    }
    if (!id) {
      ToastUtils.error("Missing region identifier");
      return;
    }

    try {
      setVerifying(true);
      await adminRegionApi.verifyCredentials(id, credentials, { scope: "approval" });
      setShowCredentialModal(false);
      setCredentials({ username: "", password: "", domain: "", domain_id: "" });
      fetchRegionDetail();
      ToastUtils.success("Credentials verified successfully");
    } catch (error: unknown) {
      logger.error("Error verifying credentials:", error);
      ToastUtils.error(getErrorMessage(error, "Verification failed"));
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
    if (!globalThis.window.confirm("Are you sure you want to reactivate this region?")) {
      return;
    }
    if (!id) {
      ToastUtils.error("Missing region identifier");
      return;
    }
    try {
      await adminRegionApi.reactivateRegion(id);
      fetchRegionDetail();
      ToastUtils.success("Region reactivated");
    } catch (error: unknown) {
      logger.error("Error reactivating region:", error);
      ToastUtils.error(getErrorMessage(error, "Unable to reactivate region"));
    }
  };
  const handleUpdateFee = () => {
    navigate(`/admin-dashboard/region-approvals/${id}/edit?action=update_fee`);
  };
  const handleFastTrackSave = async () => {
    if (!id) {
      ToastUtils.error("Missing region identifier");
      return;
    }
    try {
      setUpdatingFastTrack(true);
      await adminRegionApi.updateFastTrackSettings(id, {
        fast_track_mode: fastTrackMode,
        fast_track_notes: fastTrackNotes,
      });
      await fetchRegionDetail();
      ToastUtils.success("Fast-track settings updated");
    } catch (error: unknown) {
      logger.error("Error updating fast track:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to update fast-track settings"));
    } finally {
      setUpdatingFastTrack(false);
    }
  };
  const handleGrantFastTrack = async () => {
    if (!grantTenantId) {
      ToastUtils.error("Select a tenant to grant access.");
      return;
    }
    if (!id) {
      ToastUtils.error("Missing region identifier");
      return;
    }
    try {
      setGrantingFastTrack(true);
      await adminRegionApi.grantFastTrack(id, grantTenantId);
      setGrantTenantId("");
      await fetchRegionDetail();
      ToastUtils.success("Fast-track access granted");
    } catch (error: unknown) {
      logger.error("Error granting fast track:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to grant fast-track access"));
    } finally {
      setGrantingFastTrack(false);
    }
  };
  const handleRevokeFastTrack = async (tenantId: string | number | null | undefined) => {
    if (!tenantId) {
      return;
    }
    if (!globalThis.window.confirm("Revoke fast-track access for this tenant?")) return;
    if (!id) {
      ToastUtils.error("Missing region identifier");
      return;
    }
    try {
      await adminRegionApi.revokeFastTrack(id, tenantId);
      await fetchRegionDetail();
    } catch (error: unknown) {
      logger.error("Error revoking fast track:", error);
    }
  };

  const credentialSummary = region?.msp_credential_summary || {};
  const hasMspCredentials = Boolean(region?.has_msp_credentials);
  const recentRevenue: RevenueShare[] = Array.isArray(region?.recent_revenue_shares)
    ? region.recent_revenue_shares
    : [];

  const overviewItems = useMemo(
    () => [
      { label: "Region Code", value: region?.code || "\u2014", icon: KeyRound },
      { label: "Country", value: region?.country_code || "\u2014", icon: Globe },
      { label: "City", value: region?.city || "\u2014", icon: MapPin },
      {
        label: "Platform Fee",
        value:
          region?.platform_fee_percentage != null ? `${region.platform_fee_percentage}%` : "\u2014",
        icon: DollarSign,
      },
      { label: "Base URL", value: region?.base_url || "\u2014", icon: Building2 },
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
        value: region.owner_tenant.name || "\u2014",
      },
      {
        label: "Tenant ID",
        value: region.owner_tenant.id || "\u2014",
      },
      {
        label: "Tenant Email",
        value: region.owner_tenant.email || "\u2014",
      },
    ];
  }, [region]);

  const approvalStatus = (region?.approval_status ?? "pending") as ApprovalStatus;
  const statusTone = statusToneMap[approvalStatus] || "warning";
  const statusLabel = statusLabelMap[approvalStatus] || "Pending Approval";
  const fastTrackGrants = useMemo<FastTrackGrant[]>(() => {
    return Array.isArray(region?.fast_track_grants) ? region.fast_track_grants : [];
  }, [region?.fast_track_grants]);
  const grantOptions = useMemo(() => {
    const grantedIds = new Set(fastTrackGrants.map((grant: FastTrackGrant) => grant.tenant_id));
    return allTenants.filter((tenant: TenantOption) => !grantedIds.has(tenant.id));
  }, [fastTrackGrants, allTenants]);

  const navigateBack = () => navigate("/admin-dashboard/region-approvals");

  const headerMeta = region ? (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <StatusPill label={statusLabel} tone={statusTone} />
      {region.fulfillment_mode && (
        <span className="capitalize">{formatSegment(region.fulfillment_mode)} fulfillment</span>
      )}
      {region.ownership_type && (
        <>
          <span className="hidden sm:inline text-gray-300">&bull;</span>
          <span className="capitalize">{formatSegment(region.ownership_type)} ownership</span>
        </>
      )}
      {region.platform_fee_percentage != null && (
        <>
          <span className="hidden sm:inline text-gray-300">&bull;</span>
          <span>{region.platform_fee_percentage}% platform fee</span>
        </>
      )}
    </div>
  ) : null;

  const headerActions = (
    <HeaderActions
      region={region}
      onBack={navigateBack}
      onApprove={handleApprove}
      onReject={handleReject}
      onSuspend={handleSuspend}
      onReactivate={handleReactivate}
      onUpdateFee={handleUpdateFee}
      onVerifyCredentials={() => setShowCredentialModal(true)}
      onRefresh={fetchRegionDetail}
    />
  );

  if (loading) {
    return (
      <AdminPageShell
        title="Region Approval"
        description="Review platform region request details."
        actions={headerActions}
        contentClassName="flex min-h-[60vh] items-center justify-center"
      >
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </AdminPageShell>
    );
  }

  if (!region) {
    return (
      <AdminPageShell
        title="Region Approval"
        description="Review platform region request details."
        actions={headerActions}
        contentClassName="flex min-h-[60vh] items-center justify-center"
      >
        <ModernCard className="max-w-md text-center space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto text-red-500" />
          <p className="text-sm text-gray-600">Region approval could not be found.</p>
          <ModernButton variant="primary" onClick={navigateBack}>
            Back to approvals
          </ModernButton>
        </ModernCard>
      </AdminPageShell>
    );
  }

  return (
    <>
      <AdminPageShell
        title={region.name || "Region Approval"}
        description={`${region.code} \u2022 ${region.country_code}`}
        subHeaderContent={headerMeta}
        actions={headerActions}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Region Approvals", href: "/admin-dashboard/region-approvals" },
          { label: region.name || "Approval Detail" },
        ]}
        contentClassName="space-y-6"
      >
        {/* Overview grid */}
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
                  {value || "\u2014"}
                </p>
              </div>
            ))}
          </div>
        </ModernCard>

        {/* Owner tenant */}
        {ownerItems.length > 0 && (
          <ModernCard padding="lg" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Owner Tenant</h2>
              <p className="text-sm text-gray-500">Tenant responsible for operating this region.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {ownerItems.map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    {label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 break-all">{value}</p>
                </div>
              ))}
            </div>
          </ModernCard>
        )}

        {/* Credential summary */}
        <CredentialSummaryCard
          region={region}
          credentialSummary={credentialSummary}
          hasMspCredentials={hasMspCredentials}
          onManageCredentials={() => setShowCredentialModal(true)}
        />

        {/* Fast-track controls */}
        <FastTrackSection
          fastTrackMode={fastTrackMode}
          fastTrackNotes={fastTrackNotes}
          updatingFastTrack={updatingFastTrack}
          grantTenantId={grantTenantId}
          grantingFastTrack={grantingFastTrack}
          fastTrackGrants={fastTrackGrants}
          grantOptions={grantOptions}
          onModeChange={setFastTrackMode}
          onNotesChange={setFastTrackNotes}
          onSave={handleFastTrackSave}
          onGrantTenantChange={setGrantTenantId}
          onGrantAccess={handleGrantFastTrack}
          onRevoke={handleRevokeFastTrack}
        />

        {/* Revenue shares */}
        <RevenueSection recentRevenue={recentRevenue} />

        {/* Admin notes */}
        {region.admin_notes && (
          <ModernCard padding="lg" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Admin Notes</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{region.admin_notes}</p>
          </ModernCard>
        )}

        {/* Rejection / Suspension reason */}
        {(region.approval_status === "rejected" || region.approval_status === "suspended") &&
          region.rejection_reason && (
            <ModernCard padding="lg" className="space-y-3 border border-red-100 bg-red-50">
              <h2 className="text-lg font-semibold text-red-700">
                {region.approval_status === "rejected" ? "Rejection Reason" : "Suspension Reason"}
              </h2>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{region.rejection_reason}</p>
            </ModernCard>
          )}
      </AdminPageShell>

      {/* Credential verification modal */}
      {showCredentialModal && (
        <CredentialModal
          credentials={credentials}
          verifying={verifying}
          onCredentialsChange={setCredentials}
          onSubmit={handleVerifyCredentials}
          onClose={() => setShowCredentialModal(false)}
        />
      )}
    </>
  );
};

export default RegionApprovalDetail;
