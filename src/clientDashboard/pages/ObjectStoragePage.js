import React, { useMemo, useState } from "react";
import { useObjectStorage } from "../../contexts/ObjectStorageContext";
import useClientAuthStore from "../../stores/clientAuthStore";
import {
  useFetchProductPricing,
  useFetchCountries,
  useFetchGeneralRegions,
} from "../../hooks/resource";
import ToastUtils from "../../utils/toastUtil";
import { HardDrive, Plus, Loader2 } from "lucide-react";
import { getCurrencySymbol } from "../../utils/resource";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";

const statusClasses = {
  pending_payment: "bg-amber-100 text-amber-700",
  payment_confirmed: "bg-blue-100 text-blue-700",
  provisioning: "bg-blue-100 text-blue-700",
  active: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const ObjectStoragePage = () => {
  const { orders, createOrder, updateOrder } = useObjectStorage();
  const userEmail = useClientAuthStore((state) => state.userEmail);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    country: "US",
    region: "",
    tier: "",
    quantity: 1,
    months: 12,
  });

  const { data: countries = [] } = useFetchCountries();
  const { data: regions = [], isFetching: isRegionsLoading } = useFetchGeneralRegions();
  const { data: tierPricing, isFetching: isTierLoading } =
    useFetchProductPricing(form.region, "object_storage_configuration", {
      enabled: !!form.region,
      countryCode: form.country,
    });

  const resolveTier = useMemo(() => {
    if (!form.tier || !tierPricing?.data) return null;
    return tierPricing.data.find(
      (tier) =>
        String(tier.product?.productable_id) === String(form.tier) ||
        String(tier.productable_id) === String(form.tier)
    );
  }, [form.tier, tierPricing]);

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
    Number(form.quantity || 0) * Number(form.months || 0) * unitPrice;

  const selectedCurrencyRaw =
    resolveTier?.pricing?.effective?.currency ||
    resolveTier?.pricing?.tenant?.currency ||
    resolveTier?.pricing?.admin?.currency ||
    form.country ||
    "USD";
  const selectedCurrency = selectedCurrencyRaw.toString().toUpperCase();

  const myOrders = useMemo(() => {
    return orders
      .filter((order) =>
        userEmail
          ? order.customerEmail?.toLowerCase() === userEmail.toLowerCase()
          : order.customerType === "client"
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, userEmail]);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "months" ? Number(value) : value,
    }));
  };

  const submitOrder = () => {
    if (!userEmail) {
      ToastUtils.error("Please login again to continue.");
      return;
    }

    if (!form.region || !form.tier) {
      ToastUtils.error("Select your preferred region and tier.");
      return;
    }

    const orderId = createOrder({
      customerType: "client",
      customerName: "Client user",
      customerEmail: userEmail,
      countryCode: form.country,
      currencyCode: selectedCurrency,
      region: form.region,
      tierId: form.tier,
      tierName: resolveTier?.product?.name || resolveTier?.product_name || "",
      quantity: Number(form.quantity),
      months: Number(form.months),
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "payment_confirmed",
      billing: {
        unitPrice,
        subtotal,
        tax: 0,
        total: subtotal,
      },
      timelineNote: "Payment confirmed via client portal",
    });

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

    ToastUtils.success("Storage plan purchased. Provisioning in progress.");
    setIsCreating(false);
    setForm((prev) => ({ ...prev, region: "", tier: "", quantity: 1, months: 12 }));
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const headerActions = (
    <button
      type="button"
      onClick={() => setIsCreating(true)}
      className="inline-flex items-center gap-2 rounded-full bg-[--theme-color] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[--theme-color-dark]"
    >
      <Plus className="h-4 w-4" />
      Buy storage
    </button>
  );

  const subHeaderContent = (
    <span className="inline-flex items-center gap-2 rounded-full bg-[--theme-color-10] px-3 py-1 text-sm font-semibold text-[--theme-color]">
      <HardDrive className="h-4 w-4" />
      S3-compatible capacity
    </span>
  );

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Object Storage"
        description="Purchase and track S3-compatible capacity for your projects."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Object Storage" },
        ]}
        actions={headerActions}
        subHeaderContent={subHeaderContent}
        contentWrapper="div"
        contentClassName="space-y-6"
      >
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Active plans</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {myOrders.filter((order) => order.status === "active").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Provisioning</p>
            <p className="mt-2 text-2xl font-semibold text-blue-600">
              {myOrders.filter((order) => order.status === "provisioning").length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total orders</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {myOrders.length}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          {myOrders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm text-slate-500">
                No storage plans yet. Use the “Buy storage” button to get started.
              </p>
            </div>
          ) : (
            myOrders.map((order) => (
              <div
                key={order.id}
                className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {order.tierName || "Object storage tier"}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Region {order.region.toUpperCase()} • {order.quantity} unit
                      {order.quantity === 1 ? "" : "s"} • {order.months} month
                      {order.months === 1 ? "" : "s"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      statusClasses[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase">Total</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {order.currencyCode} {order.billing.total.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase">
                      Payment status
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {order.paymentStatus}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-xs text-slate-500 uppercase">
                      Created on
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        {isCreating && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Purchase storage
                </h2>
                <p className="text-sm text-slate-500">
                  Choose the tier and term that match your workload. Prices update
                  based on the selected country.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel
              </button>
            </header>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Billing country
                </label>
                <select
                  name="country"
                  value={form.country}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[--theme-color] focus:outline-none focus:ring-2 focus:ring-[--theme-color]20"
                >
                  {countries.map((country, index) => {
                    const value =
                      (country.iso2 || country.code || index.toString()).toUpperCase();
                    return (
                      <option key={value} value={value}>
                        {country.name || value}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Region
                </label>
                <select
                  name="region"
                  value={form.region}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      region: event.target.value,
                      tier: "",
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[--theme-color] focus:outline-none focus:ring-2 focus:ring-[--theme-color]20"
                >
                  <option value="">
                    {isRegionsLoading ? "Loading regions..." : "Select region"}
                  </option>
                  {regions?.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name || region.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Storage tier
                </label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={handleFormChange}
                  disabled={!form.region || isTierLoading}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[--theme-color] focus:outline-none focus:ring-2 focus:ring-[--theme-color]20 disabled:cursor-not-allowed disabled:bg-gray-100"
                >
                  <option value="">
                    {isTierLoading ? "Fetching tiers..." : "Select tier"}
                  </option>
                  {tierPricing?.data?.map((tier) => {
                    const price = resolveTierUnitPrice(tier).toFixed(4);
                    const label =
                      tier.product?.name || tier.product_name || "Storage tier";
                    return (
                      <option
                        key={tier.product?.productable_id ?? tier.id}
                        value={tier.product?.productable_id ?? tier.productable_id}
                      >
                        {label} • {getCurrencySymbol(selectedCurrency)}
                        {price}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Quantity
                </label>
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[--theme-color] focus:outline-none focus:ring-2 focus:ring-[--theme-color]20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  Term (months)
                </label>
                <input
                  name="months"
                  type="number"
                  min={1}
                  value={form.months}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[--theme-color] focus:outline-none focus:ring-2 focus:ring-[--theme-color]20"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">
                  Estimated total
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {getCurrencySymbol(selectedCurrency)}
                  {subtotal.toFixed(2)}
                </p>
                <p className="text-xs text-slate-500">
                  Charged immediately. Provisioning typically completes within a few
                  minutes.
                </p>
              </div>
              <button
                onClick={submitOrder}
                className="inline-flex items-center gap-2 rounded-lg bg-[--theme-color] px-4 py-2 text-sm font-medium text-white transition hover:bg-[--theme-color-dark]"
              >
                {isTierLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Confirm purchase</span>
                )}
              </button>
            </div>
          </section>
        )}
      </ClientPageShell>
    </>
  );
};

export default ObjectStoragePage;
