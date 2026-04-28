import React, { useState } from "react";
import { FlaskConical, Send, Clock, CheckCircle } from "lucide-react";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import ModernTable, { type Column } from "@/shared/components/ui/ModernTable";
import ModernStatsCard from "@/shared/components/ui/ModernStatsCard";
import { StatusPill, ModernSelect } from "@/shared/components/ui";
import { ModernButton } from "@/shared/components/ui";
import {
  useFetchTenantPocConfig,
  useFetchTenantPocTrials,
  useFetchTenantPocRequests,
} from "@/hooks/tenantHooks/pocTrialHooks";
import type { PocTrial, PocTrialRequest } from "@/types/pocTrial";
import { PRODUCT_TYPES, POC_STATUS_OPTIONS, POC_REQUEST_STATUS_OPTIONS } from "@/types/pocTrial";
import SubmitPocRequestModal from "../components/pocTrialComponents/SubmitPocRequestModal";

const TenantPocTrials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trials" | "requests">("trials");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [trialFilters, setTrialFilters] = useState<{ status?: string; product_type?: string }>({});
  const [requestFilters, setRequestFilters] = useState<{ status?: string }>({});

  const { data: config, isLoading: configLoading } = useFetchTenantPocConfig();
  const { data: trialsResponse, isLoading: trialsLoading } = useFetchTenantPocTrials(trialFilters);
  const { data: requestsResponse, isLoading: requestsLoading } =
    useFetchTenantPocRequests(requestFilters);

  const trials = trialsResponse?.data ?? [];
  const requests = requestsResponse?.data ?? [];

  const getStatusColor = (status: string): "success" | "info" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "active":
        return "success";
      case "converted":
        return "info";
      case "expired":
        return "warning";
      case "cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  const getRequestStatusColor = (status: string): "success" | "warning" | "danger" | "neutral" => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "neutral";
    }
  };

  const trialColumns: Column<PocTrial>[] = [
    {
      key: "resource_name",
      header: "Resource",
      render: (_: unknown, trial: PocTrial) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {trial.resource_name || "—"}
        </span>
      ),
    },
    { key: "product_type_label", header: "Product Type" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, trial: PocTrial) => (
        <StatusPill status={trial.status} tone={getStatusColor(trial.status)} />
      ),
    },
    { key: "trial_days", header: "Days" },
    {
      key: "trial_ends_at",
      header: "Expires",
      render: (_: unknown, trial: PocTrial) =>
        trial.trial_ends_at ? new Date(trial.trial_ends_at).toLocaleDateString() : "—",
    },
    {
      key: "days_remaining",
      header: "Remaining",
      render: (_: unknown, trial: PocTrial) => {
        if (trial.status !== "active") return "—";
        const days = trial.days_remaining;
        return (
          <span
            className={
              days <= 7
                ? "font-semibold text-amber-600"
                : "text-gray-700 dark:text-gray-300"
            }
          >
            {days}
          </span>
        );
      },
    },
  ];

  const requestColumns: Column<PocTrialRequest>[] = [
    {
      key: "product_type_label",
      header: "Product Type",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {req.product_type_label}
        </span>
      ),
    },
    { key: "trial_days", header: "Days Requested" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, req: PocTrialRequest) => (
        <StatusPill status={req.status} tone={getRequestStatusColor(req.status)} />
      ),
    },
    {
      key: "customer_tenant_name",
      header: "Customer",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="text-gray-700 dark:text-gray-300">
          {req.customer_tenant_name || "Self"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400">
          {req.reason || "—"}
        </span>
      ),
    },
    {
      key: "review_notes",
      header: "Admin Notes",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400">
          {req.review_notes || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (_: unknown, req: PocTrialRequest) =>
        req.created_at ? new Date(req.created_at).toLocaleDateString() : "—",
    },
  ];

  if (!config?.poc_trial_enabled && !configLoading) {
    return (
      <TenantPageShell title="POC Trials" description="Proof-of-concept trial management">
        <div className="flex flex-col items-center justify-center py-16">
          <FlaskConical size={48} className="mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            POC Trials Not Enabled
          </h3>
          <p className="mt-2 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
            POC trial capability has not been enabled for your organization. Contact your
            administrator to request access.
          </p>
        </div>
      </TenantPageShell>
    );
  }

  return (
    <TenantPageShell
      title="POC Trials"
      description="Manage proof-of-concept trials and submit new trial requests"
    >
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ModernStatsCard
            title="Active Trials"
            value={config?.active_trials_count ?? 0}
            icon={<FlaskConical size={20} />}
            color="success"
            loading={configLoading}
          />
          <ModernStatsCard
            title="Pending Requests"
            value={config?.pending_requests_count ?? 0}
            icon={<Clock size={20} />}
            color="warning"
            loading={configLoading}
          />
          <ModernStatsCard
            title="Default Trial Days"
            value={config?.poc_trial_days ?? "—"}
            icon={<CheckCircle size={20} />}
            color="info"
            loading={configLoading}
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("trials")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "trials"
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Active Trials
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "requests"
                  ? "border-b-2 border-primary-600 text-primary-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              My Requests
              {(config?.pending_requests_count ?? 0) > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {config?.pending_requests_count}
                </span>
              )}
            </button>
          </div>
          <ModernButton
            onClick={() => setShowRequestModal(true)}
            leftIcon={<Send size={16} />}
            size="sm"
          >
            Request POC Trial
          </ModernButton>
        </div>

        {/* Trials Tab */}
        {activeTab === "trials" && (
          <>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="w-48">
                <ModernSelect
                  label="Product Type"
                  value={trialFilters.product_type || ""}
                  onChange={(e) =>
                    setTrialFilters((prev) => ({
                      ...prev,
                      product_type: e.target.value || undefined,
                    }))
                  }
                  options={[{ value: "", label: "All Types" }, ...PRODUCT_TYPES]}
                />
              </div>
              <div className="w-40">
                <ModernSelect
                  label="Status"
                  value={trialFilters.status || ""}
                  onChange={(e) =>
                    setTrialFilters((prev) => ({
                      ...prev,
                      status: e.target.value || undefined,
                    }))
                  }
                  options={[{ value: "", label: "All Statuses" }, ...POC_STATUS_OPTIONS]}
                />
              </div>
            </div>

            <ModernTable<PocTrial>
              columns={trialColumns}
              data={trials}
              loading={trialsLoading}
              emptyMessage="No POC trials found"
            />
          </>
        )}

        {/* Requests Tab */}
        {activeTab === "requests" && (
          <>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="w-40">
                <ModernSelect
                  label="Status"
                  value={requestFilters.status || ""}
                  onChange={(e) =>
                    setRequestFilters((prev) => ({
                      ...prev,
                      status: e.target.value || undefined,
                    }))
                  }
                  options={[
                    { value: "", label: "All Statuses" },
                    ...POC_REQUEST_STATUS_OPTIONS,
                  ]}
                />
              </div>
            </div>

            <ModernTable<PocTrialRequest>
              columns={requestColumns}
              data={requests}
              loading={requestsLoading}
              emptyMessage="No POC trial requests submitted yet"
            />
          </>
        )}

        {/* Request Modal */}
        <SubmitPocRequestModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
        />
      </div>
    </TenantPageShell>
  );
};

export default TenantPocTrials;
