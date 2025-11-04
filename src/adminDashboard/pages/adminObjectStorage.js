import React, { useMemo, useState } from "react";
import { HardDrive, Plus, Rocket } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";

const statusToneMap = {
  pending_payment: "warning",
  payment_confirmed: "info",
  provisioning: "info",
  active: "success",
  suspended: "warning",
  cancelled: "critical",
};

const AdminObjectStorage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { orders } = useObjectStorage();

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [orders]
  );

  const requestCounts = useMemo(
    () => ({
      total: sortedOrders.length,
      pending: sortedOrders.filter((order) => order.status === "pending_payment").length,
      provisioning: sortedOrders.filter((order) => order.status === "provisioning").length,
      active: sortedOrders.filter((order) => order.status === "active").length,
    }),
    [sortedOrders]
  );

  const renderOrderCard = (order) => {
    const statusTone = statusToneMap[order.status] || "info";
    const paymentTone =
      order.paymentStatus === "paid" || order.paymentStatus === "admin_approved"
        ? "success"
        : order.paymentStatus === "pending"
        ? "warning"
        : "info";

    return (
      <ModernCard key={order.id} variant="outlined" padding="lg" className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">
              {order.tierName || "Object storage tier"}
            </h3>
            <p className="text-sm text-slate-500">
              Region {order.region?.toUpperCase() || "N/A"} • {order.quantity} unit
              {order.quantity === 1 ? "" : "s"} • {order.months} month
              {order.months === 1 ? "" : "s"}
            </p>
          </div>
          <StatusPill
            label={order.status.replace(/_/g, " ")}
            tone={statusTone}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModernCard variant="filled" padding="sm" className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </p>
            <p className="text-lg font-semibold text-slate-900">
              {order.currencyCode} {order.billing.total.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">Unit price × quantity × term</p>
          </ModernCard>

          <ModernCard variant="filled" padding="sm" className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment status
            </p>
            <StatusPill label={order.paymentStatus.replace(/_/g, " ")} tone={paymentTone} />
            <p className="text-xs text-slate-500">Managed by finance workflows</p>
          </ModernCard>

          <ModernCard variant="filled" padding="sm" className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Latest timeline update recorded below</p>
          </ModernCard>
        </div>

        {order.status === "active" && (
          <ModernCard
            variant="filled"
            padding="sm"
            className="border border-emerald-200 bg-emerald-50 text-sm text-emerald-700"
          >
            Buckets, credentials, and usage will appear as soon as the Zadara API sync completes for
            this tenant.
          </ModernCard>
        )}
      </ModernCard>
    );
  };

  return (
    <>
      <AdminHeadbar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <main className="admin-dashboard-content">
        <div className="py-6 px-4 md:px-8">
          <AdminPageShell
            title="Object storage"
            description="Track tenant storage plans, approve fast-track requests, and oversee payment status."
            actions={
              <div className="flex items-center gap-2">
                <ModernButton
                  variant="ghost"
                  onClick={() => navigate("/admin-dashboard/object-storage/create?mode=fast-track")}
                  leftIcon={<Rocket className="h-4 w-4" />}
                >
                  Fast-track tenant
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate("/admin-dashboard/object-storage/create")}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Create storage plan
                </ModernButton>
              </div>
            }
            contentClassName="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <ModernCard padding="md">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Total plans
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {requestCounts.total}
                </p>
              </ModernCard>
              <ModernCard padding="md">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Pending payment
                </p>
                <p className="mt-1 text-2xl font-semibold text-amber-600">
                  {requestCounts.pending}
                </p>
              </ModernCard>
              <ModernCard padding="md">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Provisioning
                </p>
                <p className="mt-1 text-2xl font-semibold text-sky-600">
                  {requestCounts.provisioning}
                </p>
              </ModernCard>
              <ModernCard padding="md">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Active plans
                </p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">
                  {requestCounts.active}
                </p>
              </ModernCard>
            </div>

            {sortedOrders.length === 0 ? (
              <ModernCard padding="xl" className="text-center space-y-3">
                <HardDrive className="h-10 w-10 mx-auto text-primary-500" />
                <h3 className="text-lg font-semibold text-slate-900">
                  No storage plans yet
                </h3>
                <p className="text-sm text-slate-500">
                  Start by creating a storage plan or fast-track a tenant who already has executive approval.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <ModernButton
                    variant="primary"
                    onClick={() => navigate("/admin-dashboard/object-storage/create")}
                  >
                    Create plan
                  </ModernButton>
                  <ModernButton
                    variant="ghost"
                    onClick={() => navigate("/admin-dashboard/object-storage/create?mode=fast-track")}
                  >
                    Fast-track tenant
                  </ModernButton>
                </div>
              </ModernCard>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sortedOrders.map(renderOrderCard)}
              </div>
            )}
          </AdminPageShell>
        </div>
      </main>
    </>
  );
};

export default AdminObjectStorage;
