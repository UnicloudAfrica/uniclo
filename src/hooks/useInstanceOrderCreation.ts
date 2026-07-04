import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useApiContext, ApiContext } from "./useApiContext";
import ToastUtils from "../utils/toastUtil";
import { Configuration, AdditionalVolume } from "../types/InstanceConfiguration";
import { useAsyncAction } from "../shared/hooks/useAsyncAction";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
  pickPreferredPaymentOption,
} from "../utils/instanceCreationUtils";
import {
  buildPreviewPricingPayload,
  composeExpectedTotal,
  extractPreviewPricingEstimate,
  PREVIEW_PRICING_DEBOUNCE_MS,
} from "../utils/instancePreviewPricing";

interface DrSpecConfig {
  mode: "match" | "custom";
  drTargetAz?: string;
  drTargetAzLabel?: string;
  computeInstanceId?: string;
  computeLabel?: string;
  pricePerVm?: number;
  /** Computed DR monthly cost from ProtectionPlanStep */
  drMonthlyCost?: number;
  drVmCount?: number;
  drVmFullPrice?: number;
}

interface ProtectionPlanConfig {
  plan: string; // "none" | "backup_only" | "dr_standby" | "dr_replication"
  redundancyPattern?: string; // "n_plus_1" | "one_plus_1" | "one_plus_n"
  drSpec?: DrSpecConfig;
  /**
   * FE-computed monthly cost of the selected plan, taken from
   * `ProtectionPlanStep.pricing[selectedPlan].monthly`. Used by the
   * backend to add a "Protection plan" line item to the order so the
   * user is actually charged for the plan they picked.
   *
   * Bug this guards against: previously only DR plans sent
   * `dr_monthly_cost` and the backend only added the fee for DR. A
   * `backup_only` selection at ₦240k/mo showed up as a "Plan fee" line
   * in the right-rail summary but was silently DROPPED from the order
   * grand total — operators paid the compute bill and were quietly
   * granted free backup. Including `monthly_cost` here for every
   * non-"none" plan closes that revenue leak.
   */
  monthlyCost?: number;
}

interface UseInstanceOrderCreationProps {
  configurations: Configuration[];
  isFastTrack: boolean;
  billingCountry: string;
  contextType: string;
  selectedTenantId: string;
  selectedUserId: string;
  setActiveStep: (step: number) => void;
  protectionPlan?: ProtectionPlanConfig;
  /**
   * Actual indices of the `payment` and `review` steps in the wizard's
   * `steps` array — required so this hook navigates to the correct step
   * after `POST /instances/create`. Earlier these were hardcoded
   * (`isFastTrack ? null : 2` for payment, `isFastTrack ? 2 : 3` for
   * review) which silently misaligned once `protection` was inserted
   * between `services` and `payment` in `provisioningSteps.ts`. The
   * symptom: in standard mode, clicking Continue on the Protection step
   * jumped the user *backwards* to Protection (the slot the hook thinks
   * is "payment") instead of forward to the real Payment step — making
   * payment effectively unreachable.
   */
  paymentStepIndex: number | null;
  reviewStepIndex: number;
}

const getContextPrefix = (context: ApiContext) => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

/**
 * Pre-tax subtotal and tax-inclusive grand total of a backend
 * `pricing_breakdown` array — the same sums the wizard's payment step
 * renders (see `pricingSummary` in useClientProvisioningLogic). Exported
 * at module scope so it's unit-testable without spinning up the hook.
 */
export const summarizePricingBreakdownTotals = (
  breakdown: unknown
): { subtotal: number; total: number } => {
  if (!Array.isArray(breakdown)) return { subtotal: 0, total: 0 };
  const sums = breakdown.reduce<{ subtotal: number; total: number }>(
    (acc, item) => {
      const row = (item || {}) as { subtotal?: unknown; total?: unknown };
      acc.subtotal += Number(row.subtotal) || 0;
      acc.total += Number(row.total) || 0;
      return acc;
    },
    { subtotal: 0, total: 0 }
  );
  return {
    subtotal: Number(sums.subtotal.toFixed(2)),
    total: Number(sums.total.toFixed(2)),
  };
};

export const useInstanceOrderCreation = ({
  configurations,
  isFastTrack,
  billingCountry,
  contextType,
  selectedTenantId,
  selectedUserId,
  setActiveStep,
  protectionPlan,
  paymentStepIndex,
  reviewStepIndex,
}: UseInstanceOrderCreationProps) => {
  const { apiBaseUrl, authHeaders, context } = useApiContext();
  const apiPrefix = getContextPrefix(context);
  const createOrderAction = useAsyncAction();
  const verifyPaymentAction = useAsyncAction();
  const [submissionResult, setSubmissionResult] = useState<Record<string, unknown> | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<Record<string, unknown> | null>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<Record<
    string,
    unknown
  > | null>(null);
  const submittedFingerprintRef = useRef<string | null>(null);
  // Price lock: the figures the user last reviewed (the payment step
  // renders the breakdown returned by POST /instances/create). When the
  // exact same order is re-submitted, these ride along as
  // expected_subtotal / expected_total so the backend can 409 on drift
  // instead of silently re-quoting (root CLAUDE.md convention). Keyed on
  // the configuration fingerprint + protection plan so any
  // price-affecting change disarms the lock instead of producing a
  // false 409.
  const reviewedPriceRef = useRef<{
    fingerprint: string;
    protectionKey: string;
    subtotal: number;
    total: number;
  } | null>(null);

  const clearOrderState = useCallback(() => {
    setSubmissionResult(null);
    setOrderReceipt(null);
    setSelectedPaymentOption(null);
  }, []);

  const orderStateFingerprint = useMemo(
    () =>
      JSON.stringify({
        isFastTrack,
        billingCountry,
        contextType,
        selectedTenantId,
        selectedUserId,
        configurations: configurations.map((cfg) => ({
          id: cfg.id,
          region: cfg.region,
          availability_zone: cfg.availability_zone || "",
          project_id: cfg.project_id,
          project_mode: cfg.project_mode || "",
          project_name: cfg.project_name || "",
          network_preset: cfg.network_preset || "",
          compute_instance_id: cfg.compute_instance_id,
          os_image_id: cfg.os_image_id,
          volume_type_id: cfg.volume_type_id,
          storage_size_gb: Number(cfg.storage_size_gb || 0),
          months: Number(cfg.months || 0),
          instance_count: Number(cfg.instance_count || 0),
          bandwidth_id: cfg.bandwidth_id || "",
          floating_ip_count: Number(cfg.floating_ip_count || 0),
          network_id: cfg.network_id || "",
          subnet_id: cfg.subnet_id || "",
          keypair_name: cfg.keypair_name || "",
          assignment_scope: cfg.assignment_scope || "",
          member_user_ids: Array.isArray(cfg.member_user_ids)
            ? [...cfg.member_user_ids]
                .map((id) => Number(id))
                .filter(Boolean)
                .sort((a, b) => a - b)
            : [],
          security_group_ids: Array.isArray(cfg.security_group_ids)
            ? [...cfg.security_group_ids].map((id) => String(id)).sort()
            : [],
          additional_volumes: (cfg.additional_volumes || []).map((vol) => ({
            volume_type_id: vol.volume_type_id || "",
            storage_size_gb: Number(vol.storage_size_gb || 0),
          })),
        })),
      }),
    [isFastTrack, billingCountry, contextType, selectedTenantId, selectedUserId, configurations]
  );

  useEffect(() => {
    if (
      submittedFingerprintRef.current &&
      submittedFingerprintRef.current !== orderStateFingerprint
    ) {
      submittedFingerprintRef.current = null;
      clearOrderState();
    }
  }, [orderStateFingerprint, clearOrderState]);

  const apiCall = useCallback(
    async (method: string, endpoint: string, body?: unknown, idempotencyKey?: string) => {
      const headers: Record<string, string> = { ...authHeaders };
      if (idempotencyKey) {
        headers["Idempotency-Key"] = idempotencyKey;
      }

      const response = await fetch(`${apiBaseUrl}${apiPrefix}${endpoint}`, {
        method,
        headers,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      let data: Record<string, unknown> | null = null;
      try {
        data = (await response.json()) as Record<string, unknown> | null;
      } catch {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}). Please try again.`);
        }
        throw new Error("Unexpected server response. Please try again.");
      }

      if (!response.ok) {
        const errors = data?.errors as Record<string, unknown> | undefined;
        const message =
          (data?.message as string | undefined) ||
          (data?.error as string | undefined) ||
          (errors ? Object.values(errors).flat().join(", ") : null) ||
          `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      return data;
    },
    [apiBaseUrl, apiPrefix, authHeaders]
  );

  // ─── Live pre-order pricing estimate ───────────────────────────────
  // Quote the configured order via POST /instances/preview-pricing (same
  // engine the create endpoint bills with) so the summary shows a running
  // price WHILE the operator configures — before any order exists. The
  // preview endpoint prices compute only; the protection-plan fee is folded
  // in client-side via composeExpectedTotal. Best-effort: any failure leaves
  // the estimate blank. Mirrors the client/tenant provisioning hooks.
  const [pricingEstimate, setPricingEstimate] = useState<{
    key: string;
    total: number;
    currency: string;
  } | null>(null);

  const previewPayloadKey = useMemo(() => {
    const payload = buildPreviewPricingPayload(
      configurations,
      billingCountry,
      selectedTenantId || undefined
    );
    return payload ? JSON.stringify(payload) : "";
  }, [configurations, billingCountry, selectedTenantId]);

  useEffect(() => {
    if (!previewPayloadKey) {
      setPricingEstimate(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await apiCall(
          "POST",
          "/instances/preview-pricing",
          JSON.parse(previewPayloadKey) as Record<string, unknown>
        );
        const estimate = extractPreviewPricingEstimate(response);
        if (!cancelled) {
          setPricingEstimate(estimate ? { key: previewPayloadKey, ...estimate } : null);
        }
      } catch {
        if (!cancelled) setPricingEstimate(null);
      }
    }, PREVIEW_PRICING_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [previewPayloadKey, apiCall]);

  // Displayed estimate = previewed compute total + the protection-plan fee
  // for the FULL TERM (fee × months), because the order is prepaid upfront for
  // its term — the backend bills the protection line the same way at submit
  // (see InitiateMultiInstancesAction). `orderTermMonths` is the longest config
  // term the plan protects, matching the backend's per-order resolution.
  const protectionMonthlyCost = Number(protectionPlan?.monthlyCost) || 0;
  const orderTermMonths = useMemo(
    () => configurations.reduce((max, cfg) => Math.max(max, Number(cfg.months) || 1), 1),
    [configurations]
  );
  const priceEstimate = useMemo(
    () =>
      pricingEstimate
        ? {
            total: composeExpectedTotal(
              pricingEstimate.total,
              protectionMonthlyCost,
              orderTermMonths
            ),
            currency: pricingEstimate.currency,
          }
        : null,
    [pricingEstimate, protectionMonthlyCost, orderTermMonths]
  );

  const buildPayload = useCallback(() => {
    const pricing_requests = configurations.map((cfg, index) => {
      const isNewProject = cfg.project_mode === "new" || Boolean(cfg.template_locked);
      const assignmentScopePayload = cfg.assignment_scope || undefined;
      const sanitizedMemberIds = Array.isArray(cfg.member_user_ids)
        ? cfg.member_user_ids.map((id) => Number(id)).filter(Boolean)
        : [];
      const requiredFields = [
        { key: "name", label: `Instance name (config ${index + 1})` },
        { key: "region", label: `Region (config ${index + 1})` },
        { key: "compute_instance_id", label: `Instance type (config ${index + 1})` },
        { key: "os_image_id", label: `OS image (config ${index + 1})` },
        { key: "volume_type_id", label: `Volume type (config ${index + 1})` },
      ];
      const missing = requiredFields.filter(
        ({ key }) => !cfg[key as keyof Configuration] || cfg[key as keyof Configuration] === ""
      );
      if (missing.length) {
        throw new Error(`Select: ${missing.map((f) => f.label).join(", ")} before submitting.`);
      }

      const parsedBandwidthCount = cfg.bandwidth_id ? 1 : 0;
      const parsedFloatingIpCount = Number(cfg.floating_ip_count) || 0;
      const parsedMonths = Number(cfg.months) || 1;
      const parsedInstances = Number(cfg.instance_count) || 1;
      const parsedStorage = Number(cfg.storage_size_gb) || 50;
      const instanceName = (cfg.name || "").trim() || null;
      // const instanceDescription = (cfg.description || "").trim() || null; // Unused in payload
      const networkId = isNewProject ? undefined : cfg.network_id || undefined;
      const subnetId = isNewProject ? undefined : cfg.subnet_id || undefined;
      const tags = (cfg.tags || "")
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean);

      const sanitizedSgIds = (
        Array.isArray(cfg.security_group_ids)
          ? cfg.security_group_ids
          : ((cfg.security_group_ids as unknown as string) || "").split(",")
      )
        .map((v: unknown) => {
          const obj = v as { value?: unknown } | null;
          return obj && obj.value ? obj.value : v;
        })
        .map((v: unknown) => (v ? String(v).trim() : ""))
        .filter(Boolean);

      const extraVolumes = (cfg.additional_volumes || [])
        .map((vol: AdditionalVolume) => ({
          volume_type_id: vol.volume_type_id,
          storage_size_gb: Number(vol.storage_size_gb) || 0,
        }))
        .filter((vol) => vol.volume_type_id && vol.storage_size_gb > 0);

      const fastTrackLine = isFastTrack;

      const securityGroupPayload =
        !isNewProject && sanitizedSgIds.length > 0 ? sanitizedSgIds : undefined;
      const keypairPublicKeyPayload =
        isNewProject && cfg.keypair_name && cfg.keypair_public_key
          ? cfg.keypair_public_key
          : undefined;

      return {
        project_id: isNewProject ? undefined : cfg.project_id || undefined,
        project_name: isNewProject ? cfg.project_name || undefined : undefined,
        network_preset: isNewProject
          ? cfg.network_preset === "empty"
            ? "standard"
            : cfg.network_preset || "standard"
          : undefined,
        region: cfg.region || undefined,
        availability_zone: cfg.availability_zone || undefined,
        compute_instance_id: cfg.compute_instance_id,
        os_image_id: cfg.os_image_id,
        months: parsedMonths,
        number_of_instances: parsedInstances,
        volume_types: [
          {
            volume_type_id: cfg.volume_type_id,
            storage_size_gb: parsedStorage,
          },
          ...extraVolumes,
        ],
        bandwidth_id: cfg.bandwidth_id || null,
        bandwidth_count: parsedBandwidthCount,
        floating_ip_count: parsedFloatingIpCount,
        cross_connect_id: undefined,
        security_group_ids: securityGroupPayload,
        keypair_name: cfg.keypair_name || undefined,
        keypair_public_key: keypairPublicKeyPayload,
        network_id: networkId,
        subnet_id: subnetId,
        name: instanceName,
        fast_track: fastTrackLine,
        ...(isNewProject && assignmentScopePayload
          ? { assignment_scope: assignmentScopePayload }
          : {}),
        ...(isNewProject && sanitizedMemberIds.length
          ? { member_user_ids: sanitizedMemberIds }
          : {}),
        ...(tags.length > 0 ? { tags } : {}),
      };
    });

    const anyFastTrack = isFastTrack;

    const payload: Record<string, unknown> = {
      fast_track: anyFastTrack,
      country_iso: billingCountry || undefined,
      pricing_requests,
    };
    if (contextType === "tenant" && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (contextType === "user" && selectedUserId) {
      payload.user_id = selectedUserId;
      if (selectedTenantId) {
        payload.tenant_id = selectedTenantId;
      }
    }

    // Attach protection plan & DR config for any non-"none" plan. The
    // backend's order-creation action expects `monthly_cost` here (for
    // all plan types) and adds it as a line item on the order grand
    // total. Without this `backup_only` fees were dropped silently —
    // see ProtectionPlanConfig.monthlyCost docblock.
    if (protectionPlan && protectionPlan.plan !== "none") {
      const isDr = protectionPlan.plan === "dr_standby" || protectionPlan.plan === "dr_replication";
      payload.protection_plan = {
        plan: protectionPlan.plan,
        monthly_cost: protectionPlan.monthlyCost || 0,
        ...(isDr && protectionPlan.redundancyPattern
          ? { redundancy_pattern: protectionPlan.redundancyPattern }
          : {}),
        ...(isDr && protectionPlan.drSpec
          ? {
              dr_mode: protectionPlan.drSpec.mode,
              dr_target_az: protectionPlan.drSpec.drTargetAz || undefined,
              dr_compute_instance_id:
                protectionPlan.drSpec.mode === "custom"
                  ? protectionPlan.drSpec.computeInstanceId || undefined
                  : undefined,
              // DR pricing — computed by ProtectionPlanStep, included so
              // backend adds to order total. `dr_monthly_cost` is kept
              // here for compatibility with existing backend code; the
              // generic `monthly_cost` above is the new path.
              dr_monthly_cost: protectionPlan.drSpec.drMonthlyCost || 0,
              dr_vm_count: protectionPlan.drSpec.drVmCount || 0,
              dr_vm_full_price: protectionPlan.drSpec.drVmFullPrice || 0,
            }
          : {}),
      };
    }

    return payload;
  }, [
    configurations,
    isFastTrack,
    billingCountry,
    contextType,
    selectedTenantId,
    selectedUserId,
    protectionPlan,
  ]);

  const handleCreateOrder = useCallback(async () => {
    // Guard against double-submit (rapid clicks before pending state propagates)
    if (createOrderAction.isPending) return;

    submittedFingerprintRef.current = null;
    clearOrderState();

    await createOrderAction.run(
      async () => {
        const incompleteIndex = configurations.findIndex(
          (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
        );
        if (incompleteIndex !== -1) {
          throw new Error(`Complete Configuration #${incompleteIndex + 1} before pricing.`);
        }
        const payload = buildPayload();
        const protectionKey = JSON.stringify(payload.protection_plan ?? null);
        const reviewed = reviewedPriceRef.current;
        // One-shot: consume the lock so a 409 here re-quotes fresh on the
        // next attempt — the 409 toast already shows the new figures.
        reviewedPriceRef.current = null;
        const reviewedLockArmed =
          reviewed &&
          reviewed.fingerprint === orderStateFingerprint &&
          reviewed.protectionKey === protectionKey;
        if (reviewedLockArmed) {
          if (reviewed!.subtotal > 0) payload.expected_subtotal = reviewed!.subtotal;
          if (reviewed!.total > 0) payload.expected_total = reviewed!.total;
        }
        // `expected_total` is REQUIRED by the create endpoint (a 422 otherwise).
        // The post-create breakdown lock above only exists after a first
        // submit, so on the FIRST submit source it from the displayed sidebar
        // estimate — `priceEstimate.total` is exactly what the user reviewed
        // (previewed compute total + protection fee, already tax-inclusive; see
        // composeExpectedTotal). If neither the reviewed lock nor a fresh
        // estimate is available, block rather than let the backend 422 with an
        // opaque message.
        if (payload.expected_total === undefined) {
          if (priceEstimate && priceEstimate.total > 0) {
            payload.expected_total = priceEstimate.total;
          } else {
            throw new Error(
              "We couldn't confirm the order total. Please wait for the price estimate to load, then try again."
            );
          }
        }
        const idempotencyKey = crypto.randomUUID();

        const res = (await apiCall("POST", "/instances/create", payload, idempotencyKey)) as Record<
          string,
          unknown
        > | null;
        const rawData = (res?.data ?? res) as Record<string, unknown> | null;
        const data = (rawData ?? {}) as {
          payment?: {
            payment_gateway_options?: unknown;
            options?: unknown;
            gateway?: unknown;
            required?: unknown;
          };
          payment_options?: unknown;
          pricing_breakdown?: unknown;
          transaction?: {
            metadata?: Record<string, unknown> & { pricing_breakdown?: unknown };
            identifier?: unknown;
            reference?: unknown;
          } | null;
          order?: { pricing_breakdown?: unknown } | null;
          message?: string;
        };

        const normalizedGatewayOptions = normalizePaymentOptions(
          data?.payment?.payment_gateway_options || data?.payment?.options || data?.payment_options
        );
        const preferredPaymentOption = pickPreferredPaymentOption(
          normalizedGatewayOptions as Array<Record<string, unknown>>
        );
        const pricingBreakdownPayload =
          data?.pricing_breakdown ||
          data?.transaction?.metadata?.pricing_breakdown ||
          data?.order?.pricing_breakdown ||
          null;

        const mergedTransaction = data?.transaction
          ? {
              ...data.transaction,
              metadata: {
                ...(data.transaction.metadata || {}),
                ...(pricingBreakdownPayload ? { pricing_breakdown: pricingBreakdownPayload } : {}),
              },
            }
          : null;

        const mergedResult = {
          ...data,
          transaction: mergedTransaction,
          payment: data?.payment
            ? { ...data.payment, payment_gateway_options: normalizedGatewayOptions }
            : normalizedGatewayOptions.length
              ? { payment_gateway_options: normalizedGatewayOptions }
              : data?.payment,
          pricing_breakdown: pricingBreakdownPayload || data?.pricing_breakdown || null,
        } as Record<string, unknown> & {
          payment?: { required?: unknown } & Record<string, unknown>;
          message?: string;
        };

        setSubmissionResult(mergedResult);
        setOrderReceipt({
          transaction: mergedResult?.transaction || null,
          order: mergedResult?.order || null,
          payment: mergedResult?.payment || null,
          pricing_breakdown: mergedResult?.pricing_breakdown || null,
        });
        setSelectedPaymentOption(preferredPaymentOption || null);
        submittedFingerprintRef.current = orderStateFingerprint;

        const reviewedTotals = summarizePricingBreakdownTotals(pricingBreakdownPayload);
        if (reviewedTotals.subtotal > 0 || reviewedTotals.total > 0) {
          reviewedPriceRef.current = {
            fingerprint: orderStateFingerprint,
            protectionKey,
            subtotal: reviewedTotals.subtotal,
            total: reviewedTotals.total,
          };
        }

        const isPaymentRequired = mergedResult?.payment?.required;
        if (isPaymentRequired) {
          if (paymentStepIndex !== null) {
            setActiveStep(paymentStepIndex);
          } else {
            ToastUtils.error("Payment is required. Switch to standard mode to continue.");
            setActiveStep(reviewStepIndex);
          }
        } else {
          setActiveStep(reviewStepIndex);
        }
        return {
          isPaymentRequired: Boolean(isPaymentRequired),
          message: mergedResult?.message,
        };
      },
      {
        successToast: (result) =>
          result.message ||
          (result.isPaymentRequired
            ? "Order created. Complete payment to proceed."
            : "Instances initiated."),
        fallbackErrorMessage: "Could not create instances.",
        rethrow: false,
      }
    );
  }, [
    apiCall,
    buildPayload,
    clearOrderState,
    configurations,
    createOrderAction,
    orderStateFingerprint,
    paymentStepIndex,
    priceEstimate,
    reviewStepIndex,
    setActiveStep,
  ]);

  const handlePaymentCompleted = useCallback(
    async (payload?: unknown) => {
      type PaymentOptionShape = { transaction_reference?: unknown };
      type PaymentShape = {
        payment_gateway_options?: PaymentOptionShape[];
        gateway?: unknown;
      };
      type TxShape = {
        identifier?: unknown;
        reference?: unknown;
        payment_reference?: unknown;
      };
      type ResultShape = {
        payment?: PaymentShape;
        transaction?: TxShape;
      };
      type PayloadShape = { gateway?: unknown; reference?: unknown };
      type SelectedPaymentShape = { transaction_reference?: unknown; name?: unknown };

      const subResult = submissionResult as ResultShape | null;
      const orderRcpt = orderReceipt as ResultShape | null;
      const payloadShape = payload as PayloadShape | undefined;
      const selectedPay = selectedPaymentOption as SelectedPaymentShape | null;

      const identifier =
        selectedPay?.transaction_reference ||
        subResult?.payment?.payment_gateway_options?.[0]?.transaction_reference ||
        orderRcpt?.payment?.payment_gateway_options?.[0]?.transaction_reference ||
        subResult?.transaction?.identifier ||
        subResult?.transaction?.reference ||
        orderRcpt?.transaction?.identifier ||
        orderRcpt?.transaction?.reference ||
        null;

      if (!identifier) {
        ToastUtils.error("No transaction reference available to verify.");
        return;
      }

      const rawGateway =
        payloadShape?.gateway ||
        subResult?.payment?.gateway ||
        orderRcpt?.payment?.gateway ||
        selectedPay?.name ||
        "";

      const normalizedGateway: string = (() => {
        const rawString = String(rawGateway || "");
        const lower = rawString.toLowerCase();
        if (lower.includes("paystack") && lower.includes("card")) {
          return "Paystack_Card";
        }
        if (lower.includes("paystack")) return "Paystack";
        if (lower.includes("flutter")) return "Flutterwave";
        if (lower.includes("wallet")) return "Wallet";
        if (lower.includes("fincra")) return "Fincra";
        if (lower.includes("virtual")) return "Virtual_Account";
        return rawString || "Paystack";
      })();

      await verifyPaymentAction.run(
        async () => {
          const apiPayload: Record<string, unknown> = {
            payment_gateway: normalizedGateway,
          };
          if (normalizedGateway.toLowerCase().includes("paystack")) {
            apiPayload.save_card_details = false;
          }

          const res = (await apiCall("PUT", `/transactions/${identifier}`, apiPayload)) as Record<
            string,
            unknown
          > | null;
          const responseData = (res?.data ?? res ?? {}) as {
            status?: unknown;
            transaction?: {
              status?: unknown;
              metadata?: { keypair_materials?: unknown };
              payment_reference?: unknown;
            };
            keypair_materials?: unknown;
            metadata?: { keypair_materials?: unknown };
            payment_reference?: unknown;
          };

          const normalizedStatus = String(
            responseData?.status || responseData?.transaction?.status || "pending"
          ).toLowerCase();
          const keypairMaterials =
            responseData?.keypair_materials ||
            responseData?.metadata?.keypair_materials ||
            responseData?.transaction?.metadata?.keypair_materials ||
            null;

          const updateState = (prev: Record<string, unknown> | null) => {
            if (!prev) return prev;
            const prevShape = prev as {
              transaction?: { payment_reference?: unknown } & Record<string, unknown>;
              payment?: Record<string, unknown>;
            };
            return {
              ...prev,
              ...(keypairMaterials ? { keypair_materials: keypairMaterials } : {}),
              transaction: {
                ...(prevShape.transaction || {}),
                status: normalizedStatus,
                payment_reference:
                  responseData?.payment_reference ||
                  responseData?.transaction?.payment_reference ||
                  payloadShape?.reference ||
                  prevShape.transaction?.payment_reference,
              },
              payment: {
                ...(prevShape.payment || {}),
                status: normalizedStatus,
                gateway: normalizedGateway,
              },
            };
          };

          setSubmissionResult(updateState);
          setOrderReceipt(updateState);

          const successStatuses = ["successful", "completed", "paid", "success"];
          if (successStatuses.includes(normalizedStatus)) {
            ToastUtils.success("Payment verified successfully!");
            setActiveStep(reviewStepIndex);
          } else {
            ToastUtils.success(`Payment status: ${normalizedStatus}`);
            // Note: logic in original was mixing verifyPayment and paymentCompleted.
            // handlePaymentCompleted in original called PUT and eventually set status and moved step.
            // Here we replicate that.
            if (normalizedStatus === "pending") {
              // Check if we should advance? Original code advanced if status was success.
            }
          }
          return normalizedStatus;
        },
        {
          fallbackErrorMessage: "Could not verify payment.",
          rethrow: false,
        }
      );
    },
    [
      apiCall,
      orderReceipt,
      reviewStepIndex,
      selectedPaymentOption,
      setActiveStep,
      submissionResult,
      verifyPaymentAction,
    ]
  );

  return {
    isSubmitting: createOrderAction.isPending,
    isVerifyingPayment: verifyPaymentAction.isPending,
    submissionResult,
    setSubmissionResult, // Export setter if needed
    orderReceipt,
    // Live pre-order estimate (compute + protection), null until configs complete.
    priceEstimate,
    submissionErrorMessage: createOrderAction.errorMessage,
    paymentErrorMessage: verifyPaymentAction.errorMessage,
    selectedPaymentOption,
    setSelectedPaymentOption,
    handleCreateOrder,
    handlePaymentCompleted,
  };
};
