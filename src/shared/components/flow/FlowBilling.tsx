/**
 * FlowBilling — destination for the past_due banner CTA.
 *
 * Shows the subscription's billing context (plan, monthly amount, next
 * billing date, last failed-attempts count) and a single primary action:
 * "Update payment method" — which initialises a fresh Paystack inline
 * checkout. On success, the returned reference is posted to
 * `/flow/subscription/renew` which re-activates the subscription.
 *
 * Auto-opens the Paystack flow when `?reauthorize=1` is in the URL
 * (the past_due banner CTA passes this param).
 */
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  SurfaceCard,
  SectionHeader,
  ModernButton,
  StatusPill,
  type StatusTone,
  InfoCallout,
  LoadingState,
  ErrorState,
  DescriptionList,
  StatTile,
} from "@/shared/components/ui";
import { useFlowApi, type FlowStatus } from "@/shared/hooks/useFlowApi";

const STATUS_TONE: Record<string, StatusTone> = {
  active: "success",
  trialing: "info",
  past_due: "danger",
  cancelled: "neutral",
};

const formatNgn = (kobo?: number): string => {
  if (kobo === undefined || kobo === null) return "—";
  return `₦${(kobo / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (iso?: string | null): string => {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

interface FlowBillingProps {
  /**
   * Paystack public key. Optional; when not provided we render the page in
   * read-only "contact support" mode. Production wires this from env via
   * the page wrapper.
   */
  paystackPublicKey?: string;
}

/**
 * Minimal handle to the Paystack inline SDK loaded via <script> tag.
 * We intentionally don't import a wrapper package — Paystack's UMD bundle
 * is already pulled into the marketing site, so loading on demand is fine.
 */
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency?: string;
        metadata?: Record<string, unknown>;
        onClose?: () => void;
        callback?: (response: { reference: string }) => void;
      }) => { openIframe: () => void };
    };
  }
}

const loadPaystack = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack."));
    document.body.appendChild(script);
  });

const FlowBilling: React.FC<FlowBillingProps> = ({ paystackPublicKey }) => {
  const api = useFlowApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<FlowStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getStatus();
      setStatus(res.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load billing status.");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sub = status?.subscription;
  const plan = sub?.plan;
  const isPastDue = sub?.status === "past_due";
  const customerEmail =
    (sub as unknown as { paystack_customer_email?: string })?.paystack_customer_email ?? "";

  const startReauthorize = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!paystackPublicKey) {
      setError(
        "Paystack public key is not configured for this environment. Please contact support to update your payment method.",
      );
      return;
    }
    if (!plan?.price_monthly_kobo) {
      setError("Plan price is missing. Please contact support.");
      return;
    }
    if (!customerEmail) {
      setError(
        "We couldn't find an email for your subscription. Please contact support to update your payment method.",
      );
      return;
    }

    setRenewing(true);
    try {
      await loadPaystack();
      if (!window.PaystackPop) throw new Error("Paystack failed to initialise.");

      const handler = window.PaystackPop.setup({
        key: paystackPublicKey,
        email: customerEmail,
        amount: plan.price_monthly_kobo,
        currency: "NGN",
        ref: `flow_renew_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        metadata: {
          tenant_id: sub?.tenant_id,
          subscription_id: sub?.id,
          source: "flow_billing_reauthorize",
        },
        onClose: () => {
          setRenewing(false);
        },
        callback: (response) => {
          // Post the reference to UniCloud → backend verifies with Paystack
          api
            .renewSubscription(response.reference)
            .then(() => {
              setSuccess("Payment method updated successfully — your subscription is active.");
              setRenewing(false);
              fetchStatus();
              setSearchParams(
                (sp) => {
                  const next = new URLSearchParams(sp);
                  next.delete("reauthorize");
                  return next;
                },
                { replace: true },
              );
            })
            .catch((err: Error) => {
              setError(err.message || "Renewal failed after Paystack payment. Please contact support.");
              setRenewing(false);
            });
        },
      });
      handler.openIframe();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not start the payment flow.");
      setRenewing(false);
    }
  }, [
    api,
    customerEmail,
    fetchStatus,
    paystackPublicKey,
    plan,
    setSearchParams,
    sub?.id,
    sub?.tenant_id,
  ]);

  // Auto-open the Paystack flow when arriving via the past_due banner CTA.
  useEffect(() => {
    if (!loading && status && searchParams.get("reauthorize") === "1") {
      startReauthorize();
    }
  }, [loading, status, searchParams, startReauthorize]);

  if (loading) return <LoadingState message="Loading billing details…" />;

  if (error && !status) {
    return <ErrorState onRetry={fetchStatus} message={error} />;
  }

  if (!status?.subscribed || !sub || !plan) {
    return (
      <InfoCallout tone="info" title="No active subscription">
        You don't have an active UniCloudFlow subscription. Subscribe from the
        Flow dashboard to manage billing here.
      </InfoCallout>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Billing & payment"
        description={`${plan.name} plan — manage your card, renew, or update payment.`}
        size="lg"
      />

      {success && (
        <InfoCallout tone="success" title="All set" icon={<CheckCircle2 className="h-4 w-4" />}>
          {success}
        </InfoCallout>
      )}
      {error && (
        <InfoCallout tone="danger" title="Something went wrong">
          {error}
        </InfoCallout>
      )}

      {isPastDue && (
        <InfoCallout
          tone="danger"
          title="Payment past due"
          icon={<AlertTriangle className="h-4 w-4" />}
          actions={
            <ModernButton
              variant="primary"
              size="sm"
              onClick={startReauthorize}
              isLoading={renewing}
              leftIcon={<CreditCard className="h-3.5 w-3.5" />}
            >
              Update payment method
            </ModernButton>
          }
        >
          We tried to charge your card and it didn't go through. Update your
          payment method now to keep your servers running. You have 14 days
          before the subscription is deactivated.
        </InfoCallout>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Plan"
          value={plan.name}
          tone="primary"
        />
        <StatTile
          label="Monthly amount"
          value={formatNgn(plan.price_monthly_kobo)}
          tone="neutral"
        />
        <StatTile
          label="Status"
          value={<StatusPill tone={STATUS_TONE[sub.status] ?? "neutral"} label={sub.status} />}
          accessibleValue={sub.status}
        />
      </div>

      <SurfaceCard variant="card" padding="lg" radius="lg">
        <SectionHeader title="Subscription details" size="sm" />
        <div className="mt-4">
          <DescriptionList
            layout="grid"
            items={[
              { term: "Next billing", description: formatDate(sub.next_billing_date) },
              { term: "Period start", description: formatDate(sub.current_period_start) },
              { term: "Period end", description: formatDate(sub.current_period_end) },
              {
                term: "Failed attempts",
                description: String(
                  (sub as unknown as { failed_charge_attempts?: number }).failed_charge_attempts ?? 0,
                ),
              },
              {
                term: "Card on file",
                description: customerEmail || "—",
              },
            ]}
          />
        </div>

        {!isPastDue && (
          <div className="mt-6 flex items-center justify-between gap-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/40">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Need to swap cards or fix a stuck payment? Open the Paystack flow.
            </span>
            <ModernButton
              variant="outline"
              size="sm"
              onClick={startReauthorize}
              isLoading={renewing}
              leftIcon={<CreditCard className="h-3.5 w-3.5" />}
            >
              Update payment method
            </ModernButton>
          </div>
        )}
      </SurfaceCard>
    </div>
  );
};

export default FlowBilling;
