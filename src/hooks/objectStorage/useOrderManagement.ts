import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ObjectStorageOrderSummary,
  PaymentOptionLike,
  ResolvedProfile,
} from "../useObjectStoragePricing";
import { normalizePaymentOptions } from "../../utils/instanceCreationUtils";
import logger from "../../utils/logger";
import type {
  UnknownRecord,
  StorageProfileLike,
  PaymentAccountLike,
  PaymentTransactionData,
  SubmitEvent,
} from "./types";
import { isRecord, isValidUuid } from "./utils";

export interface UseOrderManagementOptions {
  isFastTrack: boolean;
  resolvedProfiles: ResolvedProfile[];
  effectiveCountryCode: string;
  selectedCurrency: string;
  context: string;
  selectedTenantId: string;
  selectedUserId: string;
  submitOrderFn?: (payload: Record<string, unknown>) => Promise<unknown>;
  /** Shared state: pass in the order summary state pair. */
  lastOrderSummary: ObjectStorageOrderSummary | null;
  setLastOrderSummary: React.Dispatch<React.SetStateAction<ObjectStorageOrderSummary | null>>;
  /** Shared state: pass in the payment option state pair. */
  selectedPaymentOption: PaymentOptionLike | null;
  setSelectedPaymentOption: (option: PaymentOptionLike | null) => void;
}

export interface UseOrderManagementReturn {
  isSubmitting: boolean;
  isGeneratingPayment: boolean;
  orderId: string | number | null | undefined;
  transactionId: string | number | null | undefined;
  accountIds: string[];
  paymentRequired: boolean | null;
  paymentTransactionData: PaymentTransactionData | null;
  paymentOptions: PaymentOptionLike[];
  isPaymentComplete: boolean;
  isPaymentFailed: boolean;
  transactionStatus: string;
  submitOrder: (
    event?: SubmitEvent,
    fastTrackOverride?: boolean,
    options?: Record<string, unknown>
  ) => Promise<ObjectStorageOrderSummary | null>;
  createOrder: (options?: {
    fastTrackOverride?: boolean;
  }) => Promise<ObjectStorageOrderSummary | null>;
  handlePaymentCompleted: (payload?: Record<string, unknown>) => void;
  resetOrderState: () => void;
}

export const useOrderManagement = (
  options: UseOrderManagementOptions
): UseOrderManagementReturn => {
  const {
    isFastTrack,
    resolvedProfiles,
    effectiveCountryCode,
    context,
    selectedTenantId,
    selectedUserId,
    submitOrderFn,
    lastOrderSummary,
    setLastOrderSummary,
    selectedPaymentOption,
    setSelectedPaymentOption,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);

  // Derived order values
  const orderId = useMemo(() => {
    return (
      lastOrderSummary?.order?.identifier ||
      lastOrderSummary?.order?.id ||
      lastOrderSummary?.order_id ||
      null
    );
  }, [lastOrderSummary]);

  const transactionId = useMemo(() => {
    return (
      lastOrderSummary?.transaction?.identifier ||
      lastOrderSummary?.transaction?.reference ||
      lastOrderSummary?.transaction?.id ||
      null
    );
  }, [lastOrderSummary]);

  const accountIds = useMemo(() => {
    const ids = new Set<string>();
    const add = (value: unknown) => {
      if (value === null || value === undefined || value === "") return;
      ids.add(String(value));
    };

    add(lastOrderSummary?.account?.id);
    add(lastOrderSummary?.object_storage_account_id);
    const accounts = Array.isArray(lastOrderSummary?.accounts) ? lastOrderSummary?.accounts : [];
    accounts.forEach((account) => {
      if (!isRecord(account)) return;
      add(account.id);
    });
    const orderItems = Array.isArray(lastOrderSummary?.order_items)
      ? lastOrderSummary?.order_items
      : Array.isArray(lastOrderSummary?.order?.items)
        ? lastOrderSummary?.order?.items
        : [];
    orderItems.forEach((item) => {
      if (!isRecord(item)) return;
      const account = isRecord(item.account) ? item.account : {};
      add(item.account_id ?? account.id);
    });

    return Array.from(ids);
  }, [lastOrderSummary]);

  // Payment Status
  const paymentOptions = useMemo(() => {
    const raw =
      lastOrderSummary?.payment?.payment_gateway_options ||
      lastOrderSummary?.transaction?.payment_gateway_options ||
      lastOrderSummary?.paymentOptions ||
      [];
    const normalized = normalizePaymentOptions(raw);
    const normalizedArray = Array.isArray(normalized) ? normalized : [];
    return normalizedArray.filter(isRecord) as PaymentOptionLike[];
  }, [lastOrderSummary]);

  const paymentRequired =
    typeof lastOrderSummary?.payment?.required === "boolean"
      ? lastOrderSummary.payment.required
      : null;

  const transactionStatus = (
    lastOrderSummary?.transaction?.status ||
    lastOrderSummary?.payment?.status ||
    ""
  ).toLowerCase();

  const isPaymentComplete =
    Boolean(lastOrderSummary) &&
    (paymentRequired === false ||
      transactionStatus === "successful" ||
      transactionStatus === "completed" ||
      transactionStatus === "paid" ||
      transactionStatus === "success" ||
      transactionStatus === "approved");
  const isPaymentFailed = Boolean(lastOrderSummary) && transactionStatus === "failed";

  const paymentTransactionData = useMemo(() => {
    if (!lastOrderSummary?.transaction && !lastOrderSummary?.payment) return null;
    const orderItemsRaw = Array.isArray(lastOrderSummary?.order_items)
      ? lastOrderSummary.order_items
      : Array.isArray(lastOrderSummary?.order?.items)
        ? lastOrderSummary.order?.items
        : [];
    const orderItems = orderItemsRaw.filter(isRecord) as StorageProfileLike[];
    const storageProfiles = Array.isArray(lastOrderSummary?.serviceProfiles)
      ? (lastOrderSummary.serviceProfiles as StorageProfileLike[])
      : [];
    const accounts = Array.isArray(lastOrderSummary?.accounts)
      ? lastOrderSummary.accounts.filter(isRecord).map((account) => {
          const id = account.id;
          return typeof id === "string" || typeof id === "number" ? { id } : {};
        })
      : [];
    return {
      data: {
        transaction: lastOrderSummary?.transaction || null,
        order: {
          ...(lastOrderSummary?.order || {}),
          type: "object_storage",
          items: orderItems,
          storage_profiles: storageProfiles,
        },
        instances: [],
        accounts,
        order_items: orderItems,
        payment: lastOrderSummary?.payment || null,
      },
    };
  }, [lastOrderSummary]);

  // Auto-select first payment option
  useEffect(() => {
    if (!paymentOptions.length) {
      if (selectedPaymentOption) {
        setSelectedPaymentOption(null);
      }
      return;
    }

    if (
      selectedPaymentOption &&
      paymentOptions.some(
        (option) =>
          option.transaction_reference === selectedPaymentOption.transaction_reference ||
          option.reference === selectedPaymentOption.reference
      )
    ) {
      return;
    }

    setSelectedPaymentOption(paymentOptions[0] || null);
  }, [paymentOptions, selectedPaymentOption, setSelectedPaymentOption]);

  // Reset
  const resetOrderState = useCallback(() => {
    setLastOrderSummary(null);
    setSelectedPaymentOption(null);
    setIsGeneratingPayment(false);
  }, [setLastOrderSummary, setSelectedPaymentOption]);

  // Normalize response
  const normalizeOrderSummary = useCallback(
    (payload: unknown, fastTrackFlag?: boolean): ObjectStorageOrderSummary | null => {
      if (!payload) return null;
      if (!isRecord(payload)) return null;

      const dataRecord = isRecord(payload.data) ? payload.data : payload;
      if (!isRecord(dataRecord)) return null;

      const transaction = isRecord(dataRecord.transaction) ? dataRecord.transaction : null;
      const order = isRecord(dataRecord.order) ? dataRecord.order : null;
      const payment = isRecord(dataRecord.payment) ? dataRecord.payment : null;

      const normalizedPaymentOptions = normalizePaymentOptions(
        payment?.payment_gateway_options ||
          transaction?.payment_gateway_options ||
          dataRecord.payment_options ||
          dataRecord.paymentOptions
      );
      const paymentOptionsArray = Array.isArray(normalizedPaymentOptions)
        ? (normalizedPaymentOptions.filter(isRecord) as PaymentOptionLike[])
        : [];
      const paymentState = payment
        ? { ...payment, payment_gateway_options: paymentOptionsArray }
        : paymentOptionsArray.length
          ? { payment_gateway_options: paymentOptionsArray }
          : null;

      const orderItemsRaw = dataRecord.order_items ?? order?.items ?? [];
      const orderItems = Array.isArray(orderItemsRaw)
        ? (orderItemsRaw.filter(isRecord) as UnknownRecord[])
        : [];
      const accountsRaw = dataRecord.accounts || (dataRecord.account ? [dataRecord.account] : []);
      const _accounts = Array.isArray(accountsRaw)
        ? (accountsRaw.filter(isRecord) as UnknownRecord[])
        : [];

      return {
        transaction,
        order,
        payment: paymentState,
        paymentOptions: paymentOptionsArray,
        fastTrack:
          typeof fastTrackFlag === "boolean"
            ? fastTrackFlag
            : (dataRecord.fast_track ?? dataRecord.fastTrack ?? isFastTrack),
        serviceProfiles: resolvedProfiles,
        order_items: orderItems,
        account: (dataRecord.account || null) as PaymentAccountLike | null,
        object_storage_account_id: dataRecord.object_storage_account_id as string | number,
      };
    },
    [isFastTrack, resolvedProfiles]
  );

  // Submit Order
  const submitOrder = useCallback(
    async (
      event?: SubmitEvent,
      fastTrackOverride?: boolean,
      _options: Record<string, unknown> = {}
    ) => {
      event?.preventDefault();
      setIsSubmitting(true);

      try {
        const fastTrackFlag =
          typeof fastTrackOverride === "boolean" ? fastTrackOverride : isFastTrack;
        const objectStorageItems = resolvedProfiles.map((profile, index) => {
          const tierRow = profile.tierRow || profile.tierData;
          const rawProductableId =
            tierRow?.productable_id ??
            tierRow?.product_id ??
            tierRow?.id ??
            tierRow?.product?.productable_id ??
            tierRow?.product?.id ??
            profile.tierKey?.split("::")[1];
          const parsedProductableId = Number.parseInt(String(rawProductableId ?? ""), 10);
          if (!Number.isFinite(parsedProductableId)) {
            throw new Error(
              "Unable to resolve the selected Silo Storage tier. Please refresh pricing and try again."
            );
          }
          const baseName = (profile.name || profile.tierName || "").trim();
          const name =
            baseName.length >= 3 ? baseName : `Silo Storage ${profile.region || "region"}`.trim();

          return {
            region: profile.region,
            productable_id: parsedProductableId,
            storage_gb: Number(profile.storageGb) || 0,
            quantity: Number(profile.quantity) || 1,
            months: Number(profile.months) || 1,
            name,
            metadata: {
              ui_profile_id: profile.id,
              tier_key: profile.tierKey,
              tier_name: profile.tierName,
              currency: profile.currency,
              unit_price: profile.unitPrice,
              subtotal: profile.subtotal,
              storage_gb: profile.storageGb,
              line_index: index,
            },
          };
        });

        if (!objectStorageItems.length) {
          throw new Error("Add at least one eligible service profile before submitting.");
        }

        const payload: Record<string, unknown> = {
          object_storage_items: objectStorageItems,
          fast_track: fastTrackFlag,
        };

        const countryIso = effectiveCountryCode?.toUpperCase();
        if (countryIso) {
          payload.country_iso = countryIso;
        }
        if (selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        }
        const normalizedUserId =
          typeof selectedUserId === "string" ? selectedUserId.trim() : String(selectedUserId || "");
        if (context !== "client" && isValidUuid(normalizedUserId)) {
          payload.user_id = normalizedUserId;
        }

        // Use provided submit function or log warning
        if (submitOrderFn) {
          const result = await submitOrderFn(payload);
          const normalized = normalizeOrderSummary(result, fastTrackOverride);
          if (normalized) {
            setLastOrderSummary(normalized);
          }
          return normalized;
        } else {
          logger.warn("No submitOrderFn provided - order not submitted");
        }
      } catch (error) {
        logger.error("Order submission failed:", error);
        return null;
      } finally {
        setIsSubmitting(false);
      }
      return null;
    },
    [
      effectiveCountryCode,
      isFastTrack,
      selectedTenantId,
      selectedUserId,
      context,
      resolvedProfiles,
      submitOrderFn,
      normalizeOrderSummary,
      setLastOrderSummary,
    ]
  );

  const createOrder = useCallback(
    async (orderOptions: { fastTrackOverride?: boolean } = {}) => {
      setIsGeneratingPayment(true);
      try {
        return await submitOrder(undefined, orderOptions.fastTrackOverride, {
          skipReset: true,
        });
      } finally {
        setIsGeneratingPayment(false);
      }
    },
    [submitOrder]
  );

  const handlePaymentCompleted = useCallback(
    (payload: Record<string, unknown> = {}) => {
      const payloadRecord = isRecord(payload) ? payload : {};
      const rawStatus = payloadRecord.status || payloadRecord.transaction_status || "successful";
      const normalizedStatus = String(rawStatus).toLowerCase();
      setLastOrderSummary((prev) => {
        if (!prev) return prev;
        const prevTransaction = (prev.transaction || {}) as Record<string, unknown>;
        const prevPayment = (prev.payment || {}) as Record<string, unknown>;
        return {
          ...prev,
          transaction: {
            ...prevTransaction,
            status: normalizedStatus,
            payment_reference: payloadRecord.reference || prevTransaction.payment_reference,
          },
          payment: {
            ...prevPayment,
            status: normalizedStatus,
            required: prev.payment?.required ?? false,
            gateway: String(payloadRecord.gateway || prev.payment?.gateway || ""),
          },
        } as ObjectStorageOrderSummary;
      });
    },
    [setLastOrderSummary]
  );

  return {
    isSubmitting,
    isGeneratingPayment,
    orderId,
    transactionId,
    accountIds,
    paymentRequired,
    paymentTransactionData,
    paymentOptions,
    isPaymentComplete,
    isPaymentFailed,
    transactionStatus,
    submitOrder,
    createOrder,
    handlePaymentCompleted,
    resetOrderState,
  };
};
