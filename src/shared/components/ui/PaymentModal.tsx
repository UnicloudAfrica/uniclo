import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  X,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Server,
  DollarSign,
  Trash2,
} from "lucide-react";
import { designTokens } from "../../../styles/designTokens";
import config from "../../../config";
import useAdminAuthStore from "../../../stores/adminAuthStore";
import useTenantAuthStore from "../../../stores/tenantAuthStore";
import useClientAuthStore from "../../../stores/clientAuthStore";
import { PaystackButton } from "react-paystack";
import { formatCurrencyValue, toNumber } from "../../../utils/instanceCreationUtils";

/**
 * PaymentModal - Shared across Admin, Tenant, and Client dashboards
 *
 * Context-aware payment modal that auto-detects the current dashboard
 * and uses the appropriate API endpoint and cookie-based auth.
 * Following shared-components.md workflow.
 */

type ApiContext = "admin" | "tenant" | "client";

const normalizeReference = (value: any) => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isNumericReference = (value: string | null) => {
  if (!value) return false;
  return /^\d+$/.test(value);
};

// Detect API context from URL
const detectApiContext = (): ApiContext => {
  if (typeof window === "undefined") return "client";
  const path = window.location.pathname;
  if (path.startsWith("/admin-dashboard") || path.startsWith("/admin")) return "admin";
  if (path.startsWith("/dashboard")) return "tenant";
  return "client";
};

// Get API base URL for context
const getApiBaseUrlForContext = (context: ApiContext): string => {
  switch (context) {
    case "admin":
      return config.adminURL;
    case "tenant":
      return config.tenantURL;
    case "client":
    default:
      return config.baseURL;
  }
};

const resolveCardIdentifier = (card: any, fallback = "") => {
  if (!card) return fallback;
  if (card.identifier) return card.identifier;
  if (card.id !== undefined && card.id !== null) return String(card.id);
  return fallback;
};

interface PricingSummaryData {
  subtotal?: number;
  tax?: number;
  gatewayFees?: number;
  grandTotal?: number;
  currency?: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData?: any;
  onPaymentComplete?: (payload: any) => void;
  mode?: "modal" | "inline";
  className?: string;
  onPaymentOptionChange?: (option: any) => void;
  apiBaseUrl?: string;
  amount?: number;
  currency?: string;
  email?: string;
  transactionReference?: string;
  paymentOptions?: any[];
  publicKey?: string;
  pricingSummary?: PricingSummaryData;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
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
}) => {
  // Auto-detect context from URL
  const context = useMemo(() => detectApiContext(), []);
  const appPaths = useMemo(() => {
    if (context === "admin") {
      return {
        storage: "/admin-dashboard/object-storage",
        instances: "/admin-dashboard/instances",
      };
    }
    if (context === "tenant") {
      return {
        storage: "/dashboard/object-storage",
        instances: "/dashboard/instances",
      };
    }
    return {
      storage: "/client-dashboard/object-storage",
      instances: "/client-dashboard/instances",
    };
  }, [context]);

  const adminIsAuthenticated = useAdminAuthStore((state) => state.isAuthenticated);
  const adminGetAuthHeaders = useAdminAuthStore((state) => state.getAuthHeaders);
  const adminUser = useAdminAuthStore((state) => state.user);
  const adminUserEmail = useAdminAuthStore((state) => state.userEmail);

  const tenantIsAuthenticated = useTenantAuthStore((state) => state.isAuthenticated);
  const tenantGetAuthHeaders = useTenantAuthStore((state) => state.getAuthHeaders);
  const tenantUser = useTenantAuthStore((state) => state.user);

  const clientIsAuthenticated = useClientAuthStore((state) => state.isAuthenticated);
  const clientGetAuthHeaders = useClientAuthStore((state) => state.getAuthHeaders);
  const clientUser = useClientAuthStore((state) => state.user);

  const isAuthenticated =
    context === "admin"
      ? Boolean(adminIsAuthenticated)
      : context === "tenant"
        ? Boolean(tenantIsAuthenticated)
        : Boolean(clientIsAuthenticated);
  const getAuthHeaders =
    context === "admin"
      ? adminGetAuthHeaders
      : context === "tenant"
        ? tenantGetAuthHeaders
        : clientGetAuthHeaders;
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
  const contextEmail =
    context === "admin"
      ? adminUser?.email || adminUserEmail || ""
      : context === "tenant"
        ? tenantUser?.email || ""
        : clientUser?.email || "";

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
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [shouldSaveCard, setShouldSaveCard] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string | null>(null);
  const [selectedSavedCard, setSelectedSavedCard] = useState<string | null>(null);
  const [confirmedAccounts, setConfirmedAccounts] = useState<any[]>([]);
  const hasTriggeredConfirmRef = useRef(false);
  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmAttemptsRef = useRef(0);

  const { transaction, order, instances, payment, accounts, order_items } =
    transactionData?.data || {};
  const storageProfiles = order?.storage_profiles || order_items || order?.items || [];
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

  const paymentGatewayOptions = propPaymentOptions || payment?.payment_gateway_options || [];

  const [savedCards, setSavedCards] = useState<any[]>(
    Array.isArray(payment?.saved_cards) ? payment.saved_cards : []
  );

  const cardPaymentOptions = useMemo(
    () =>
      paymentGatewayOptions.filter((option: any) => {
        const type = (option.payment_type || "").toLowerCase();
        const name = (option.name || "").toLowerCase();
        return type.includes("card") || (!type && name.includes("card"));
      }),
    [paymentGatewayOptions]
  );

  const bankTransferOptions = useMemo(
    () =>
      paymentGatewayOptions.filter((option: any) => {
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

  const availablePaymentModes = useMemo(() => {
    const modes = [];
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
  }, [cardPaymentOptions, bankTransferOptions, savedCards]);

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
      return availablePaymentModes[0].id;
    });
  }, [shouldRender, availablePaymentModes]);

  // Sync selected payment option with active mode
  useEffect(() => {
    if (paymentMode === "card") {
      const currentId = selectedPaymentOption ? String(selectedPaymentOption.id) : null;
      const nextOption =
        cardPaymentOptions.find((option: any) => String(option.id) === currentId) ||
        cardPaymentOptions[0] ||
        null;
      if ((nextOption?.id ?? null) !== (selectedPaymentOption?.id ?? null)) {
        setSelectedPaymentOption(nextOption);
        onPaymentOptionChange?.(nextOption || null);
      }
    } else if (paymentMode === "bank_transfer") {
      const currentId = selectedPaymentOption ? String(selectedPaymentOption.id) : null;
      const nextOption =
        bankTransferOptions.find((option: any) => String(option.id) === currentId) ||
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
        const cardsUrl =
          apiBaseUrl.includes("/admin") || apiBaseUrl.includes("/tenant")
            ? `${apiBaseUrl}/cards/${cardIdentifier}`
            : `${apiBaseUrl}/business/cards/${cardIdentifier}`;

        const response = await fetch(cardsUrl, {
          method: "DELETE",
          headers: authHeaders,
          credentials: "include",
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok || payload?.success === false) {
          console.error("Failed to remove card", payload);
          return;
        }

        setSavedCards((prev) =>
          prev.filter(
            (card, index) => resolveCardIdentifier(card, String(index)) !== cardIdentifier
          )
        );

        setSelectedSavedCard((prev) => (prev === cardIdentifier ? null : prev));
      } catch (error) {
        console.error("Unable to remove card", error);
      }
    },
    [apiBaseUrl, authHeaders, isAuthenticated]
  );

  const fetchSavedCards = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const cardsUrl =
        apiBaseUrl.includes("/admin") || apiBaseUrl.includes("/tenant")
          ? `${apiBaseUrl}/cards`
          : `${apiBaseUrl}/business/cards`;

      const response = await fetch(cardsUrl, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok || payload?.success === false) {
        console.error("Failed to fetch saved cards", payload);
        return;
      }

      if (Array.isArray(payload.cards)) {
        setSavedCards(payload.cards);
      }
    } catch (error) {
      console.error("Unable to fetch saved cards", error);
    }
  }, [apiBaseUrl, authHeaders, isAuthenticated]);

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
    if (shouldRender && payment?.expires_at) {
      const updateCountdown = () => {
        const now = new Date().getTime();
        const expiry = new Date(payment.expires_at).getTime();
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
    }
  }, [payment?.expires_at, shouldRender]);

  const resolvePaymentGateway = useCallback(() => {
    const option = selectedPaymentOption || paymentGatewayOptions[0] || {};
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
    async (options: any = {}) => {
      if (!transactionIdentifier || !isAuthenticated || isConfirming) {
        return false;
      }

      const gateway = options.gatewayOverride || resolvePaymentGateway();
      if (!gateway) return false;

      const payload: any = {
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
        console.info("[PaymentModal] Confirming transaction", {
          transactionIdentifier,
          gateway,
          payload,
          apiBaseUrl,
        });
        const response = await fetch(`${apiBaseUrl}/transactions/${transactionIdentifier}`, {
          method: "PUT",
          headers: authHeaders,
          credentials: "include",
          body: JSON.stringify(payload),
        });

        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          console.error("[PaymentModal] Failed to confirm transaction", {
            status: response.status,
            statusText: response.statusText,
            body,
          });
          return false;
        }

        const txStatus = (
          body?.data?.status ||
          body?.status ||
          body?.data?.transaction?.status ||
          ""
        )
          .toString()
          .toLowerCase();
        const successStatuses = ["successful", "completed", "paid", "success", "approved"];
        const isSuccess = successStatuses.includes(txStatus);

        if (!isSuccess) {
          console.info("[PaymentModal] Transaction not yet successful", { txStatus, body });
          return false;
        }

        console.info("[PaymentModal] Transaction confirmed", { txStatus });
        return true;
      } catch (error) {
        console.error("Failed to confirm transaction:", error);
        return false;
      } finally {
        setIsConfirming(false);
      }
    },
    [
      transactionIdentifier,
      apiBaseUrl,
      resolvePaymentGateway,
      shouldSaveCard,
      paymentMode,
      isConfirming,
      isAuthenticated,
      authHeaders,
    ]
  );

  const handlePaymentCompletion = useCallback(
    (payload: any) => {
      setPaymentStatus("completed");
      onPaymentComplete?.(payload);
    },
    [onPaymentComplete]
  );

  const handleBankTransferConfirmation = useCallback(async () => {
    if (!selectedPaymentOption) return;
    console.info("[PaymentModal] Bank transfer confirm clicked", {
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
    console.info("[PaymentModal] Saved card payment clicked", {
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

  const scheduleConfirmLoop = useCallback(() => {
    stopConfirmLoop();
    confirmAttemptsRef.current = 0;

    const attemptConfirm = async () => {
      confirmAttemptsRef.current += 1;
      console.info("[PaymentModal] Scheduled confirm attempt", {
        attempt: confirmAttemptsRef.current,
        transactionIdentifier,
      });

      const confirmed = await confirmTransaction({
        gatewayOverride: "Paystack",
        includeSaveCardDetails: true,
      });

      if (confirmed) {
        await fetchSavedCards();
        handlePaymentCompletion({ channel: "card", reference: transactionIdentifier });
        stopConfirmLoop();
        return;
      }

      if (confirmAttemptsRef.current < 6) {
        confirmTimerRef.current = setTimeout(attemptConfirm, 5000);
      } else {
        stopConfirmLoop();
      }
    };

    attemptConfirm();
  }, [
    confirmTransaction,
    fetchSavedCards,
    handlePaymentCompletion,
    stopConfirmLoop,
    transactionIdentifier,
  ]);

  // Poll transaction status (manual or interval)
  const pollTransactionStatus = useCallback(async () => {
    const identifier = statusLookupIdentifier;
    if (!identifier || isPolling || !isAuthenticated) return;

    setIsPolling(true);
    try {
      const response = await fetch(`${apiBaseUrl}/transactions/${identifier}/status`, {
        method: "GET",
        headers: authHeaders,
        credentials: "include",
      });
      const data = await response.json();

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
      console.error("Failed to check transaction status:", error);
    } finally {
      setIsPolling(false);
    }
  }, [
    statusLookupIdentifier,
    isPolling,
    apiBaseUrl,
    confirmTransaction,
    handlePaymentCompletion,
    isAuthenticated,
    authHeaders,
  ]);

  // Auto-poll every 10 seconds when modal is open and payment is pending
  useEffect(() => {
    if (isActive && paymentStatus === "pending" && statusLookupIdentifier && isAuthenticated) {
      const interval = setInterval(pollTransactionStatus, 10000);
      return () => clearInterval(interval);
    }
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
    const option = paymentGatewayOptions.find((opt: any) => String(opt.id) === selectedId) || null;
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

  const pricingSummary = propPricingSummary || {};

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
    const resolvedGatewayFees = toNumber(
      pricingSummary.gatewayFees ??
        activeOptionForAmounts?.charge_breakdown?.total_fees ??
        activeOptionForAmounts?.fees ??
        transaction?.third_party_fee ??
        transaction?.transaction_fee ??
        0
    );
    const resolvedGrandTotal = toNumber(
      pricingSummary.grandTotal ??
        propAmount ??
        activeOptionForAmounts?.charge_breakdown?.grand_total ??
        activeOptionForAmounts?.total ??
        transaction?.amount ??
        0
    );
    const estimatedTotal = resolvedSubtotal + resolvedTax;
    const estimatedTotalResolved = estimatedTotal > 0 ? estimatedTotal : resolvedGrandTotal;
    const gatewayTotal = toNumber(
      activeOptionForAmounts?.charge_breakdown?.grand_total ?? activeOptionForAmounts?.total ?? 0
    );
    const payableTotal =
      gatewayTotal > 0 ? gatewayTotal : estimatedTotalResolved + (resolvedGatewayFees || 0);
    const adjustment = estimatedTotalResolved > 0 ? payableTotal - estimatedTotalResolved : 0;
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
    propPricingSummary,
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
  const hasAdjustment = Math.abs(amountDetails.adjustment) > 0.01;

  const paystackAmount = useMemo(() => {
    const total = Number(displayPayableTotal ?? 0);
    return Math.max(0, Math.round(total * 100));
  }, [displayPayableTotal]);

  const handleModalClose = () => {
    onClose?.();
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "completed":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "failed":
      case "expired":
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Clock className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "completed":
        return "Payment completed! Your instances are being provisioned and will be available shortly.";
      case "failed":
        return "Payment failed. Please try again or contact support.";
      case "expired":
        return "Payment link has expired. Please create a new order.";
      case "processing":
        return "Payment is processing. We will update the status once confirmation returns.";
      default:
        return paymentMode === "card"
          ? "Pay with card to complete your order. Status updates after confirmation."
          : "Complete your payment to proceed with instance provisioning.";
    }
  };

  const statusBadgeColor = useMemo(() => {
    const successBg = designTokens?.colors?.success?.[100] || "#e6f4ea";
    const successText = designTokens?.colors?.success?.[700] || "#256c3b";
    const dangerBg = designTokens?.colors?.error?.[100] || "#fdecea";
    const dangerText = designTokens?.colors?.error?.[700] || "#b91c1c";
    const warningBg = designTokens?.colors?.warning?.[100] || "#fff7e6";
    const warningText = designTokens?.colors?.warning?.[700] || "#92400e";
    const neutralBg = designTokens?.colors?.neutral?.[100] || "#f1f5f9";
    const neutralText = designTokens?.colors?.neutral?.[700] || "#334155";

    if (paymentStatus === "completed") {
      return { bg: successBg, text: successText, label: "Completed" };
    }
    if (paymentStatus === "failed") {
      return { bg: dangerBg, text: dangerText, label: "Failed" };
    }
    if (paymentStatus === "processing") {
      return { bg: warningBg, text: warningText, label: "Processing" };
    }
    return { bg: neutralBg, text: neutralText, label: "Pending" };
  }, [paymentStatus]);

  if (!shouldRender) return null;

  const containerClasses = isInline
    ? `relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`
    : "relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all";

  const headerContent = (
    <div
      className="flex items-center justify-between px-6 py-4 border-b"
      style={{ borderColor: designTokens.colors.neutral[200] }}
    >
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div>
          <h3 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
            {paymentStatus === "completed" ? "Payment Successful!" : "Complete Payment"}
          </h3>
          <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
            Transaction #{displayReference || "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: statusBadgeColor.bg,
            color: statusBadgeColor.text,
          }}
        >
          {statusBadgeColor.label}
        </span>
        {!isInline && paymentStatus !== "completed" && (
          <button
            onClick={handleModalClose}
            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
            style={{ color: designTokens.colors.neutral[500] }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );

  const statusBanner = (
    <div
      className="px-6 py-4 border-b"
      style={{
        backgroundColor:
          paymentStatus === "completed"
            ? designTokens.colors.success[50]
            : designTokens.colors.neutral[50],
        borderColor: designTokens.colors.neutral[200],
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className="text-sm font-medium"
          style={{
            color:
              paymentStatus === "completed"
                ? designTokens.colors.success[700]
                : designTokens.colors.neutral[700],
          }}
        >
          {getStatusMessage()}
        </p>
        {timeRemaining && paymentStatus === "pending" && (
          <div className="text-sm font-medium" style={{ color: designTokens.colors.warning[600] }}>
            Expires in {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
          </div>
        )}
      </div>
    </div>
  );

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
        <div className="space-y-4">
          {paymentStatus !== "completed" && availablePaymentModes.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                Choose how you want to pay
              </p>
              <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                {availablePaymentModes.map((mode) => {
                  const isActiveMode = paymentMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id)}
                      className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                        isActiveMode
                          ? "shadow-sm"
                          : "hover:border-primary-300 hover:text-primary-700"
                      }`}
                      style={{
                        borderColor: isActiveMode
                          ? designTokens.colors.primary[500]
                          : designTokens.colors.neutral[200],
                        backgroundColor: isActiveMode
                          ? designTokens.colors.primary[500]
                          : designTokens.colors.neutral[0],
                        color: isActiveMode
                          ? designTokens.colors.neutral[0]
                          : designTokens.colors.neutral[700],
                      }}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <h4
            className="flex items-center font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Payment Details
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span style={{ color: designTokens.colors.neutral[600] }}>Total payable:</span>
              <span
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                {amountDetails.displayCurrency} {formatCurrencyValue(displayPayableTotal)}
              </span>
            </div>
            {showPricingBreakdown && (
              <div
                className="space-y-2 rounded-lg border px-3 py-2 text-xs"
                style={{
                  borderColor: designTokens.colors.neutral[200],
                  backgroundColor: designTokens.colors.neutral[50],
                }}
              >
                {amountDetails.resolvedSubtotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Subtotal</span>
                    <span style={{ color: designTokens.colors.neutral[900] }}>
                      {amountDetails.displayCurrency}{" "}
                      {formatCurrencyValue(amountDetails.resolvedSubtotal)}
                    </span>
                  </div>
                )}
                {amountDetails.resolvedTax > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Estimated tax</span>
                    <span style={{ color: designTokens.colors.neutral[900] }}>
                      {amountDetails.displayCurrency}{" "}
                      {formatCurrencyValue(amountDetails.resolvedTax)}
                    </span>
                  </div>
                )}
                {amountDetails.estimatedTotalResolved > 0 &&
                  (amountDetails.resolvedSubtotal > 0 || amountDetails.resolvedTax > 0) && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span style={{ color: designTokens.colors.neutral[500] }}>
                        Estimated total
                      </span>
                      <span style={{ color: designTokens.colors.neutral[600] }}>
                        {amountDetails.displayCurrency}{" "}
                        {formatCurrencyValue(amountDetails.estimatedTotalResolved)}
                      </span>
                    </div>
                  )}
                {amountDetails.resolvedGatewayFees > 0 && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: designTokens.colors.neutral[600] }}>Gateway fees</span>
                    <span style={{ color: designTokens.colors.neutral[900] }}>
                      {amountDetails.displayCurrency}{" "}
                      {formatCurrencyValue(amountDetails.resolvedGatewayFees)}
                    </span>
                  </div>
                )}
                {hasAdjustment && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: designTokens.colors.neutral[600] }}>
                      Gateway adjustment
                    </span>
                    <span
                      style={{
                        color:
                          amountDetails.adjustment > 0
                            ? designTokens.colors.warning[700]
                            : designTokens.colors.success[700],
                      }}
                    >
                      {amountDetails.displayCurrency}{" "}
                      {formatCurrencyValue(amountDetails.adjustment)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t pt-2">
                  <span
                    className="font-semibold"
                    style={{ color: designTokens.colors.neutral[700] }}
                  >
                    Total payable
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: designTokens.colors.neutral[900] }}
                  >
                    {amountDetails.displayCurrency} {formatCurrencyValue(displayPayableTotal)}
                  </span>
                </div>
              </div>
            )}
            {showPricingBreakdown && hasAdjustment && (
              <p className="text-[11px]" style={{ color: designTokens.colors.neutral[500] }}>
                Gateway total is {amountDetails.adjustment > 0 ? "higher" : "lower"} than the
                estimate by {amountDetails.displayCurrency}{" "}
                {formatCurrencyValue(Math.abs(amountDetails.adjustment))}.
              </p>
            )}
            <div className="flex items-center justify-between">
              <span style={{ color: designTokens.colors.neutral[600] }}>Gateway:</span>
              <span
                className="rounded px-2 py-1 text-xs font-medium capitalize"
                style={{
                  backgroundColor: designTokens.colors.primary[100],
                  color: designTokens.colors.primary[800],
                }}
              >
                {summaryGatewayLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: designTokens.colors.neutral[600] }}>Method:</span>
              <span
                className="rounded px-2 py-1 text-xs font-medium"
                style={{
                  backgroundColor: designTokens.colors.success[100],
                  color: designTokens.colors.success[700],
                }}
              >
                {summaryMethodLabel}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: designTokens.colors.neutral[600] }}>Reference:</span>
              <span
                className="rounded px-2 py-1 font-mono text-xs"
                style={{
                  backgroundColor: designTokens.colors.neutral[100],
                  color: designTokens.colors.neutral[700],
                }}
              >
                {summaryReference}
              </span>
            </div>

            {currentSelectableOptions.length > 1 && paymentMode !== "saved_card" && (
              <div className="col-span-full">
                <label
                  className="mb-2 block text-xs font-medium"
                  style={{ color: designTokens.colors.neutral[700] }}
                >
                  {paymentMode === "bank_transfer" ? "Bank Account" : "Payment Method"}
                </label>
                <select
                  value={selectedPaymentOption?.id || ""}
                  onChange={(e) => handlePaymentOptionChange(e.target.value)}
                  className="w-full rounded border px-2 py-1 text-xs"
                  style={{
                    borderColor: designTokens.colors.neutral[300],
                    backgroundColor: designTokens.colors.neutral[0],
                  }}
                >
                  {currentSelectableOptions.map((option: any) => (
                    <option key={option.id} value={option.id}>
                      {option.name} ({option.payment_type})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {paymentStatus !== "completed" && paymentMode === "card" && isPaystackCardOption && (
            <div
              className="mt-3 flex items-start gap-3 rounded-xl border px-3 py-2"
              style={{
                borderColor: designTokens.colors.primary[100],
                backgroundColor: designTokens.colors.primary[50],
              }}
            >
              <input
                id="save-card-toggle"
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={shouldSaveCard}
                onChange={(event) => setShouldSaveCard(event.target.checked)}
              />
              <label
                htmlFor="save-card-toggle"
                className="flex flex-col text-sm"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                <span className="font-semibold">Save this card</span>
                <span className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                  Faster checkout next time; we only save the authorization token, not your PAN.
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {paymentMode === "saved_card" && savedCards.length > 0 && (
        <div
          className="mt-6 space-y-3 rounded-2xl border border-dashed px-4 py-4"
          style={{
            borderColor: designTokens.colors.neutral[200],
            backgroundColor: designTokens.colors.neutral[50],
          }}
        >
          <div
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <CreditCard className="h-4 w-4" />
            Choose a saved card
          </div>
          <div className="space-y-2">
            {savedCards.map((card, index) => {
              const identifier = resolveCardIdentifier(card, String(index));
              const isSelectedCard = identifier === selectedSavedCard;
              return (
                <label
                  key={identifier}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                    isSelectedCard ? "shadow-sm" : ""
                  }`}
                  style={{
                    borderColor: isSelectedCard
                      ? designTokens.colors.primary[500]
                      : designTokens.colors.neutral[200],
                    backgroundColor: isSelectedCard
                      ? designTokens.colors.primary[50]
                      : designTokens.colors.neutral[0],
                  }}
                >
                  <div>
                    <p
                      className="font-semibold"
                      style={{ color: designTokens.colors.neutral[900] }}
                    >
                      {(card.card_type || "Card").toUpperCase()} •••• {card.last4 || "----"}
                    </p>
                    <p className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                      Expires {card.exp_month}/{card.exp_year}
                      {card.bank ? ` · ${card.bank}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold uppercase"
                      style={{ color: designTokens.colors.neutral[500] }}
                    >
                      {card.payment_gateway || "Paystack"}
                    </span>
                    <input
                      type="radio"
                      className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
                      checked={isSelectedCard}
                      onChange={() => setSelectedSavedCard(identifier)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(identifier)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </span>
                    </button>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {storageProfiles.length > 0 && (
        <div className="space-y-4">
          <h4
            className="flex items-center font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <Server className="mr-2 h-5 w-5" />
            Storage profiles ({storageProfiles.length})
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {storageProfiles.map((profile: any, index: number) => (
              <div
                key={profile.id || index}
                className="rounded-lg p-3 text-sm"
                style={{ backgroundColor: designTokens.colors.neutral[50] }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>
                    {profile.name ||
                      profile.tierName ||
                      profile.tier_key ||
                      profile.tierKey ||
                      `Storage line ${index + 1}`}
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs"
                    style={{
                      backgroundColor: designTokens.colors.primary[100],
                      color: designTokens.colors.primary[800],
                    }}
                  >
                    {profile.region || profile.regionLabel || "Region"} • {profile.currency || ""}
                  </span>
                </div>
                <div className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                  {profile.months ? `${profile.months} month term` : "Object storage"} •{" "}
                  {profile.subtotal
                    ? `Total ${(profile.currency || "").toUpperCase()} ${Number(profile.subtotal).toLocaleString()}`
                    : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {instances?.length > 0 && (
        <div className="space-y-4">
          <h4
            className="flex items-center font-semibold"
            style={{ color: designTokens.colors.neutral[900] }}
          >
            <Server className="mr-2 h-5 w-5" />
            Instances ({instances?.length || 0})
          </h4>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {instances?.map((instance: any, index: number) => (
              <div
                key={instance.id}
                className="rounded-lg p-3 text-sm"
                style={{ backgroundColor: designTokens.colors.neutral[50] }}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>
                    {instance.name || `Instance ${index + 1}`}
                  </span>
                  <span
                    className="rounded px-2 py-1 text-xs"
                    style={{
                      backgroundColor: designTokens.colors.primary[100],
                      color: designTokens.colors.primary[800],
                    }}
                  >
                    {instance.provider} • {instance.region}
                  </span>
                </div>
                <div className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                  Status: <span className="font-medium">{instance.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className="mt-6 flex items-center justify-between rounded-xl border border-t px-6 py-4"
        style={{
          backgroundColor: designTokens.colors.neutral[50],
          borderColor: designTokens.colors.neutral[200],
        }}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={pollTransactionStatus}
            disabled={isPolling}
            className="flex items-center text-sm transition-colors hover:text-blue-600"
            style={{ color: designTokens.colors.neutral[600] }}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isPolling ? "animate-spin" : ""}`} />
            {isPolling ? "Checking..." : "Check Status"}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {paymentMode === "card" && selectedPaymentOption && paymentStatus !== "completed" && (
            <div className="flex flex-col items-end gap-2">
              {!isPaystackReady && (
                <p className="text-xs text-amber-600">
                  Paystack public key, customer email, or transaction reference is missing. Check
                  your payment gateway settings.
                </p>
              )}
              <PaystackButton
                email={paystackEmail}
                amount={paystackAmount}
                reference={transactionIdentifier || undefined}
                publicKey={paystackPublicKey}
                text={paymentStatus === "processing" ? "Processing…" : "Pay with Card"}
                className="w-full inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70 bg-[#2563eb] border border-[#2563eb] min-h-[48px]"
                disabled={!isPaystackReady}
                onSuccess={async (response: any) => {
                  console.info("[Paystack][Admin] PaystackButton success", response);
                  setPaymentStatus("processing");
                  const confirmed = await confirmTransaction({
                    gatewayOverride: "Paystack",
                    includeSaveCardDetails: true,
                  });
                  if (confirmed) {
                    await fetchSavedCards();
                    handlePaymentCompletion({ ...response, status: "successful" });
                    setPaymentStatus("completed");
                  } else {
                    setPaymentStatus("pending");
                  }
                }}
                onClose={async () => {
                  console.info("[Paystack][Admin] PaystackButton closed");
                  if ((paymentStatus as string) === "completed") return;
                  setPaymentStatus("processing");
                  const confirmed = await confirmTransaction({
                    gatewayOverride: "Paystack",
                    includeSaveCardDetails: true,
                  });
                  if (confirmed) {
                    await fetchSavedCards();
                    handlePaymentCompletion({
                      channel: "card",
                      reference: transactionIdentifier,
                      status: "successful",
                    });
                    setPaymentStatus("completed");
                  } else {
                    setPaymentStatus("pending");
                  }
                }}
              />
            </div>
          )}

          {paymentStatus !== "completed" &&
            paymentMode === "bank_transfer" &&
            selectedPaymentOption && (
              <button
                onClick={handleBankTransferConfirmation}
                disabled={isConfirming}
                className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: designTokens.colors.warning[600],
                  borderColor: designTokens.colors.warning[600],
                  color: designTokens.colors.neutral[0],
                }}
              >
                <Server className="mr-2 h-4 w-4" />I have paid
              </button>
            )}

          {paymentStatus === "pending" && paymentMode === "saved_card" && savedCards.length > 0 && (
            <button
              onClick={handleSavedCardPayment}
              disabled={isConfirming || !selectedSavedCard}
              className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: designTokens.colors.primary[700],
                borderColor: designTokens.colors.primary[700],
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with Saved Card
            </button>
          )}

          {paymentStatus === "completed" && (
            <button
              onClick={() => {
                handleModalClose();
                setTimeout(() => {
                  if (isStorageOrder && firstStorageAccountId) {
                    // Navigate to specific storage account
                    window.location.href = `${appPaths.storage}/${firstStorageAccountId}`;
                  } else if (isStorageOrder) {
                    // Fallback to storage list
                    window.location.href = appPaths.storage;
                  } else {
                    window.location.href = appPaths.instances;
                  }
                }, 500);
              }}
              className="inline-flex items-center rounded-lg px-6 py-2 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md"
              style={{
                backgroundColor: designTokens.colors.success[600],
                borderColor: designTokens.colors.success[600],
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isStorageOrder ? "View Storage" : "View Instances"}
            </button>
          )}

          {(paymentStatus === "failed" || paymentStatus === "expired") && (
            <button
              onClick={handleModalClose}
              className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-colors shadow-sm"
              style={{
                backgroundColor: designTokens.colors.neutral[100],
                color: designTokens.colors.neutral[700],
                borderColor: designTokens.colors.neutral[300],
              }}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {paymentStatus === "pending" &&
        paymentMode === "bank_transfer" &&
        selectedPaymentOption?.details && (
          <div
            className="mt-6 rounded-xl border px-6 py-4"
            style={{
              backgroundColor: designTokens.colors.warning[50],
              borderColor: designTokens.colors.warning[200],
            }}
          >
            <h4
              className="mb-3 flex items-center font-semibold"
              style={{ color: designTokens.colors.warning[700] }}
            >
              <Server className="mr-2 h-4 w-4" />
              Bank Transfer Details
            </h4>
            <div className="grid grid-cols-1 gap-2 text-sm">
              {selectedPaymentOption.details.account_name && (
                <div className="flex justify-between">
                  <span style={{ color: designTokens.colors.warning[700] }}>Account Name:</span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: designTokens.colors.neutral[900] }}
                  >
                    {selectedPaymentOption.details.account_name}
                  </span>
                </div>
              )}
              {selectedPaymentOption.details.account_number && (
                <div className="flex justify-between">
                  <span style={{ color: designTokens.colors.warning[700] }}>Account Number:</span>
                  <span
                    className="font-mono font-medium"
                    style={{ color: designTokens.colors.neutral[900] }}
                  >
                    {selectedPaymentOption.details.account_number}
                  </span>
                </div>
              )}
              {selectedPaymentOption.details.bank_name && (
                <div className="flex justify-between">
                  <span style={{ color: designTokens.colors.warning[700] }}>Bank:</span>
                  <span className="font-medium" style={{ color: designTokens.colors.neutral[900] }}>
                    {selectedPaymentOption.details.bank_name}
                  </span>
                </div>
              )}
              <div
                className="flex items-center justify-between border-t pt-2"
                style={{ borderColor: designTokens.colors.warning[200] }}
              >
                <span style={{ color: designTokens.colors.warning[700] }}>Amount to Transfer:</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: designTokens.colors.success[700] }}
                >
                  ₦{selectedPaymentOption.total?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

      {paymentStatus === "pending" && (
        <div
          className="mt-4 rounded-xl border px-6 py-3 text-sm"
          style={{
            backgroundColor: designTokens.colors.info[50],
            borderColor: designTokens.colors.info[200],
            color: designTokens.colors.info[700],
          }}
        >
          <p className="flex items-start">
            <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
            {selectedPaymentOption?.payment_type?.toLowerCase().includes("transfer")
              ? `After making the bank transfer, click "Check Status" or wait for automatic verification. Your ${isStorageOrder ? "storage accounts" : "instances"} will be provisioned once payment is confirmed.`
              : `After completing payment, your ${isStorageOrder ? "storage accounts" : "instances"} will be automatically provisioned. This card will update automatically, or you can click "Check Status" to refresh.`}
          </p>
        </div>
      )}
    </div>
  );

  const cardContent = (
    <div className={containerClasses} style={isInline ? {} : { maxHeight: "90vh" }}>
      {headerContent}
      {statusBanner}
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
