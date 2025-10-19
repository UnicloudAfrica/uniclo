import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Cloud,
  Cpu,
  Gauge,
  Globe,
  HardDrive,
  Loader2,
  Server,
} from "lucide-react";

import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { useFetchInstanceRequestById } from "../../hooks/instancesHook";
import { useFetchProfile } from "../../hooks/resource";
import PaymentModal from "../components/instancesubcomps/paymentModalcomponent";
import SuccessModal from "../components/successModalV2";
import ToastUtils from "../../utils/toastUtil";

const StatusBadge = ({ status }) => {
  if (!status) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        Unknown
      </span>
    );
  }

  const tone =
    {
      active: "bg-green-100 text-green-700",
      running: "bg-green-100 text-green-700",
      provisioning: "bg-blue-100 text-blue-700",
      spawning: "bg-blue-100 text-blue-700",
      pending: "bg-yellow-100 text-yellow-700",
      past_due: "bg-orange-100 text-orange-700",
      suspended: "bg-orange-100 text-orange-700",
      cancelled: "bg-gray-200 text-gray-600",
      terminated: "bg-gray-200 text-gray-600",
      failed: "bg-red-100 text-red-700",
    }[status.toLowerCase()] || "bg-gray-100 text-gray-600";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${tone}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
    <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  </div>
);

const DetailRow = ({ label, value, emphasize = false }) => (
  <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-b-0">
    <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </span>
    <span
      className={`text-sm ${
        emphasize ? "font-semibold text-gray-900" : "text-gray-700"
      }`}
    >
      {value ?? "—"}
    </span>
  </div>
);

const SectionCard = ({ title, actions, children, className = "" }) => (
  <div
    className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${className}`}
  >
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {actions}
    </div>
    {children}
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatCurrency = (amount, currency = "NGN") => {
  if (amount === undefined || amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};

const formatGiB = (value) => {
  if (!value) return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return `${num} GiB`;
};

const ResponsiveTransactions = ({
  transactions,
  onPay,
  renderStatusBadge,
  currencyFallback = "NGN",
}) => {
  if (!transactions?.length) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500">
        No billing activity recorded for this instance yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
          <table className="min-w-full divide-y divide-gray-100 bg-white text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Gateway
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Created
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/60">
                  <td className="px-4 py-4 font-mono text-[11px] text-gray-600">
                    {tx.identifier || "—"}
                  </td>
                  <td className="px-4 py-4 capitalize text-gray-700">
                    {tx.type?.replace(/_/g, " ") || "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-900">
                    {formatCurrency(tx.amount, tx.currency || currencyFallback)}
                  </td>
                  <td className="px-4 py-4">{renderStatusBadge(tx)}</td>
                  <td className="px-4 py-4 text-gray-700">
                    {tx.payment_gateway || "—"}
                  </td>
                  <td className="px-4 py-4 text-gray-700">
                    {formatDateTime(tx.created_at)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {tx.status === "pending" && tx.action === "initiate" ? (
                      <button
                        onClick={() => onPay(tx)}
                        className="rounded-full border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        Complete payment
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-gray-500">
                {tx.identifier || "—"}
              </span>
              {renderStatusBadge(tx)}
            </div>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="capitalize">
                  {tx.type?.replace(/_/g, " ") || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(tx.amount, tx.currency || currencyFallback)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gateway</span>
                <span>{tx.payment_gateway || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span>{formatDateTime(tx.created_at)}</span>
              </div>
            </div>
            {tx.status === "pending" && tx.action === "initiate" && (
              <button
                onClick={() => onPay(tx)}
                className="mt-4 w-full rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
              >
                Complete payment
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
};

const InstancesDetails = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceId, setInstanceId] = useState(null);
  const [instanceNameFromUrl, setInstanceNameFromUrl] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [
    transactionReferenceForSuccess,
    setTransactionReferenceForSuccess,
  ] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedTransactionForPayment, setSelectedTransactionForPayment] =
    useState(null);

  const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedId = params.get("id");
    const nameFromUrl = params.get("name");

    if (encodedId) {
      try {
        const decodedId = atob(decodeURIComponent(encodedId));
        setInstanceId(decodedId);
      } catch (error) {
        ToastUtils.error("We could not load that instance. Please try again.");
        setInstanceId(null);
      }
    }

    if (nameFromUrl) {
      setInstanceNameFromUrl(nameFromUrl);
    }
  }, []);

  const {
    data: instanceDetails,
    isFetching,
    isError,
  } = useFetchInstanceRequestById(instanceId);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleGoBack = useCallback(() => {
    window.location.href = "/dashboard/instances";
  }, []);

  const handleOpenPaymentModal = useCallback((transaction) => {
    setSelectedTransactionForPayment(transaction);
    setIsPaymentModalOpen(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setIsPaymentModalOpen(false);
    setSelectedTransactionForPayment(null);
  }, []);

  const handlePaymentInitiated = useCallback((reference) => {
    setTransactionReferenceForSuccess(reference);
    setIsSuccessModalOpen(true);
  }, []);

  const handleSuccessModalClose = useCallback(() => {
    setIsSuccessModalOpen(false);
  }, []);

  const isLoading = isFetching || instanceId === null || isProfileFetching;
  const priceSummary = instanceDetails?.metadata?.pricing_breakdown;
  const transactions = instanceDetails?.transactions || [];

  const metricCards = useMemo(() => {
    if (!instanceDetails) return [];
    const computeMemoryGb = instanceDetails.compute?.memory_mb
      ? Math.round(Number(instanceDetails.compute.memory_mb) / 1024)
      : instanceDetails.compute?.memory_gib;

    return [
      {
        label: "Compute class",
        value:
          instanceDetails.compute?.productable_name ||
          instanceDetails.compute?.name ||
          "—",
        icon: Server,
      },
      {
        label: "vCPUs",
        value: instanceDetails.compute?.vcpus ?? "—",
        icon: Cpu,
      },
      {
        label: "Memory",
        value: computeMemoryGb ? `${computeMemoryGb} GiB` : "—",
        icon: Gauge,
      },
      {
        label: "Primary storage",
        value: formatGiB(instanceDetails.storage_size_gb),
        icon: HardDrive,
      },
      {
        label: "Operating system",
        value: instanceDetails.os_image?.name || "—",
        icon: Cloud,
      },
      {
        label: "Region",
        value: instanceDetails.region
          ? `${instanceDetails.region}${
              instanceDetails.provider ? ` • ${instanceDetails.provider}` : ""
            }`
          : "—",
        icon: Globe,
      },
    ];
  }, [instanceDetails]);

  const securityGroups =
    instanceDetails?.metadata?.security_groups ||
    instanceDetails?.security_group_ids ||
    [];

  const additionalVolumes = useMemo(() => {
    const metadata = instanceDetails?.metadata?.data_volumes || [];
    const created = instanceDetails?.metadata?.created_volume_ids || [];
    return metadata.length ? metadata : created;
  }, [instanceDetails]);

  const renderTransactionStatus = useCallback((tx) => {
    const status = tx.status?.toLowerCase();
    const classes =
      status === "success"
        ? "bg-green-100 text-green-700"
        : status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-600";

    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium capitalize ${classes}`}
      >
        {status?.replace(/_/g, " ") || "unknown"}
      </span>
    );
  }, []);

  if (isLoading) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] flex min-h-full w-full items-center justify-center bg-[#FAFAFA] p-6 md:w-[calc(100%-5rem)] lg:w-[80%] md:p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#288DD1]" />
            <p className="mt-3 text-sm text-gray-600">
              Loading instance details…
            </p>
          </div>
        </main>
      </>
    );
  }

  if (isError || !instanceDetails) {
    return (
      <>
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] flex min-h-full w-full flex-col items-center justify-center bg-[#FAFAFA] p-6 md:w-[calc(100%-5rem)] lg:w-[80%] md:p-8">
          <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-lg font-semibold text-gray-900">
              We couldn’t find that instance.
            </p>
            <p className="mt-2 text-sm text-gray-600">
              It may have been removed or you may not have permission to view
              it.
            </p>
            <button
              onClick={handleGoBack}
              className="mt-6 inline-flex items-center rounded-full bg-[#288DD1] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#1f7ab5]"
            >
              Go back to instances
            </button>
          </div>
        </main>
      </>
    );
  }

  const instanceName = instanceDetails.name || instanceNameFromUrl || "Instance";
  const projectName =
    instanceDetails.project?.name ||
    instanceDetails.project?.identifier ||
    "—";

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] min-h-full w-full bg-[#FAFAFA] p-6 md:w-[calc(100%-5rem)] lg:w-[80%] md:p-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 transition hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to instances
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {instanceName}
                </h1>
                <StatusBadge status={instanceDetails.status} />
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Hosted in <span className="font-medium">{projectName}</span>{" "}
                project • Created {formatDateTime(instanceDetails.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:w-80">
            <DetailRow
              label="Instance identifier"
              value={instanceDetails.identifier || "—"}
              emphasize
            />
            <DetailRow
              label="Next billing"
              value={
                instanceDetails.next_billing_date
                  ? formatDateTime(instanceDetails.next_billing_date)
                  : "Not scheduled"
              }
            />
            <DetailRow
              label="Provisioning driver"
              value={instanceDetails.provisioning_driver || "Manual"}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metricCards.map((metric) => (
            <InfoTile
              key={metric.label}
              icon={metric.icon || Activity}
              label={metric.label}
              value={metric.value}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <SectionCard title="Compute & storage" className="lg:col-span-2">
            <div className="grid gap-4 md:grid-cols-2">
              <DetailRow
                label="Compute flavour"
                value={
                  instanceDetails.compute?.productable_name ||
                  instanceDetails.compute?.name ||
                  "—"
                }
              />
              <DetailRow
                label="Provider flavour ID"
                value={
                  instanceDetails.compute?.provider_identifier ||
                  instanceDetails.compute?.identifier ||
                  "—"
                }
              />
              <DetailRow
                label="Primary volume type"
                value={
                  instanceDetails.volume_type?.name ||
                  instanceDetails.ebs_volume?.name ||
                  "—"
                }
              />
              <DetailRow
                label="Storage throughput"
                value={
                  instanceDetails.ebs_volume
                    ? `${instanceDetails.ebs_volume.iops_read ?? "—"} read / ${
                        instanceDetails.ebs_volume.iops_write ?? "—"
                      } write IOPS`
                    : "—"
                }
              />
            </div>

            {additionalVolumes?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Attached data volumes
                </h3>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {additionalVolumes.map((vol, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700"
                    >
                      <p className="font-medium text-gray-900">
                        {vol.name || `Volume ${index + 1}`}
                      </p>
                      <p className="mt-1">
                        Size:{" "}
                        {vol.size_gb
                          ? `${vol.size_gb} GiB`
                          : vol.storage_size_gb
                          ? `${vol.storage_size_gb} GiB`
                          : "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Type: {vol.volume_type_id || vol.type || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Networking & security">
            <div className="space-y-3">
              <DetailRow label="Project" value={projectName} />
              <DetailRow
                label="Network"
                value={instanceDetails.network_id || "—"}
              />
              <DetailRow
                label="Subnet"
                value={instanceDetails.subnet_id || "—"}
              />
              <DetailRow
                label="Floating IPs"
                value={
                  instanceDetails.floating_ip_count
                    ? `${instanceDetails.floating_ip_count}`
                    : "None assigned"
                }
              />
              <DetailRow
                label="Key pair"
                value={instanceDetails.keypair_name || "—"}
              />
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Security groups
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {securityGroups.length ? (
                  securityGroups.map((sg) => (
                    <span
                      key={sg}
                      className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600"
                    >
                      {sg}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">None specified</span>
                )}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Tags
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {instanceDetails.tags?.length ? (
                  instanceDetails.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tags applied</span>
                )}
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <SectionCard title="Billing summary" className="lg:col-span-2">
            {priceSummary ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Order total
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(priceSummary.total, priceSummary.currency)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Subtotal{" "}
                    {formatCurrency(
                      priceSummary.subtotal,
                      priceSummary.currency
                    )}
                    , VAT{" "}
                    {formatCurrency(priceSummary.tax, priceSummary.currency)}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Pricing breakdown
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    {(priceSummary.lines || []).map((line) => (
                      <div
                        key={line.slug || line.name}
                        className="flex items-center justify-between"
                      >
                        <span>{line.name}</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(
                            line.total_local ?? line.total,
                            priceSummary.currency
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-6 text-center text-sm text-gray-500">
                Pricing metadata has not been attached to this instance yet.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Lifecycle & monitoring">
            <div className="space-y-3 text-sm text-gray-700">
              <DetailRow
                label="Created"
                value={formatDateTime(instanceDetails.created_at)}
              />
              <DetailRow
                label="Provisioned"
                value={
                  instanceDetails.provisioned_at
                    ? formatDateTime(instanceDetails.provisioned_at)
                    : "Not yet provisioned"
                }
              />
              <DetailRow
                label="Last power event"
                value={
                  instanceDetails.last_power_event_at
                    ? formatDateTime(instanceDetails.last_power_event_at)
                    : "No activity recorded"
                }
              />
              <DetailRow
                label="Expires"
                value={
                  instanceDetails.expires_at
                    ? formatDateTime(instanceDetails.expires_at)
                    : "Not scheduled"
                }
              />
              <DetailRow
                label="Offer ends"
                value={
                  instanceDetails.offer_ends_at
                    ? formatDateTime(instanceDetails.offer_ends_at)
                    : "No promotional offer"
                }
              />
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Billing history" className="mt-6">
          <ResponsiveTransactions
            transactions={transactions}
            onPay={handleOpenPaymentModal}
            renderStatusBadge={renderTransactionStatus}
            currencyFallback={priceSummary?.currency || "NGN"}
          />
        </SectionCard>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            onClick={handleGoBack}
            className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Back to instances
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full border border-blue-200 bg-blue-50 px-5 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
          >
            Refresh details
          </button>
        </div>
      </main>

      {selectedTransactionForPayment && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          transaction={selectedTransactionForPayment}
          paystackKey={paystackKey}
          userEmail={profile?.email}
          onPaymentInitiated={handlePaymentInitiated}
        />
      )}

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        paymentReference={transactionReferenceForSuccess}
      />
    </>
  );
};

export default InstancesDetails;
