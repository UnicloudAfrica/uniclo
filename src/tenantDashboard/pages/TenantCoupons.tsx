import { useCallback, useMemo, useState } from "react";
import { Plus, Ticket, Trash2 } from "lucide-react";
import TenantPageShell from "@/shared/layouts/TenantPageShell";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import EmptyState from "@/shared/components/ui/EmptyState";
import ErrorState from "@/shared/components/ui/ErrorState";
import LoadingState from "@/shared/components/ui/LoadingState";
import ModernButton from "@/shared/components/ui/ModernButton";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import StatusPill from "@/shared/components/ui/StatusPill";
import PriceLabel from "@/shared/components/ui/PriceLabel";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import {
  useFetchCoupons,
  useCreateCoupon,
  useDeactivateCoupon,
} from "@/shared/hooks/resources/couponHooks";
import type { Coupon, CouponType } from "@/shared/hooks/resources/couponHooks";

interface CouponFormState {
  code: string;
  type: CouponType;
  value: string;
  currency: string;
  max_redemptions: string;
  expires_at: string;
}

const EMPTY_FORM: CouponFormState = {
  code: "",
  type: "percentage",
  value: "",
  currency: "",
  max_redemptions: "",
  expires_at: "",
};

const TYPE_OPTIONS = [
  { label: "Percentage", value: "percentage" },
  { label: "Fixed amount", value: "fixed" },
];

const formatExpiry = (value?: string | null): string => {
  if (!value) return "No expiry";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "No expiry" : parsed.toLocaleDateString();
};

const TenantCoupons = () => {
  const { data: coupons, isLoading, isError, refetch } = useFetchCoupons();
  const createCoupon = useCreateCoupon();
  const deactivateCoupon = useDeactivateCoupon();
  const createAction = useAsyncAction();
  const deactivateAction = useAsyncAction();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<CouponFormState>(EMPTY_FORM);
  const [pendingDeactivation, setPendingDeactivation] = useState<Coupon | null>(null);

  const rows = useMemo<Coupon[]>(() => (Array.isArray(coupons) ? coupons : []), [coupons]);

  const setField = useCallback(
    <K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const closeCreate = useCallback(() => {
    setIsCreateOpen(false);
    setForm(EMPTY_FORM);
  }, []);

  const handleCreate = useCallback(async () => {
    if (createAction.isPending) return;

    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      type: form.type,
      value: Number(form.value),
    };
    if (form.type === "fixed") {
      payload.currency = form.currency.trim().toUpperCase();
    }
    if (form.max_redemptions.trim() !== "") {
      payload.max_redemptions = Number(form.max_redemptions);
    }
    if (form.expires_at.trim() !== "") {
      payload.expires_at = form.expires_at;
    }

    await createAction.run(() => createCoupon.mutateAsync(payload), {
      successToast: `Coupon ${payload.code} created`,
      // The resource mutation uses toastApi, which already surfaces request
      // errors — suppress the duplicate error toast here.
      errorToast: false,
      rethrow: false,
      onSuccess: () => closeCreate(),
    });
  }, [createAction, createCoupon, form, closeCreate]);

  const handleDeactivate = useCallback(async () => {
    if (!pendingDeactivation || deactivateAction.isPending) return;
    const target = pendingDeactivation;

    await deactivateAction.run(() => deactivateCoupon.mutateAsync({ id: target.id }), {
      successToast: `Coupon ${target.code} deactivated`,
      errorToast: false,
      rethrow: false,
      onSuccess: () => setPendingDeactivation(null),
    });
  }, [deactivateAction, deactivateCoupon, pendingDeactivation]);

  const codeMissing = form.code.trim() === "";
  const valueMissing = form.value.trim() === "" || Number.isNaN(Number(form.value));
  const currencyMissing = form.type === "fixed" && form.currency.trim().length !== 3;
  const submitDisabled = codeMissing || valueMissing || currencyMissing;

  const createButton = (
    <ModernButton
      variant="primary"
      leftIcon={<Plus size={16} />}
      onClick={() => setIsCreateOpen(true)}
    >
      New coupon
    </ModernButton>
  );

  const renderBody = () => {
    if (isLoading) {
      return <LoadingState message="Loading coupons…" />;
    }

    if (isError) {
      return (
        <ErrorState
          title="Could not load coupons"
          message="Something went wrong while fetching your coupons."
          onRetry={() => refetch()}
        />
      );
    }

    if (rows.length === 0) {
      return (
        <EmptyState
          icon={<Ticket size={24} />}
          title="No coupons yet"
          description="Create a coupon to offer percentage or fixed-amount discounts on invoices."
          action={createButton}
        />
      );
    }

    return (
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Redemptions</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((coupon) => {
              const isActive = coupon.active !== false;
              const numericValue = Number(coupon.value);
              return (
                <tr key={coupon.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{coupon.code}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {coupon.type === "fixed" && coupon.currency ? (
                      <PriceLabel amount={numericValue} sourceCurrency={coupon.currency} />
                    ) : (
                      `${numericValue}%`
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {coupon.times_redeemed ?? 0}
                    {coupon.max_redemptions != null ? ` / ${coupon.max_redemptions}` : ""}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatExpiry(coupon.expires_at)}</td>
                  <td className="px-4 py-3">
                    <StatusPill
                      status={isActive ? "active" : "inactive"}
                      label={isActive ? "Active" : "Inactive"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {isActive ? (
                      <ModernButton
                        variant="outlineDanger"
                        size="sm"
                        leftIcon={<Trash2 size={14} />}
                        onClick={() => setPendingDeactivation(coupon)}
                      >
                        Deactivate
                      </ModernButton>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <TenantPageShell
      title="Coupons"
      description="Create and manage discount coupons for your customers' invoices."
      subHeaderContent={rows.length > 0 ? createButton : undefined}
    >
      {renderBody()}

      <ModernModal
        isOpen={isCreateOpen}
        onClose={closeCreate}
        title="New coupon"
        subtitle="Coupons apply a percentage or fixed discount at checkout."
        actions={[
          { label: "Cancel", variant: "ghost", onClick: closeCreate },
          {
            label: createAction.isPending ? "Creating…" : "Create coupon",
            variant: "primary",
            onClick: handleCreate,
            disabled: submitDisabled || createAction.isPending,
          },
        ]}
      >
        <div className="space-y-4">
          <ModernInput
            label="Code"
            required
            value={form.code}
            placeholder="WELCOME10"
            onChange={(e) => setField("code", e.target.value)}
          />
          <ModernSelect
            label="Type"
            required
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(e) => setField("type", e.target.value as CouponType)}
          />
          <ModernInput
            label={form.type === "fixed" ? "Amount" : "Percentage (%)"}
            required
            type="number"
            min="0"
            value={form.value}
            placeholder={form.type === "fixed" ? "25" : "10"}
            onChange={(e) => setField("value", e.target.value)}
          />
          {form.type === "fixed" ? (
            <ModernInput
              label="Currency (ISO code)"
              required
              value={form.currency}
              placeholder="USD"
              onChange={(e) => setField("currency", e.target.value)}
            />
          ) : null}
          <ModernInput
            label="Max redemptions"
            type="number"
            min="1"
            value={form.max_redemptions}
            placeholder="Unlimited"
            helper="Leave blank for unlimited redemptions."
            onChange={(e) => setField("max_redemptions", e.target.value)}
          />
          <ModernInput
            label="Expires at"
            type="date"
            value={form.expires_at}
            onChange={(e) => setField("expires_at", e.target.value)}
          />
        </div>
      </ModernModal>

      <ConfirmDialog
        isOpen={pendingDeactivation !== null}
        title="Deactivate coupon"
        message={
          pendingDeactivation
            ? `Deactivate coupon "${pendingDeactivation.code}"? It can no longer be redeemed.`
            : ""
        }
        confirmLabel="Deactivate"
        variant="danger"
        isLoading={deactivateAction.isPending}
        onConfirm={handleDeactivate}
        onCancel={() => setPendingDeactivation(null)}
      />
    </TenantPageShell>
  );
};

export default TenantCoupons;
