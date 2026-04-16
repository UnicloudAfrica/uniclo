import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useAuthStore from "@/stores/authStore";
import { toNumber } from "@/utils/instanceCreationUtils";
import logger from "@/utils/logger";

import type {
  PaymentGatewayOption,
  SavedCard,
  PaymentAccount,
  PaymentModeId,
  PaymentModeOption,
  ConfirmTransactionOptions,
  ConfirmTransactionPayload,
  ApiResponse,
  PricingSummaryData,
  PaymentModalProps,
} from "./types";
import {
  normalizeReference,
  isNumericReference,
  detectApiContext,
  getApiBaseUrlForContext,
  getApiPrefixForContext,
  resolveCardIdentifier,
} from "./paymentUtils";
import SavedCardSection from "./SavedCardSection";
import WalletPaymentSection from "./WalletPaymentSection";
import OrderItemsSection from "./OrderItemsSection";
import PaymentActions from "./PaymentActions";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentHeader from "./PaymentHeader";

/**
 * PaymentModal - Shared across Admin, Tenant, and Client dashboards
 *
 * Context-aware payment modal that auto-detects the current dashboard
 * and uses the appropriate API endpoint and cookie-based auth.
 * Following shared-components.md workflow.
 */

const PaymentModal = ({
  isOpen,
  onClose,
  transactionData,
  onPaymentComplete,
  mode = "modal",
  className = "",
  onPaymentOptionChange,
  apiBaseUrl: propApiBaseUrl,
  amount: propAmount,
  currency: propCurrency,
  email: propEmail,
  transactionReference: propTransactionReference,
  paymentOptions: propPaymentOptions,
  publicKey: propPublicKey,
  pricingSummary: propPricingSummary,
  enableWalletPayment = false,
  walletBalance: propWalletBalance,
}: PaymentModalProps) => {
  // Auto-detect context from URL
  const context = useMemo(() => detectApiContext(), []);
  const appPaths = useMemo(() => {
    if (context === "admin") {
      return {
        storage: "/admin-dashboard/object-storage",
        instances: "/admin-dashboard/cube-instances",
      };
    }
    if (context === "tenant") {
      return {
        storage: "/dashboard/object-storage",
        instances: "/dashboard/cube-instances",
      };
    }
    return {
      storage: "/client-dashboard/object-storage",
      instances: "/client-dashboard/cube-instances",
    };
  }, [context]);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const getAuthHeaders = useAuthStore((state) => state.getAuthHeaders);
  const user = useAuthStore((state) => state.user);
  const userEmail = useAuthStore((state) => state.userEmail);
  const authHeaders = useMemo(
    () =>
      typeof getAuthHeaders === "function"
        ? getAuthHeaders()
        : {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
    [getAuthHeaders]
  );

  const apiBaseUrl = propApiBaseUrl || getApiBaseUrlForContext(context);
  const apiPrefix = getApiPrefixForContext(context);
  const apiRoot = `${apiBaseUrl}${apiPrefix}`;
  const contextEmail = user?.email || userEmail || "";

  const isInline = mode === "inline";
  const [paymentStatus, setPaymentStatus] = useState<
    "pending" | "completed" | "failed" | "expired" | "processing"
  >("pending");
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<PaymentGatewayOption | null>(
    null
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [shouldSaveCard, setShouldSaveCard] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentModeId | null>(null);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [confirmedAccounts, setConfirmedAccounts] = useState<PaymentAccount[]>([]);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmAttemptsRef = useRef(0);

  // Wallet payment state
  const [walletBalance, setWalletBalance] = useState<number | null>(propWalletBalance ?? null);
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = useState(false);
  const [isWalletProcessing, setIsWalletProcessing] = useState(false);

  const transactionContext = transactionData?.data;
  const transaction = transactionContext?.transaction;
  const order = transactionContext?.order;
  const instances = transactionContext?.instances;
  const payment = transactionContext?.payment;
  const accounts = transactionContext?.accounts;
  const order_items = transactionContext?.order_items;
  const storageProfiles = Array.isArray(order?.storage_profiles)
    ? order.storage_profiles
    : Array.isArray(order_items)
      ? order_items
      : Array.isArray(order?.items)
        ? order.items
        : [];
  const isStorageOrder =
    (Array.isArray(storageProfiles) && storageProfiles.length > 0) ||
    (Array.isArray(accounts) && accounts.length > 0);

  // Extract first storage account ID for navigation after payment
  // Check confirmedAccounts first (set after payment completes), then top-level accounts
  const firstStorageAccountId =
    confirmedAccounts?.[0]?.id ||
    accounts?.[0]?.id ||
    order_items?.[0]?.account?.id ||
    storageProfiles?.[0]?.account?.id ||
    storageProfiles?.[0]?.account_id ||
    null;

  const paymentGatewayOptions = useMemo<PaymentGatewayOption[]>(() => {
    if (Array.isArray(propPaymentOptions)) {
      return propPaymentOptions;
    }
    if (Array.isArray(payment?.payment_gateway_options)) {
      return payment.payment_gateway_options;
    }
    return [];
  }, [propPaymentOptions, payment?.payment_gateway_options]);

  const [savedCards, setSavedCards] = useState<SavedCard[]>(
    Array.isArray(payment?.saved_cards) ? payment.saved_cards : []
  );

  const cardPaymentOptions = useMemo(
    () =>
      paymentGatewayOptions.filter((option) => {
        const type = (option.payment_type || "").toLowerCase();
        const name = (option.name || "").toLowerCase();
        return type.includes("card") || (!type && name.includes("card"));
      }),
    [paymentGatewayOptions]
  );

  const bankTransferOptions = useMemo(
    () =>
      paymentGatewayOptions.filter((option) => {
        const type = (option.payment_type || "").toLowerCase();
        const name = (option.name || "").toLowerCase();
        return (
          type.includes("bank") ||
          type.includes("transfer") ||
          (!type && (name.includes("bank") || name.includes("transfer")))
        );
      }),
    [paymentGatewayOptions]
  );

  const availablePaymentModes = useMemo<PaymentModeOption[]>(() => {
    const modes: PaymentModeOption[] = [];
    if (enableWalletPayment) {
      modes.unshift({ id: "wallet", label: "Pay with Wallet" });
    }
    if (cardPaymentOptions.length > 0) {
      modes.push({ id: "card", label: "Card Payment" });
    }
    if (bankTransferOptions.length > 0) {
      modes.push({ id: "bank_transfer", label: "Bank Transfer" });
    }
    if (savedCards.length > 0) {
      modes.push({ id: "saved_card", label: "Saved Cards" });
    }
    return modes;
  }, [enableWalletPayment, cardPaymentOptions, bankTransferOptions, savedCards]);

  const isPaystackCardOption =
    paymentMode === "card" &&
    (selectedPaymentOption?.payment_type || "").toLowerCase() === "card" &&
    (selectedPaymentOption?.name || "").toLowerCase().includes("paystack");

  const isActive = isInline ? !!transactionData || !!propAmount : isOpen;
  const shouldRender = isActive && (transactionData || propAmount);

  const optionReference = normalizeReference(selectedPaymentOption?.transaction_reference);
  const transactionReference = normalizeReference(
    transaction?.identifier ||
      transaction?.reference ||
      payment?.reference ||
      payment?.transaction_reference
  );
  const propReference = normalizeReference(propTransactionReference);

  const transactionIdentifier =
    optionReference ||
    transactionReference ||
    (propReference && !isNumericReference(propReference) ? propReference : null);
  const statusLookupIdentifier = transaction?.id || transactionIdentifier || propReference || null;
  const displayReference =
    transactionIdentifier ||
    propReference ||
    (transaction?.id != null ? String(transaction?.id) : null);

  const paystackEmail = useMemo(
    () =>
      propEmail ||
      transaction?.user?.email ||
      payment?.customer_context?.email ||
      contextEmail ||
      "",
    [propEmail, transaction?.user?.email, payment?.customer_context?.email, contextEmail]
  );
  const paystackPublicKey = useMemo(
    () =>
      propPublicKey ||
      selectedPaymentOption?.public_key ||
      selectedPaymentOption?.publicKey ||
      payment?.public_key ||
      import.meta.env.VITE_PAYSTACK_KEY ||
      "",
    [propPublicKey, selectedPaymentOption, payment?.public_key]
  );
  const isPaystackReady = Boolean(paystackPublicKey && paystackEmail && transactionIdentifier);

  useEffect(() => {
    setSavedCards(Array.isArray(payment?.saved_cards) ? payment.saved_cards : []);
  }, [payment?.saved_cards]);

  useEffect(() => {
    if (!transactionData && !propAmount) {
      setPaymentStatus("pending");
      setTimeRemaining(null);
    } else {
      setPaymentStatus("pending");
      setTimeRemaining(null);
    }
  }, [transactionData, propAmount]);

  // Initialize payment mode based on available options
  useEffect(() => {
    if (!shouldRender || availablePaymentModes.length === 0) {
      setPaymentMode(null);
      return;
    }
    setPaymentMode((prev) => {
      if (prev && availablePaymentModes.some((mode) => mode.id === prev)) {
        return prev;
      }
      return availablePaymentModes[0]?.id ?? null;
    });
  }, [shouldRender, availablePaymentModes]);

  // Sync selected payment option with active mode
  useEffect(() => {
    if (paymentMode === "card") {
      const currentId = selectedPaymentOption ? String(selectedPaymentOption.id) : null;
      const nextOption =
        cardPaymentOptions.find((option) => String(option.id) === currentId) ||
        cardPaymentOptions[0] ||
        null;
      if ((nextOption?.id ?? null) !== (selectedPaymentOption?.id ?? null)) {
        setSelectedPaymentOption(nextOption);
        onPaymentOptionChange?.(nextOption || null);
      }
    } else if (paymentMode === "bank_transfer") {
      const currentId = selectedPaymentOption ? String(selectedPaymentOption.id) : null;
      const nextOption =
        bankTransferOptions.find((option) => String(option.id) === currentId) ||
        bankTransferOptions[0] ||
        null;
      if ((nextOption?.id ?? null) !== (selectedPaymentOption?.id ?? null)) {
        setSelectedPaymentOption(nextOption);
        onPaymentOptionChange?.(nextOption || null);
      }
    } else {
      if (selectedPaymentOption !== null) {
        setSelectedPaymentOption(null);
        onPaymentOptionChange?.(null);
      }
    }
  }, [
    paymentMode,
    cardPaymentOptions,
    bankTransferOptions,
    selectedPaymentOption,
    onPaymentOptionChange,
  ]);

  const handleRemoveCard = useCallback(
    async (cardIdentifier: string) => {
      if (!cardIdentifier || !isAuthenticated) return;
      try {
        const cardsUrl = `${apiRoot}/cards/${cardIdentifier}`;

        const response = await fetch(cardsUrl, {
          method: "DELETE",
          headers: authHeaders,
          credentials: "include",
        });
        const payload = (await response.json().catch(() => ({}))) as ApiResponse;

        if (!response.ok || payload.success === false) {
          logger.error("Failed to remove card", payload);
          return;
        }

        setSavedCards((prev) =>
          prev.filter(
            (card, index) => resolveCardIdentifier(card, String(index)) !== cardIdentifier
          )
        );

        setSelectedSavedCard((prev) => (prev === cardIdentifier ? null : prev));
      } catch (error) {
        logger.error("Unable to remove card", error);
      }
    },
    [apiRoot, authHeaders, isAuthenticated]
  );

  const fetchSavedCards = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const cardsUrl = `${apiRoot}/cards`;

      const response = await fetch(cardsUrl, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const payload = (await response.json().catch(() => ({}))) as ApiResponse;

      if (!response.ok || payload.success === false) {
        logger.error("Failed to fetch saved cards", payload);
        return;
      }

      if (Array.isArray(payload.cards)) {
        setSavedCards(payload.cards);
      }
    } catch (error) {
      logger.error("Unable to fetch saved cards", error);
    }
  }, [apiRoot, authHeaders, isAuthenticated]);

  // Fetch wallet balance when wallet payment is enabled
  useEffect(() => {
    if (!enableWalletPayment || !isAuthenticated || propWalletBalance !== undefined) return;
    const fetchWalletBalance = async () => {
      setIsLoadingWalletBalance(true);
      try {
        // Wallet endpoint only exists in client context (/api/v1/business/wallet).
        // Always use the client base URL regardless of which dashboard we're in.
        const walletBaseUrl = getApiBaseUrlForContext("client");
        const walletUrl = `${walletBaseUrl}/business/wallet`;
        const response = await fetch(walletUrl, {
          method: "GET",
          headers: authHeaders,
          credentials: "include",
        });
        const payload = (await response.json().catch(() => ({}))) as ApiResponse;
        if (response.ok && payload.data) {
          const data = payload.data as Record<string, unknown>;
          setWalletBalance(Number(data.balance ?? data.available_balance ?? 0));
        }
      } catch (error) {
        logger.error("Unable to fetch wallet balance", error);
      } finally {
        setIsLoadingWalletBalance(false);
      }
    };
    fetchWalletBalance();
  }, [enableWalletPayment, isAuthenticated, apiRoot, authHeaders, propWalletBalance]);

  // Sync prop wallet balance
  useEffect(() => {
    if (propWalletBalance !== undefined) {
      setWalletBalance(propWalletBalance);
    }
  }, [propWalletBalance]);

  const handleWalletPayment = useCallback(async () => {
    if (!statusLookupIdentifier) return;
    setIsWalletProcessing(true);
    try {
      const confirmUrl = `${apiRoot}/transactions/${statusLookupIdentifier}`;
      const response = await fetch(confirmUrl, {
        method: "PUT",
        headers: authHeaders,
        credentials: "include",
        body: JSON.stringify({ payment_gateway: "Wallet" }),
      });
      const payload = (await response.json().catch(() => ({}))) as ApiResponse;
      if (response.ok && (payload.success !== false)) {
        setPaymentStatus("completed");
        onPaymentComplete?.(payload);
      } else {
        logger.error("Wallet payment failed", payload);
        setPaymentStatus("failed");
      }
    } catch (error) {
      logger.error("Wallet payment error", error);
      setPaymentStatus("failed");
    } finally {
      setIsWalletProcessing(false);
    }
  }, [apiRoot, authHeaders, statusLookupIdentifier, onPaymentComplete]);

  // Ensure saved card selection stays in sync with payload
  useEffect(() => {
    if (savedCards.length === 0) {
      setSelectedSavedCard(null);
      return;
    }
    setSelectedSavedCard((prev) => {
      const exists = savedCards.some((card, index) => {
        const identifier = resolveCardIdentifier(card, String(index));
        return identifier && identifier === prev;
      });
      if (exists) {
        return prev;
      }
      const first = savedCards[0];
      return resolveCardIdentifier(first, "0") || null;
    });
  }, [savedCards]);

  useEffect(() => {
    if (paymentMode !== "card" && shouldSaveCard) {
      setShouldSaveCard(false);
    }
  }, [paymentMode, shouldSaveCard]);

  // Calculate time remaining for payment
  useEffect(() => {
    const expiresAt = payment?.expires_at;
    if (!shouldRender || !expiresAt) {
      return undefined;
    }
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const remaining = expiry - now;

      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining(null);
        setPaymentStatus("expired");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [payment?.expires_at, shouldRender]);

  const resolvePaymentGateway = useCallback(() => {
    const option = selectedPaymentOption || paymentGatewayOptions[0];
    if (!option) {
      return null;
    }
    const baseName = (
      option.name ||
      option.gateway ||
      option.provider ||
      transaction?.payment_gateway ||
      payment?.gateway ||
      ""
    ).toString();
    if (!baseName) {
      return null;
    }
    const normalized = baseName.toLowerCase();
    if (normalized.includes("flutterwave")) return "Flutterwave";
    if (normalized.includes("fincra")) return "Fincra";
    if (normalized.includes("wallet")) return "Wallet";
    if (normalized.includes("paystack")) {
      if (option?.payment_type?.toLowerCase().includes("card")) {
        return "Paystack";
      }
      return "Paystack";
    }
    if (normalized.includes("virtual")) return "Virtual_Account";
    return baseName;
  }, [selectedPaymentOption, paymentGatewayOptions, transaction, payment]);

  const confirmTransaction = useCallback(
    async (options: ConfirmTransactionOptions = {}) => {
      if (!transactionIdentifier || !isAuthenticated || isConfirming) {
        return false;
      }

      const gateway = options.gatewayOverride || resolvePaymentGateway();
      if (!gateway) return false;

      const payload: ConfirmTransactionPayload = {
        payment_gateway: gateway,
        ...(options.body || {}),
      };

      const allowSaveCardDetails =
        options.includeSaveCardDetails ?? (gateway === "Paystack" && paymentMode === "card");

      if (allowSaveCardDetails) {
        payload.save_card_details = Boolean(shouldSaveCard);
      }

      setIsConfirming(true);
      try {
        logger.info("[PaymentModal] Confirming transaction", {
          transactionIdentifier,
          gateway,
          payload,
          apiBaseUrl: apiRoot,
        });
        const response = await fetch(`${apiRoot}/transactions/${transactionIdentifier}`, {
          method: "PUT",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const body = (await response.json().catch(() => ({}))) as ApiResponse<{
          status?: string;
          transaction?: { status?: string };
        }>;

        if (!response.ok) {
          logger.error("[PaymentModal] Failed to confirm transaction", {
            status: response.status,
            statusText: response.statusText,
            body,
          });
          return false;
        }

        const txStatus = (body.data?.status || body.status || body.data?.transaction?.status || "")
          .toString()
          .toLowerCase();
        const successStatuses = ["successful", "completed", "paid", "success", "approved"];
        const isSuccess = successStatuses.includes(txStatus);

        if (!isSuccess) {
          logger.info("[PaymentModal] Transaction not yet successful", { txStatus, body });
          return false;
        }

        logger.info("[PaymentModal] Transaction confirmed", { txStatus });
        return true;
      } catch (error) {
        logger.error("Failed to confirm transaction:", error);
        return false;
      } finally {
        setIsConfirming(false);
      }
    },
    [
      transactionIdentifier,
      apiRoot,
      resolvePaymentGateway,
      shouldSaveCard,
      paymentMode,
      isConfirming,
      isAuthenticated,
      authHeaders,
    ]
  );

  const handlePaymentCompletion = useCallback(
    (payload: unknown) => {
      setPaymentStatus("completed");
      onPaymentComplete?.(payload);
    },
    [onPaymentComplete]
  );

  const handleBankTransferConfirmation = useCallback(async () => {
    if (!selectedPaymentOption) return;
    logger.info("[PaymentModal] Bank transfer confirm clicked", {
      transactionIdentifier,
      selectedPaymentOption,
    });
    const success = await confirmTransaction();
    if (success) {
      setPaymentStatus("completed");
      onPaymentComplete?.({
        status: "successful",
        reference: selectedPaymentOption.transaction_reference || transactionIdentifier,
        channel: "bank_transfer",
      });
    } else {
      setPaymentStatus("failed");
    }
  }, [selectedPaymentOption, confirmTransaction, onPaymentComplete, transactionIdentifier]);

  const handleSavedCardPayment = useCallback(async () => {
    if (!selectedSavedCard) return;
    logger.info("[PaymentModal] Saved card payment clicked", {
      selectedSavedCard,
      transactionIdentifier,
    });
    const success = await confirmTransaction({
      gatewayOverride: "Paystack_Card",
      body: { card_identifier: selectedSavedCard },
      includeSaveCardDetails: false,
    });
    if (success) {
      setPaymentStatus("completed");
      onPaymentComplete?.({
        status: "successful",
        reference: transactionIdentifier,
        channel: "saved_card",
      });
    } else {
      setPaymentStatus("pending");
    }
  }, [selectedSavedCard, confirmTransaction, onPaymentComplete, transactionIdentifier]);

  const stopConfirmLoop = useCallback(() => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = null;
    }
    confirmAttemptsRef.current = 0;
  }, []);

  // Poll transaction status (manual or interval)
  const pollTransactionStatus = useCallback(async () => {
    const identifier = statusLookupIdentifier;
    if (!identifier || isPolling || !isAuthenticated) return;

    setIsPolling(true);
    try {
      const response = await fetch(`${apiRoot}/transactions/${identifier}/status`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as ApiResponse<{
        status?: string;
        accounts?: PaymentAccount[];
      }>;

      if (data.success && data.data) {
        if (data.data.status === "successful") {
          // Save accounts from the confirmed transaction
          if (data.data.accounts && Array.isArray(data.data.accounts)) {
            setConfirmedAccounts(data.data.accounts);
          }
          setPaymentStatus("completed");
          handlePaymentCompletion(data.data);
        } else if (data.data.status === "failed") {
          setPaymentStatus("failed");
        }
      }
    } catch (error) {
      logger.error("Failed to check transaction status:", error);
    } finally {
      setIsPolling(false);
    }
  }, [
    statusLookupIdentifier,
    isPolling,
    apiRoot,
    handlePaymentCompletion,
    isAuthenticated,
    authHeaders,
  ]);

  // Auto-poll every 10 seconds when modal is open and payment is pending
  useEffect(() => {
    if (!isActive || paymentStatus !== "pending" || !statusLookupIdentifier || !isAuthenticated) {
      return undefined;
    }
    const interval = setInterval(pollTransactionStatus, 10000);
    return () => clearInterval(interval);
  }, [isActive, paymentStatus, statusLookupIdentifier, isAuthenticated, pollTransactionStatus]);

  useEffect(() => {
    if (
      paymentStatus === "completed" ||
      paymentStatus === "failed" ||
      paymentStatus === "expired"
    ) {
      stopConfirmLoop();
    }
  }, [paymentStatus, stopConfirmLoop]);

  useEffect(
    () => () => {
      stopConfirmLoop();
    },
    [stopConfirmLoop]
  );

  const handlePaymentOptionChange = (optionId: string) => {
    const selectedId = String(optionId);
    const option = paymentGatewayOptions.find((opt) => String(opt.id) === selectedId) || null;
    setSelectedPaymentOption(option);
    onPaymentOptionChange?.(option || null);
  };

  useEffect(() => {
    if (!isPaystackCardOption && shouldSaveCard) {
      setShouldSaveCard(false);
    }
  }, [isPaystackCardOption, shouldSaveCard]);

  const activeOptionForAmounts =
    selectedPaymentOption ||
    cardPaymentOptions[0] ||
    bankTransferOptions[0] ||
    paymentGatewayOptions[0] ||
    null;

  const pricingSummary: PricingSummaryData = propPricingSummary ?? {};

  const amountDetails = useMemo(() => {
    const resolvedSubtotal = toNumber(
      pricingSummary.subtotal ??
        activeOptionForAmounts?.charge_breakdown?.base_amount ??
        activeOptionForAmounts?.subtotal ??
        0
    );
    const resolvedTax = toNumber(
      pricingSummary.tax ??
        activeOptionForAmounts?.charge_breakdown?.tax ??
        activeOptionForAmounts?.tax ??
        0
    );
    const fallbackEstimatedTotal = toNumber(
      pricingSummary.grandTotal ??
        propAmount ??
        activeOptionForAmounts?.charge_breakdown?.base_amount ??
        activeOptionForAmounts?.subtotal ??
        transaction?.amount ??
        0
    );
    const resolvedGatewayFees = toNumber(
      activeOptionForAmounts?.charge_breakdown?.total_fees ??
        activeOptionForAmounts?.fees ??
        pricingSummary.gatewayFees ??
        transaction?.third_party_fee ??
        transaction?.transaction_fee ??
        0
    );
    const estimatedTotal = resolvedSubtotal + resolvedTax;
    const estimatedTotalResolved = estimatedTotal > 0 ? estimatedTotal : fallbackEstimatedTotal;
    const gatewayTotal = toNumber(
      activeOptionForAmounts?.charge_breakdown?.grand_total ?? activeOptionForAmounts?.total ?? 0
    );
    const payableTotal =
      gatewayTotal > 0 ? gatewayTotal : estimatedTotalResolved + (resolvedGatewayFees || 0);
    const adjustment = estimatedTotalResolved > 0 ? payableTotal - estimatedTotalResolved : 0;
    const resolvedGrandTotal = gatewayTotal > 0 ? gatewayTotal : estimatedTotalResolved;
    const displayCurrency =
      pricingSummary.currency ||
      propCurrency ||
      activeOptionForAmounts?.currency ||
      transaction?.currency ||
      "USD";

    return {
      resolvedSubtotal,
      resolvedTax,
      resolvedGatewayFees,
      resolvedGrandTotal,
      estimatedTotalResolved,
      gatewayTotal,
      payableTotal,
      adjustment,
      displayCurrency,
    };
  }, [
    pricingSummary.currency,
    pricingSummary.gatewayFees,
    pricingSummary.grandTotal,
    pricingSummary.subtotal,
    pricingSummary.tax,
    propAmount,
    propCurrency,
    activeOptionForAmounts,
    transaction?.amount,
    transaction?.currency,
    transaction?.third_party_fee,
    transaction?.transaction_fee,
  ]);
  const displayPayableTotal =
    amountDetails.payableTotal > 0 ? amountDetails.payableTotal : amountDetails.resolvedGrandTotal;
  const hasAdjustment =
    Math.abs(amountDetails.adjustment) > 0.01 &&
    Math.abs(amountDetails.adjustment - amountDetails.resolvedGatewayFees) > 0.01;

  const paystackAmount = useMemo(() => {
    const total = Number(displayPayableTotal ?? 0);
    return Math.max(0, Math.round(total * 100));
  }, [displayPayableTotal]);
  const paystackReferenceProps = transactionIdentifier
    ? { reference: String(transactionIdentifier) }
    : {};

  const handleModalClose = () => {
    onClose?.();
  };

  if (!shouldRender) return null;

  const containerClasses = isInline
    ? `relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`
    : "relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all";

  const summaryGatewayLabel =
    paymentMode === "saved_card"
      ? "Paystack"
      : selectedPaymentOption?.name || activeOptionForAmounts?.name || "Paystack";
  const summaryMethodLabel =
    paymentMode === "saved_card"
      ? "Saved Card"
      : paymentMode === "bank_transfer"
        ? "Bank Transfer"
        : selectedPaymentOption?.payment_type || activeOptionForAmounts?.payment_type || "Card";
  const summaryReference =
    paymentMode === "saved_card"
      ? transactionIdentifier || "Generating..."
      : selectedPaymentOption?.transaction_reference ||
        activeOptionForAmounts?.transaction_reference ||
        "Generating...";
  const hasPricingSummary = Boolean(
    pricingSummary.subtotal ||
    pricingSummary.tax ||
    pricingSummary.gatewayFees ||
    pricingSummary.grandTotal ||
    activeOptionForAmounts?.charge_breakdown
  );
  const showPricingBreakdown = hasPricingSummary && amountDetails.payableTotal > 0;
  const currentSelectableOptions =
    paymentMode === "card"
      ? cardPaymentOptions
      : paymentMode === "bank_transfer"
        ? bankTransferOptions
        : [];

  const bodyContent = (
    <div className={`px-6 py-6 ${isInline ? "" : "max-h-[28rem] overflow-y-auto"}`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PaymentMethodSelector
          paymentStatus={paymentStatus}
          paymentMode={paymentMode}
          setPaymentMode={setPaymentMode}
          availablePaymentModes={availablePaymentModes}
          amountDetails={amountDetails}
          displayPayableTotal={displayPayableTotal}
          hasAdjustment={hasAdjustment}
          showPricingBreakdown={showPricingBreakdown}
          summaryGatewayLabel={summaryGatewayLabel}
          summaryMethodLabel={summaryMethodLabel}
          summaryReference={summaryReference}
          currentSelectableOptions={currentSelectableOptions}
          selectedPaymentOption={selectedPaymentOption}
          onPaymentOptionChange={handlePaymentOptionChange}
          isPaystackCardOption={isPaystackCardOption}
          shouldSaveCard={shouldSaveCard}
          onShouldSaveCardChange={setShouldSaveCard}
        />
      </div>

      {paymentMode === "saved_card" && savedCards.length > 0 && (
        <SavedCardSection
          savedCards={savedCards}
          selectedSavedCard={selectedSavedCard}
          onSelectCard={setSelectedSavedCard}
          onRemoveCard={handleRemoveCard}
        />
      )}

      {paymentMode === "wallet" && (
        <WalletPaymentSection
          walletBalance={walletBalance}
          isLoadingBalance={isLoadingWalletBalance}
          payableAmount={displayPayableTotal}
          currency={amountDetails.displayCurrency}
          hasSufficientFunds={(walletBalance ?? 0) >= displayPayableTotal}
          isProcessing={isWalletProcessing}
          onPayWithWallet={handleWalletPayment}
        />
      )}

      <OrderItemsSection storageProfiles={storageProfiles} instances={instances} />

      <PaymentActions
        paymentStatus={paymentStatus}
        setPaymentStatus={setPaymentStatus}
        paymentMode={paymentMode}
        selectedPaymentOption={selectedPaymentOption}
        isPaystackCardOption={isPaystackCardOption}
        isPaystackReady={isPaystackReady}
        paystackEmail={paystackEmail}
        paystackAmount={paystackAmount}
        paystackPublicKey={paystackPublicKey}
        paystackReferenceProps={paystackReferenceProps}
        transactionIdentifier={transactionIdentifier}
        isConfirming={isConfirming}
        isPolling={isPolling}
        isStorageOrder={isStorageOrder}
        firstStorageAccountId={firstStorageAccountId}
        savedCards={savedCards}
        selectedSavedCard={selectedSavedCard}
        appPaths={appPaths}
        pollTransactionStatus={pollTransactionStatus}
        handleBankTransferConfirmation={handleBankTransferConfirmation}
        handleSavedCardPayment={handleSavedCardPayment}
        handleModalClose={handleModalClose}
        confirmTransaction={confirmTransaction}
        fetchSavedCards={fetchSavedCards}
        handlePaymentCompletion={handlePaymentCompletion}
      />
    </div>
  );

  const cardContent = (
    <div className={containerClasses} style={isInline ? {} : { maxHeight: "90vh" }}>
      <PaymentHeader
        paymentStatus={paymentStatus}
        paymentMode={paymentMode}
        displayReference={displayReference}
        isInline={isInline}
        timeRemaining={timeRemaining}
        onClose={handleModalClose}
      />
      {bodyContent}
    </div>
  );

  if (isInline) {
    return cardContent;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={paymentStatus !== "completed" ? handleModalClose : undefined}
      />
      <div className="flex min-h-full items-center justify-center p-4">{cardContent}</div>
    </div>
  );
};

export default PaymentModal;
