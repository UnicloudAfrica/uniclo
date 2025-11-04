import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Ban,
  PauseCircle,
  PlayCircle,
  DollarSign,
  Info,
} from "lucide-react";
import adminRegionApi from "../../services/adminRegionApi";
import ToastUtils from "../../utils/toastUtil";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";

const ACTION_COPY = {
  approve: {
    title: "Approve Region",
    description:
      "Review the request details and apply the platform fee before approving this region.",
    submitLabel: "Approve Region",
    tone: "success",
  },
  reject: {
    title: "Reject Region Request",
    description:
      "Provide a clear reason for rejection. The tenant will be notified with your remarks.",
    submitLabel: "Reject Region",
    tone: "danger",
  },
  suspend: {
    title: "Suspend Region",
    description:
      "Temporarily pause operations in this region. Existing workloads remain but new orders are blocked.",
    submitLabel: "Suspend Region",
    tone: "danger",
  },
  reactivate: {
    title: "Reactivate Region",
    description:
      "Restore an inactive region to active status. Automation and new orders will resume.",
    submitLabel: "Reactivate Region",
    tone: "primary",
  },
  update_fee: {
    title: "Update Platform Fee",
    description:
      "Adjust the revenue share collected on transactions in this region. Applies to future orders only.",
    submitLabel: "Update Fee",
    tone: "primary",
  },
};

const ReasonField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      {label} <span className="text-red-500">*</span>
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
      rows={4}
      placeholder={placeholder}
      required
    />
    <p className="text-xs text-gray-500">
      This message will be shared with the tenant that requested the region.
    </p>
  </div>
);

const FeeField = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Platform Fee Percentage <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        placeholder="20.00"
        required
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
        %
      </span>
    </div>
    <p className="text-xs text-gray-500">
      Represents the share retained by the platform on future transactions in this region.
    </p>
  </div>
);

const NotesField = ({ value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">
      Admin Notes <span className="text-xs text-gray-400">(optional)</span>
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
      rows={4}
      placeholder="Add any internal context for this approval (not shared with tenant)."
    />
  </div>
);

const RegionApprovalEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const action = searchParams.get("action") || "approve";

  const [region, setRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    platform_fee_percentage: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchRegionDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRegionDetail = async () => {
    try {
      setLoading(true);
      const response = await adminRegionApi.fetchRegionApprovalById(id);
      setRegion(response.data);
      setFormData({
        platform_fee_percentage: response.data.platform_fee_percentage ?? 20,
        reason: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error fetching region:", error);
      ToastUtils.error("Failed to load region details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      if (action === "approve") {
        await adminRegionApi.approveRegion(id, {
          platform_fee_percentage: parseFloat(formData.platform_fee_percentage),
          notes: formData.notes,
        });
        ToastUtils.success("Region approved successfully");
      } else if (action === "reject") {
        await adminRegionApi.rejectRegion(id, formData.reason);
        ToastUtils.success("Region rejected");
      } else if (action === "suspend") {
        await adminRegionApi.suspendRegion(id, formData.reason);
        ToastUtils.success("Region suspended");
      } else if (action === "reactivate") {
        await adminRegionApi.reactivateRegion(id);
        ToastUtils.success("Region reactivated successfully");
      } else if (action === "update_fee") {
        await adminRegionApi.updatePlatformFee(
          id,
          parseFloat(formData.platform_fee_percentage)
        );
        ToastUtils.success("Platform fee updated");
      }

      navigate(`/admin-dashboard/region-approvals/${id}`);
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      ToastUtils.error(error?.message || "Unable to complete the action");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = ACTION_COPY[action] || ACTION_COPY.approve;

  const headerMeta = region ? (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <span>{region.name}</span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>{region.code}</span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>{region.country_code}</span>
    </div>
  ) : null;

  const renderInfoBanner = () => {
    const baseClasses =
      "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm";
    switch (action) {
      case "reject":
      case "suspend":
        return (
          <div
            className={`${baseClasses} border-red-200 bg-red-50 text-red-700`}
          >
            <AlertCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">
                This action impacts tenant access to the region.
              </p>
              <p>
                Provide a detailed reason so the tenant understands the next
                steps. You can re-activate or resubmit later.
              </p>
            </div>
          </div>
        );
      case "reactivate":
        return (
          <div
            className={`${baseClasses} border-green-200 bg-green-50 text-green-700`}
          >
            <CheckCircle className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">Region will return to active state.</p>
              <p>
                Automated provisioning and marketplace visibility will resume
                immediately after reactivation.
              </p>
            </div>
          </div>
        );
      case "update_fee":
        return (
          <div
            className={`${baseClasses} border-blue-200 bg-blue-50 text-blue-700`}
          >
            <DollarSign className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">Platform fee change</p>
              <p>
                Adjusted fees apply to future transactions only. Completed
                orders keep their original share.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div
            className={`${baseClasses} border-blue-200 bg-blue-50 text-blue-700`}
          >
            <Info className="mt-0.5 h-5 w-5" />
            <div>
              <p className="font-medium">Review the details carefully.</p>
              <p>
                Approving will make this region fully available to tenants and
                customers.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderLoadingShell = () => (
    <AdminPageShell
      title={copy.title}
      description={copy.description}
      subHeaderContent={headerMeta}
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </AdminPageShell>
  );

  const renderNotFoundShell = () => (
    <AdminPageShell
      title={copy.title}
      description={copy.description}
      subHeaderContent={headerMeta}
      contentClassName="flex min-h-[60vh] items-center justify-center"
    >
      <ModernCard className="max-w-md text-center space-y-3">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500" />
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

  const actionTone = ACTION_COPY[action]?.tone || "primary";

  return (
    <>
      <AdminHeadbar toggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <AdminPageShell
        title={copy.title}
        description={copy.description}
        subHeaderContent={headerMeta}
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Region Approvals", href: "/admin-dashboard/region-approvals" },
          {
            label: region.name || "Region Detail",
            href: `/admin-dashboard/region-approvals/${id}`,
          },
          { label: copy.title },
        ]}
        actions={
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin-dashboard/region-approvals/${id}`)}
          >
            Back to region detail
          </ModernButton>
        }
        contentClassName="space-y-6 max-w-3xl"
      >
        {renderInfoBanner()}

        <ModernCard padding="lg">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {(action === "approve" || action === "update_fee") && (
                <FeeField
                  value={formData.platform_fee_percentage}
                  onChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      platform_fee_percentage: value,
                    }))
                  }
                />
              )}

              {(action === "reject" || action === "suspend") && (
                <ReasonField
                  label="Reason"
                  value={formData.reason}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, reason: value }))
                  }
                  placeholder={`Provide a reason for ${
                    action === "reject" ? "rejecting" : "suspending"
                  } this region...`}
                />
              )}

              {action === "approve" && (
                <NotesField
                  value={formData.notes}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, notes: value }))
                  }
                />
              )}

              {action === "reactivate" && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  Reactivating will immediately restore automation and customer ordering in this
                  region.
                </div>
              )}

              <div className="flex gap-3">
                <ModernButton
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(`/admin-dashboard/region-approvals/${id}`)}
                  isDisabled={submitting}
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  type="submit"
                  variant={actionTone === "danger" ? "danger" : "primary"}
                  isLoading={submitting}
                >
                  {copy.submitLabel}
                </ModernButton>
              </div>
            </form>
          </div>
        </ModernCard>
      </AdminPageShell>
    </>
  );
};

export default RegionApprovalEdit;
