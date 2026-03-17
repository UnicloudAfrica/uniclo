import React, { useState } from "react";
import {
  FlaskConical,
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  Inbox,
  Check,
  X,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ModernStatsCard from "@/shared/components/ui/ModernStatsCard";
import ModernTable, { type Column } from "@/shared/components/ui/ModernTable";
import { StatusPill, ModernSelect } from "@/shared/components/ui";
import {
  useFetchPocTrials,
  useFetchPocStatistics,
  useFetchPocTrialRequests,
  useApprovePocTrialRequest,
  useRejectPocTrialRequest,
} from "@/hooks/adminHooks/pocTrialHooks";
import type { PocTrial, PocTrialRequest, PocTrialFilters } from "@/types/pocTrial";
import { PRODUCT_TYPES, POC_STATUS_OPTIONS, POC_REQUEST_STATUS_OPTIONS } from "@/types/pocTrial";
import ExtendTrialModal from "../components/pocTrialComponents/ExtendTrialModal";
import CancelTrialModal from "../components/pocTrialComponents/CancelTrialModal";
import ApproveRequestModal from "../components/pocTrialComponents/ApproveRequestModal";
import RejectRequestModal from "../components/pocTrialComponents/RejectRequestModal";
import ToastUtils from "@/utils/toastUtil";

const AdminPocTrials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"trials" | "requests">("trials");
  const [filters, setFilters] = useState<PocTrialFilters>({ per_page: 15 });
  const [requestFilters, setRequestFilters] = useState<{
    status?: string;
    product_type?: string;
    per_page?: number;
  }>({ status: "pending", per_page: 15 });
  const [selectedTrial, setSelectedTrial] = useState<PocTrial | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PocTrialRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const { data: statsData, isLoading: statsLoading } = useFetchPocStatistics();
  const { data: trialsResponse, isLoading: trialsLoading } = useFetchPocTrials(filters);
  const { data: requestsResponse, isLoading: requestsLoading } =
    useFetchPocTrialRequests(requestFilters);
  const stats = statsData;
  const trials = trialsResponse?.data ?? [];
  const requests = requestsResponse?.data ?? [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success";
      case "converted":
        return "info";
      case "expired":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const trialColumns: Column<PocTrial>[] = [
    {
      key: "tenant_name",
      header: "Tenant",
      sortable: true,
      render: (_: unknown, trial: PocTrial) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {trial.tenant_name || "—"}
        </span>
      ),
    },
    {
      key: "resource_name",
      header: "Resource",
      render: (_: unknown, trial: PocTrial) => (
        <span className="text-gray-700 dark:text-gray-300">{trial.resource_name || "—"}</span>
      ),
    },
    { key: "product_type_label", header: "Product Type", sortable: true },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (_: unknown, trial: PocTrial) => (
        <StatusPill status={trial.status} color={getStatusColor(trial.status)} />
      ),
    },
    { key: "trial_days", header: "Trial Days", sortable: true },
    {
      key: "trial_ends_at",
      header: "Expires",
      sortable: true,
      render: (_: unknown, trial: PocTrial) =>
        trial.trial_ends_at ? new Date(trial.trial_ends_at).toLocaleDateString() : "—",
    },
    {
      key: "days_remaining",
      header: "Days Left",
      sortable: true,
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
    {
      key: "actions",
      header: "Actions",
      render: (_: unknown, trial: PocTrial) => (
        <div className="flex items-center gap-2">
          {trial.status === "active" && (
            <>
              <button
                onClick={() => {
                  setSelectedTrial(trial);
                  setShowExtendModal(true);
                }}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Extend
              </button>
              <button
                onClick={() => {
                  setSelectedTrial(trial);
                  setShowCancelModal(true);
                }}
                className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const requestColumns: Column<PocTrialRequest>[] = [
    {
      key: "tenant_name",
      header: "Tenant",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {req.tenant_name || "—"}
        </span>
      ),
    },
    { key: "product_type_label", header: "Product Type" },
    { key: "trial_days", header: "Days Requested" },
    {
      key: "status",
      header: "Status",
      render: (_: unknown, req: PocTrialRequest) => (
        <StatusPill status={req.status} color={getRequestStatusColor(req.status)} />
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
      key: "requested_by_name",
      header: "Requested By",
      render: (_: unknown, req: PocTrialRequest) => (
        <span className="text-gray-700 dark:text-gray-300">
          {req.requested_by_name || "—"}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (_: unknown, req: PocTrialRequest) => (
        <span
          className="block max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-400"
          title={req.reason}
        >
          {req.reason || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Submitted",
      render: (_: unknown, req: PocTrialRequest) =>
        req.created_at ? new Date(req.created_at).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (_: unknown, req: PocTrialRequest) =>
        req.status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedRequest(req);
                setShowApproveModal(true);
              }}
              className="text-xs font-medium text-green-600 hover:text-green-800 dark:text-green-400"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedRequest(req);
                setShowRejectModal(true);
              }}
              className="text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400"
            >
              Reject
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <AdminPageShell
      title="POC Trial Management"
      description="Manage proof-of-concept trial periods across all tenants and services"
      contentClassName="space-y-6"
    >
      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <ModernStatsCard
          title="Active Trials"
          value={stats?.total_active ?? 0}
          icon={<FlaskConical size={20} />}
          color="success"
          loading={statsLoading}
        />
        <ModernStatsCard
          title="Expiring This Week"
          value={stats?.expiring_this_week ?? 0}
          icon={<AlertTriangle size={20} />}
          color="warning"
          loading={statsLoading}
        />
        <ModernStatsCard
          title="Tenants with POC"
          value={stats?.tenants_with_poc ?? 0}
          icon={<Building2 size={20} />}
          color="info"
          loading={statsLoading}
        />
        <ModernStatsCard
          title="Converted"
          value={stats?.total_converted ?? 0}
          icon={<ArrowRightLeft size={20} />}
          color="primary"
          loading={statsLoading}
        />
        <ModernStatsCard
          title="Pending Requests"
          value={stats?.pending_requests ?? 0}
          icon={<Inbox size={20} />}
          color="warning"
          loading={statsLoading}
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("trials")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "trials"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            All Trials
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "border-b-2 border-primary-600 text-primary-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Trial Requests
            {(stats?.pending_requests ?? 0) > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {stats?.pending_requests}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Trials Tab */}
      {activeTab === "trials" && (
        <>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="w-48">
              <ModernSelect
                label="Product Type"
                value={filters.product_type || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, product_type: e.target.value || undefined }))
                }
                options={[{ value: "", label: "All Types" }, ...PRODUCT_TYPES]}
              />
            </div>
            <div className="w-40">
              <ModernSelect
                label="Status"
                value={filters.status || ""}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value || undefined }))
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
            <div className="w-48">
              <ModernSelect
                label="Product Type"
                value={requestFilters.product_type || ""}
                onChange={(e) =>
                  setRequestFilters((prev) => ({
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
            emptyMessage="No POC trial requests found"
          />
        </>
      )}

      {/* Trial Modals */}
      {selectedTrial && (
        <>
          <ExtendTrialModal
            isOpen={showExtendModal}
            onClose={() => {
              setShowExtendModal(false);
              setSelectedTrial(null);
            }}
            trial={selectedTrial}
          />
          <CancelTrialModal
            isOpen={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setSelectedTrial(null);
            }}
            trial={selectedTrial}
          />
        </>
      )}

      {/* Request Modals */}
      {selectedRequest && (
        <>
          <ApproveRequestModal
            isOpen={showApproveModal}
            onClose={() => {
              setShowApproveModal(false);
              setSelectedRequest(null);
            }}
            request={selectedRequest}
          />
          <RejectRequestModal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setSelectedRequest(null);
            }}
            request={selectedRequest}
          />
        </>
      )}
    </AdminPageShell>
  );
};

export default AdminPocTrials;
