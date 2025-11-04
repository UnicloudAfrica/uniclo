import React, { useMemo, useState } from "react";
import Sidebar from "../components/clientSidebar";
import HeaderBar from "../components/clientHeadbar";
import BreadcrumbNav from "../components/clientAciveTab";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import useAuthStore from "../../stores/userAuthStore";
import {
  useFetchProductPricing,
  useFetchGeneralRegions,
  useFetchCountries,
} from "../../hooks/resource";
import ToastUtils from "../../utils/toastUtil";
import {
  HardDrive,
  Plus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Rocket,
} from "lucide-react";
import { getCurrencySymbol } from "../../utils/resource";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import IconBadge from "../../adminDashboard/components/IconBadge";

const statusStyles = {
  pending_payment: {
    pill: "bg-amber-100 text-amber-700",
    badgeTone: "warning",
  },
  payment_confirmed: {
    pill: "bg-sky-100 text-sky-700",
    badgeTone: "primary",
  },
  provisioning: {
    pill: "bg-sky-100 text-sky-700",
    badgeTone: "primary",
  },
  active: {
    pill: "bg-emerald-100 text-emerald-700",
    badgeTone: "emerald",
  },
  cancelled: {
    pill: "bg-slate-100 text-slate-600",
    badgeTone: "slate",
  },
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
};

const TenantObjectStorage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("object storage");
  const [isCreating, setIsCreating] = useState(false);

  const { orders, createOrder, updateOrder } = useObjectStorage();
  const userEmail = useAuthStore((state) => state.userEmail);

  const { data: regions = [], isFetching: isRegionsLoading } = useFetchGeneralRegions();
  const { data: countries = [], isFetching: isCountriesLoading } = useFetchCountries();

  const [formValues, setFormValues] = useState({
    country: "US",
    region: "",
    tier: "",
    quantity: 1,
    months: 12,
    paymentMethod: "card",
    notes: "",
  });

  const { data: tierPricing, isFetching: isTierLoading } =
    useFetchProductPricing(formValues.region, "object_storage_configuration", {
      enabled: !!formValues.region,
      countryCode: formValues.country,
    });

  const resolveTier = useMemo(() => {
    if (!formValues.tier || !tierPricing?.data) return null;
    return tierPricing.data.find(
      (tier) =>
        String(tier.product?.productable_id) === String(formValues.tier) ||
        String(tier.productable_id) === String(formValues.tier)
    );
  }, [formValues.tier, tierPricing]);

  const resolveTierUnitPrice = (tier) => {
    if (!tier) return 0;
    const effective = tier.pricing?.effective ?? {};
    const tenantOverride = tier.pricing?.tenant ?? {};
    const adminPrice = tier.pricing?.admin ?? {};

    const value =
      effective.price_local ??
      effective.price_usd ??
      tenantOverride.price_local ??
      tenantOverride.price_usd ??
      adminPrice.price_local ??
      adminPrice.price_usd ??
      tier.price_local ??
      tier.price_usd ??
      0;

    return Number(value) || 0;
  };

  const unitPrice = resolveTierUnitPrice(resolveTier);
  const subtotal =
    Number(formValues.quantity || 0) *
    Number(formValues.months || 0) *
    unitPrice;

  const selectedCurrency = (resolveTier?.pricing?.effective?.currency ||
    resolveTier?.pricing?.tenant?.currency ||
    resolveTier?.pricing?.admin?.currency ||
    formValues.country ||
    "USD").toUpperCase();

  const myOrders = useMemo(() => {
    return orders
      .filter((order) =>
        userEmail
          ? order.customerEmail?.toLowerCase() === userEmail.toLowerCase()
          : order.customerType === "tenant"
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, userEmail]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "months" ? Number(value) : value,
    }));
  };

  const resetForm = () => {
    setFormValues({
      country: formValues.country,
      region: "",
      tier: "",
      quantity: 1,
      months: 12,
      paymentMethod: "card",
      notes: "",
    });
  };

  const submitOrder = () => {
    if (!userEmail) {
      ToastUtils.error(
        "We couldn't determine your account email. Please re-authenticate and try again."
      );
      return;
    }

    if (!formValues.region || !formValues.tier) {
      ToastUtils.error("Select a region and tier before continuing.");
      return;
    }

    if (!formValues.quantity || !formValues.months) {
      ToastUtils.error("Quantity and term are required.");
      return;
    }

    const orderId = createOrder({
      customerType: "tenant",
      customerName: "Tenant user",
      customerEmail: userEmail,
      countryCode: formValues.country,
      currencyCode: selectedCurrency,
      region: formValues.region,
      tierId: formValues.tier,
      tierName: resolveTier?.product?.name || resolveTier?.product_name || "",
      quantity: Number(formValues.quantity),
      months: Number(formValues.months),
      paymentMethod: formValues.paymentMethod,
      paymentStatus: formValues.paymentMethod === "card" ? "paid" : "pending",
      status:
        formValues.paymentMethod === "card"
          ? "payment_confirmed"
          : "pending_payment",
      billing: {
        unitPrice,
        subtotal,
        tax: 0,
        total: subtotal,
      },
      notes: formValues.notes,
      timelineNote:
        formValues.paymentMethod === "card"
          ? "Payment authorised via portal"
          : "Awaiting payment confirmation",
    });

    ToastUtils.success("Storage order submitted.");

    if (formValues.paymentMethod === "card") {
      setTimeout(() => {
        updateOrder(orderId, {
          status: "provisioning",
          timelineNote: "Provisioning started",
        });

        setTimeout(() => {
          updateOrder(orderId, {
            status: "active",
            timelineNote: "Provisioning completed",
          });
        }, 1000);
      }, 400);
    }

    resetForm();
    setIsCreating(false);
  };

  const tenantData = {
    name: "Tenant portal",
    logo: "",
    color: "#288DD1",
  };

  const stats = useMemo(() => {
    const active = myOrders.filter((order) => order.status === "active").length;
    const provisioning = myOrders.filter((order) => order.status === "provisioning").length;
    const pending = myOrders.filter((order) => order.status === "pending_payment").length;
    return [
      {
        label: "Active plans",
        value: active,
        tone: "emerald",
        description: "Fully provisioned and online",
        icon: HardDrive,
      },
      {
        label: "Provisioning",
        value: provisioning,
        tone: "primary",
        description: "In-flight provisioning jobs",
        icon: Rocket,
      },
      {
        label: "Pending payment",
        value: pending,
        tone: "warning",
        description: "Awaiting confirmation",
        icon: Database,
      },
    ];
  }, [myOrders]);

  return (
    <>
      <Sidebar
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <HeaderBar
        tenantData={tenantData}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />

      <main className="dashboard-content-shell overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6 pb-12">
          <ModernCard padding="lg" className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <IconBadge icon={HardDrive} tone="primary" size="lg" />
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Object storage
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Track tenant storage plans, review provisioning status, and purchase additional capacity.
                  </p>
                </div>
              </div>
              <ModernButton
                onClick={() => setIsCreating(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Buy storage
              </ModernButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat) => (
                <ModernCard
                  key={stat.label}
                  variant="outlined"
                  padding="sm"
                  className="flex items-center gap-4"
                >
                  <IconBadge icon={stat.icon} tone={stat.tone} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-900">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-500">{stat.description}</p>
                  </div>
                </ModernCard>
              ))}
            </div>
          </ModernCard>

          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <ModernCard
                variant="outlined"
                padding="lg"
                className="flex flex-col items-center gap-3 text-center"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
                  <AlertCircle className="h-6 w-6" />
                </span>
                <h3 className="text-base font-semibold text-slate-900">
                  No storage plans yet
                </h3>
                <p className="max-w-sm text-sm text-slate-500">
                  Use the “Buy storage” action to provision your first object storage plan and track its lifecycle here.
                </p>
              </ModernCard>
            ) : (
              myOrders.map((order) => {
                const statusStyle = statusStyles[order.status] || statusStyles.cancelled;
                return (
                  <ModernCard
                    key={order.id}
                    variant="outlined"
                    padding="lg"
                    className="space-y-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {order.tierName || "Object storage tier"}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Region {order.region?.toUpperCase() || "N/A"} • {order.quantity} unit{order.quantity === 1 ? "" : "s"} • {order.months} month{order.months === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyle.pill}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <ModernCard variant="filled" padding="sm" className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Total
                        </p>
                        <p className="text-lg font-semibold text-slate-900">
                          {order.currencyCode} {order.billing.total.toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-500">Includes all units and term length</p>
                      </ModernCard>
                      <ModernCard variant="filled" padding="sm" className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Payment status
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {order.paymentStatus.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-slate-500">Last updated via tenant portal</p>
                      </ModernCard>
                      <ModernCard variant="filled" padding="sm" className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Created
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDateTime(order.createdAt)}
                        </p>
                        <p className="text-xs text-slate-500">Timeline updates appear below</p>
                      </ModernCard>
                    </div>

                    {order.status === "active" && (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4" />
                          Buckets, credentials, and usage will appear once the Zadara API connection is synced for your tenancy.
                        </div>
                      </div>
                    )}
                  </ModernCard>
                );
              })
            )}
          </div>

          {isCreating && (
            <ModernCard padding="lg" className="space-y-6">
              <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Purchase storage
                  </h2>
                  <p className="text-sm text-slate-500">
                    Choose a region, quota tier, and billing preference. Prices update with your selections.
                  </p>
                </div>
                <ModernButton variant="ghost" onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}>
                  Cancel
                </ModernButton>
              </header>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Billing country
                  </label>
                  <select
                    name="country"
                    value={formValues.country}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    {isCountriesLoading && <option>Loading…</option>}
                    {countries?.map((country, index) => {
                      const value = (country.iso2 || country.code || index.toString()).toUpperCase();
                      return (
                        <option key={value} value={value}>
                          {country.name || value}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Region
                  </label>
                  <select
                    name="region"
                    value={formValues.region}
                    onChange={(event) => {
                      setFormValues((prev) => ({
                        ...prev,
                        region: event.target.value,
                        tier: "",
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="">
                      {isRegionsLoading ? "Loading regions…" : "Select region"}
                    </option>
                    {regions?.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name || region.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Object storage tier
                  </label>
                  <select
                    name="tier"
                    value={formValues.tier}
                    onChange={handleFormChange}
                    disabled={!formValues.region || isTierLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                  >
                    <option value="">
                      {isTierLoading ? "Fetching tiers…" : "Select tier"}
                    </option>
                    {tierPricing?.data?.map((tier) => (
                      <option
                        key={tier.product?.productable_id ?? tier.id}
                        value={tier.product?.productable_id ?? tier.productable_id}
                      >
                        {(tier.product?.name || tier.product_name || "Tier").concat(
                          ` • ${getCurrencySymbol(selectedCurrency)}${resolveTierUnitPrice(tier).toFixed(4)}`
                        )}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Quantity
                  </label>
                  <input
                    name="quantity"
                    type="number"
                    min={1}
                    value={formValues.quantity}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Term (months)
                  </label>
                  <input
                    name="months"
                    type="number"
                    min={1}
                    value={formValues.months}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Payment method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formValues.paymentMethod}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  >
                    <option value="card">Pay with card</option>
                    <option value="invoice">Request invoice</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Notes (optional)
                  </label>
                  <textarea
                    name="notes"
                    value={formValues.notes}
                    onChange={handleFormChange}
                    rows={3}
                    placeholder="Add any additional context for the operations team."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimated total
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {getCurrencySymbol(selectedCurrency)}
                    {subtotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Taxes handled separately. We’ll email a confirmation once provisioning kicks off.
                  </p>
                </div>
                <ModernButton onClick={submitOrder} className="gap-2">
                  {isTierLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Confirm order
                </ModernButton>
              </div>
            </ModernCard>
          )}
        </div>
      </main>
    </>
  );
};

export default TenantObjectStorage;
