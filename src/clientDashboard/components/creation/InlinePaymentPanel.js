import React, { useState, useEffect, useMemo } from "react";
import {
    DollarSign,
    Clock,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Server,
    Info,
    CreditCard
} from "lucide-react";
import ModernCard from "../../../components/modern/ModernCard";
import ModernButton from "../../../components/modern/ModernButton";
import StatusPill from "../../../adminDashboard/components/StatusPill";
import ToastUtils from "../../../utils/toastUtil";
import { designTokens } from "../../../styles/designTokens";
import useClientAuthStore from "../../../stores/clientAuthStore";
import config from "../../../config";

const InlinePaymentPanel = ({
    transactionData,
    onPaymentComplete,
    onModifyOrder,
}) => {
    const [paymentStatus, setPaymentStatus] = useState("pending");
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [isPolling, setIsPolling] = useState(false);
    const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);

    const {
        transaction,
        instances,
        payment,
        order,
        order_items: orderItems = [],
        pricing_breakdown: pricingBreakdown = [],
    } = transactionData?.data || {};
    const paymentGatewayOptions = payment?.payment_gateway_options || [];
    const { user: clientUser, userEmail: clientUserEmail } = useClientAuthStore.getState();
    const paystackEmail = useMemo(
        () =>
            transaction?.user?.email ||
            clientUser?.email ||
            clientUserEmail ||
            "",
        [transaction?.user?.email, clientUser?.email, clientUserEmail]
    );

    useEffect(() => {
        setPaymentStatus("pending");
        setTimeRemaining(null);
    }, [transactionData]);

    useEffect(() => {
        if (paymentGatewayOptions.length > 0) {
            const paystackCardOption = paymentGatewayOptions.find(
                (option) =>
                    option.name?.toLowerCase().includes("paystack") &&
                    option.payment_type?.toLowerCase() === "card"
            );
            setSelectedPaymentOption(paystackCardOption || paymentGatewayOptions[0]);
        } else {
            setSelectedPaymentOption(null);
        }
    }, [paymentGatewayOptions]);

    useEffect(() => {
        if (!payment?.expires_at) {
            setTimeRemaining(null);
            return;
        }

        const updateCountdown = () => {
            const now = new Date().getTime();
            const expiry = new Date(payment.expires_at).getTime();
            const remaining = expiry - now;

            if (remaining > 0) {
                const hours = Math.floor(remaining / (1000 * 60 * 60));
                const minutes = Math.floor(
                    (remaining % (1000 * 60 * 60)) / (1000 * 60)
                );
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
    }, [payment?.expires_at]);

    const pollTransactionStatus = async () => {
        if (!transaction?.id || isPolling) return;

        setIsPolling(true);
        try {
            const { token } = useClientAuthStore.getState();
            const response = await fetch(
                `${config.baseURL}/business/transactions/${transaction.id}/status`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                }
            );
            const data = await response.json();

            if (data.success && data.data) {
                if (data.data.status === "successful") {
                    setPaymentStatus("completed");
                    onPaymentComplete?.(data.data);
                } else if (data.data.status === "failed") {
                    setPaymentStatus("failed");
                }
            }
        } catch (error) {
            console.error("Failed to poll transaction status:", error);
        } finally {
            setIsPolling(false);
        }
    };

    useEffect(() => {
        if (
            (paymentStatus === "pending" || paymentStatus === "transfer_pending") &&
            transaction?.id
        ) {
            const interval = setInterval(pollTransactionStatus, 10000);
            return () => clearInterval(interval);
        }
        return undefined;
    }, [paymentStatus, transaction?.id]);

    useEffect(() => {
        if (!window.PaystackPop) {
            const script = document.createElement("script");
            script.src = "https://js.paystack.co/v1/inline.js";
            script.async = true;
            document.body.appendChild(script);

            return () => {
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
            };
        }
        return undefined;
    }, []);

    const handlePaymentOptionChange = (optionId) => {
        const option = paymentGatewayOptions.find(
            (opt) => String(opt.id) === String(optionId)
        );
        setSelectedPaymentOption(option || null);
    };

    const handlePayNow = () => {
        if (!selectedPaymentOption) return;

        if (selectedPaymentOption.payment_type?.toLowerCase() === "card") {
            if (!selectedPaymentOption.transaction_reference) {
                ToastUtils.error(
                    "Payment reference not ready yet. Please try again in a moment."
                );
                return;
            }

            const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
            if (!paystackKey) {
                ToastUtils.error("Paystack public key missing. Contact support.");
                return;
            }

            if (!window.PaystackPop || typeof window.PaystackPop.setup !== "function") {
                ToastUtils.error(
                    "Unable to initialize Paystack. Please refresh the page and try again."
                );
                return;
            }

            try {
                const amountMinorUnits = Math.round(
                    Number(selectedPaymentOption.total || 0) * 100
                );

                if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) {
                    ToastUtils.error("Invalid payment amount; please regenerate the order.");
                    console.error("Invalid Paystack amount", selectedPaymentOption.total);
                    return;
                }

                if (!paystackEmail) {
                    ToastUtils.error("Missing payer email. Please refresh and try again.");
                    return;
                }

                const paystackPayload = {
                    key: paystackKey,
                    email: paystackEmail,
                    amount: amountMinorUnits,
                    reference: selectedPaymentOption.transaction_reference,
                    channels: ["card"],
                    onSuccess: (response) => {
                        console.info("[Paystack] Success response", response);
                        setPaymentStatus("completed");
                        onPaymentComplete?.(response);
                    },
                    onCancel: () => {
                        console.log("Payment cancelled");
                    },
                    onError: (error) => {
                        console.error("Payment failed:", error);
                        setPaymentStatus("failed");
                        ToastUtils.error("Card payment failed. Please try again or use another method.");
                    },
                };

                console.info("[Paystack] Opening payment", {
                    ...paystackPayload,
                    onSuccess: undefined,
                    onCancel: undefined,
                    onError: undefined,
                });

                const popup = window.PaystackPop.setup(paystackPayload);

                if (popup && typeof popup.openIframe === "function") {
                    popup.openIframe();
                } else {
                    throw new Error("Paystack popup unavailable");
                }
            } catch (error) {
                console.error("Failed to launch Paystack:", error);
                ToastUtils.error("Could not launch Paystack payment window. Please retry.");
            }
        } else if (
            selectedPaymentOption.payment_type?.toLowerCase().includes("transfer")
        ) {
            setPaymentStatus("transfer_pending");
            ToastUtils.info(
                "Bank transfer details generated. Complete the transfer and refresh status."
            );
        }
    };

    const getStatusIcon = () => {
        switch (paymentStatus) {
            case "completed":
                return <CheckCircle className="h-8 w-8 text-emerald-500" />;
            case "failed":
            case "expired":
                return <AlertCircle className="h-8 w-8 text-red-500" />;
            default:
                return <Clock className="h-8 w-8 text-amber-500" />;
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
            case "transfer_pending":
                return "Bank transfer initiated. Your order will update once the transfer is confirmed.";
            default:
                return "Complete your payment to proceed with instance provisioning.";
        }
    };

    if (!transactionData) {
        return null;
    }

    const statusLabel =
        paymentStatus === "pending"
            ? "Pending"
            : paymentStatus
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

    const statusTone =
        paymentStatus === "completed"
            ? "success"
            : paymentStatus === "failed"
                ? "warning"
                : paymentStatus === "expired"
                    ? "warning"
                    : "info";

    const currencyCode = transaction?.currency || order?.currency || "NGN";
    const formatCurrency = (value, overrideCurrency) => {
        const numeric = Number(value);
        const currency = overrideCurrency || currencyCode;
        if (!Number.isFinite(numeric)) {
            return `${currency} 0.00`;
        }
        try {
            return new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numeric);
        } catch (err) {
            return `${currency} ${numeric.toFixed(2)}`;
        }
    };

    const breakdown = selectedPaymentOption?.charge_breakdown || {};
    const breakdownCurrency = breakdown.currency || currencyCode;
    const baseAmount = Number(
        breakdown.base_amount ?? transaction?.amount ?? order?.total ?? 0
    );
    const selectedTotal = Number(
        breakdown.grand_total ?? selectedPaymentOption?.total ?? baseAmount
    );
    const gatewayFee = Number(
        breakdown.total_fees ?? Math.max(selectedTotal - baseAmount, 0)
    );
    const percentageFee = Number(breakdown.percentage_fee ?? 0);
    const flatFee = Number(breakdown.flat_fee ?? 0);

    return (
        <div className="space-y-6">
            <ModernCard
                padding="lg"
                className="overflow-hidden border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100 shadow-sm"
            >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-white p-2 shadow-sm">
                            {getStatusIcon()}
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                                Complete payment
                            </h3>
                            <p className="text-xs text-slate-500 sm:text-sm">
                                Transaction #{transaction?.identifier || transaction?.id || "N/A"}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusPill label={statusLabel} tone={statusTone} />
                        <ModernButton variant="ghost" onClick={pollTransactionStatus}>
                            Refresh status
                        </ModernButton>
                        <ModernButton variant="ghost" onClick={onModifyOrder}>
                            Modify order
                        </ModernButton>
                    </div>
                </div>
                <div
                    className="mt-4 rounded-2xl border px-4 py-3"
                    style={{
                        backgroundColor:
                            paymentStatus === "completed"
                                ? designTokens.colors.success[50]
                                : designTokens.colors.neutral[50],
                        borderColor: designTokens.colors.neutral[200],
                    }}
                >
                    <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <span
                            className="font-medium"
                            style={{
                                color:
                                    paymentStatus === "completed"
                                        ? designTokens.colors.success[800]
                                        : designTokens.colors.neutral[700],
                            }}
                        >
                            {getStatusMessage()}
                        </span>
                        {timeRemaining && paymentStatus === "pending" && (
                            <span
                                className="font-medium"
                                style={{ color: designTokens.colors.warning[600] }}
                            >
                                Expires in {timeRemaining.hours}h {timeRemaining.minutes}m{" "}
                                {timeRemaining.seconds}s
                            </span>
                        )}
                    </div>
                </div>
            </ModernCard>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-6 py-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <div className="space-y-4">
                            <h4
                                className="flex items-center font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                            >
                                <DollarSign className="mr-2 h-5 w-5" />
                                Payment Details
                            </h4>
                            <div className="space-y-4 text-sm">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Order amount</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(baseAmount, breakdownCurrency)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-slate-500">Gateway fees</span>
                                        <span className="font-medium text-amber-600">
                                            {gatewayFee > 0
                                                ? formatCurrency(gatewayFee, breakdownCurrency)
                                                : `${breakdownCurrency} 0.00`}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-slate-500">Total due</span>
                                        <span className="text-lg font-semibold text-slate-900">
                                            {formatCurrency(selectedTotal, breakdownCurrency)}
                                        </span>
                                    </div>
                                    <div className="mt-3 space-y-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                                        <div className="flex items-center justify-between">
                                            <span>Percentage fee</span>
                                            <span>{formatCurrency(percentageFee, breakdownCurrency)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Flat fee</span>
                                            <span>{formatCurrency(flatFee, breakdownCurrency)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Total fees</span>
                                            <span>{formatCurrency(gatewayFee, breakdownCurrency)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                                        <span>Gateway</span>
                                        <span>Reference</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span
                                            className="rounded px-2 py-1 text-xs font-medium capitalize"
                                            style={{
                                                backgroundColor: designTokens.colors.primary[100],
                                                color: designTokens.colors.primary[800],
                                            }}
                                        >
                                            {selectedPaymentOption?.name || "—"} ·{" "}
                                            {selectedPaymentOption?.payment_type || "—"}
                                        </span>
                                        <span
                                            className="rounded px-2 py-1 font-mono text-xs"
                                            style={{
                                                backgroundColor: designTokens.colors.neutral[100],
                                                color: designTokens.colors.neutral[700],
                                            }}
                                        >
                                            {selectedPaymentOption?.transaction_reference || "—"}
                                        </span>
                                    </div>
                                </div>

                                {paymentGatewayOptions.length > 1 && (
                                    <div className="col-span-full space-y-2">
                                        <label
                                            className="block text-xs font-medium"
                                            style={{ color: designTokens.colors.neutral[700] }}
                                        >
                                            Payment method
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
                                            {paymentGatewayOptions.map((option) => {
                                                const optionBreakdown = option.charge_breakdown || {};
                                                const optionCurrency =
                                                    optionBreakdown.currency || breakdownCurrency;
                                                const optionTotal = Number(
                                                    optionBreakdown.grand_total ?? option.total ?? 0
                                                );
                                                const optionFee = Number(
                                                    optionBreakdown.total_fees ??
                                                    Math.max(optionTotal - baseAmount, 0)
                                                );
                                                return (
                                                    <option key={option.id} value={option.id}>
                                                        {`${option.name} (${option.payment_type}) • ${formatCurrency(
                                                            optionTotal,
                                                            optionCurrency
                                                        )} – fees ${formatCurrency(optionFee, optionCurrency)}`}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4
                                className="flex items-center font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                            >
                                <Server className="mr-2 h-5 w-5" />
                                Instances ({instances?.length || 0})
                            </h4>
                            <div className="max-h-48 space-y-2 overflow-y-auto">
                                {instances?.map((instance, index) => {
                                    const config = instance.configuration || {};
                                    const compute = config.compute || {};
                                    const osImage = config.os_image || {};
                                    const primaryVolume = config.primary_volume || {};
                                    const additionalVolumes = Array.isArray(config.additional_volumes)
                                        ? config.additional_volumes
                                        : [];
                                    const pricingInfo = instance.pricing || {};
                                    const project = config.project || {};

                                    return (
                                        <div
                                            key={instance.id}
                                            className="rounded-lg p-3 text-sm"
                                            style={{ backgroundColor: designTokens.colors.neutral[50] }}
                                        >
                                            <div className="mb-1 flex items-center justify-between">
                                                <span
                                                    className="font-medium"
                                                    style={{ color: designTokens.colors.neutral[900] }}
                                                >
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
                                            <div
                                                className="text-xs"
                                                style={{ color: designTokens.colors.neutral[600] }}
                                            >
                                                Status: <span className="font-medium">{instance.status}</span>
                                            </div>
                                            {instance.months && (
                                                <div className="text-xs text-slate-500">
                                                    Term: {instance.months} month{instance.months === 1 ? "" : "s"}
                                                </div>
                                            )}
                                            <div className="mt-3 space-y-1 text-xs text-slate-600">
                                                {compute?.name && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">Compute:</span>{" "}
                                                        {compute.name}
                                                        {compute.vcpu ? ` · ${compute.vcpu} vCPU` : ""}
                                                        {compute.ram_mb
                                                            ? ` • ${Math.round(Number(compute.ram_mb) / 1024)} GB RAM`
                                                            : ""}
                                                    </div>
                                                )}
                                                {osImage?.name && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">OS:</span>{" "}
                                                        {osImage.name}
                                                    </div>
                                                )}
                                                {(primaryVolume?.name || primaryVolume?.size_gb) && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">
                                                            Primary volume:
                                                        </span>{" "}
                                                        {(primaryVolume.name || "Volume").trim()} •{" "}
                                                        {primaryVolume.size_gb} GB
                                                    </div>
                                                )}
                                                {additionalVolumes.length > 0 && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">
                                                            Additional volumes:
                                                        </span>{" "}
                                                        {additionalVolumes
                                                            .map((vol) => {
                                                                const label = vol.volume_type_id
                                                                    ? `#${vol.volume_type_id}`
                                                                    : "Volume";
                                                                return `${label} (${vol.size_gb} GB)`;
                                                            })
                                                            .join(", ")}
                                                    </div>
                                                )}
                                                {config.security_groups?.length > 0 && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">
                                                            Security groups:
                                                        </span>{" "}
                                                        {config.security_groups.join(", ")}
                                                    </div>
                                                )}
                                                {config.network && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">Network:</span>{" "}
                                                        {config.network}
                                                    </div>
                                                )}
                                                {config.key_name && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">SSH key:</span>{" "}
                                                        {config.key_name}
                                                    </div>
                                                )}
                                                {project?.name && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">Project:</span>{" "}
                                                        {project.name}
                                                    </div>
                                                )}
                                                {config.tags?.length > 0 && (
                                                    <div>
                                                        <span className="font-medium text-slate-700">Tags:</span>{" "}
                                                        {config.tags.join(", ")}
                                                    </div>
                                                )}
                                            </div>
                                            {pricingInfo.subtotal !== undefined && (
                                                <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
                                                    <span className="text-slate-500">Instance total</span>
                                                    <span className="font-semibold text-slate-900">
                                                        {formatCurrency(
                                                            pricingInfo.subtotal,
                                                            pricingInfo.currency || currencyCode
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {pricingBreakdown.length > 0 && (
                        <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
                            <h4
                                className="flex items-center font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                            >
                                <Info className="mr-2 h-5 w-5 text-primary-500" />
                                Order breakdown
                            </h4>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                                {pricingBreakdown.map((bundle, index) => (
                                    <div
                                        key={`pricing-${index}`}
                                        className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    Configuration {index + 1} • {bundle.instance_count} instance
                                                    {bundle.instance_count === 1 ? "" : "s"}
                                                </p>
                                                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                                    {bundle.months} month{bundle.months === 1 ? "" : "s"} term
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-500">Total</p>
                                                <p className="text-sm font-semibold text-slate-900">
                                                    {formatCurrency(bundle.total, bundle.currency)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-1 rounded-xl bg-white px-3 py-2">
                                            <div className="flex items-center justify-between">
                                                <span>Subtotal</span>
                                                <span>{formatCurrency(bundle.subtotal, bundle.currency)}</span>
                                            </div>
                                            {bundle.discount > 0 && (
                                                <div className="flex items-center justify-between text-amber-600">
                                                    <span>
                                                        Discount
                                                        {bundle.discount_label ? ` (${bundle.discount_label})` : ""}
                                                    </span>
                                                    <span>-{formatCurrency(bundle.discount, bundle.currency)}</span>
                                                </div>
                                            )}
                                            {Number(bundle.tax) > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span>Tax</span>
                                                    <span>{formatCurrency(bundle.tax, bundle.currency)}</span>
                                                </div>
                                            )}
                                        </div>
                                        {Array.isArray(bundle.lines) && bundle.lines.length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-[11px] font-medium text-primary-600">
                                                    View line items
                                                </summary>
                                                <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-white px-3 py-2">
                                                    {bundle.lines.map((line, lineIdx) => (
                                                        <div
                                                            key={`line-${index}-${lineIdx}`}
                                                            className="flex items-center justify-between"
                                                        >
                                                            <span className="max-w-[60%] text-slate-600">
                                                                {line.name} · {line.quantity}×
                                                            </span>
                                                            <span className="font-semibold text-slate-800">
                                                                {formatCurrency(line.total, line.currency)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {orderItems.length > 0 && (
                        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
                            <h4
                                className="flex items-center font-semibold"
                                style={{ color: designTokens.colors.neutral[900] }}
                            >
                                <Server className="mr-2 h-5 w-5" />
                                Order items
                            </h4>
                            <div className="space-y-2 text-xs text-slate-600">
                                {orderItems.map((item) => (
                                    <div
                                        key={`order-item-${item.id}`}
                                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">
                                                {item.description ||
                                                    (item.instance?.name
                                                        ? `${item.instance.name}`
                                                        : `Line ${item.id}`)}
                                            </span>
                                            <span className="text-[11px] uppercase tracking-wide text-slate-400">
                                                Qty {item.quantity} · {item.itemable_type?.split("\\").pop()}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[11px] text-slate-500">Unit</p>
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(item.unit_price, item.currency)}
                                            </p>
                                            <p className="text-[11px] text-slate-500">Subtotal</p>
                                            <p className="font-semibold text-slate-900">
                                                {formatCurrency(item.subtotal, item.currency)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Info className="h-4 w-4 text-primary-500" />
                            {paymentStatus === "completed"
                                ? "Payment completed. Provisioning underway."
                                : "Verify payment information and proceed to finalize your order."}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {paymentStatus === "pending" && selectedPaymentOption && (
                                <ModernButton
                                    variant="secondary"
                                    onClick={handlePayNow}
                                    leftIcon={
                                        selectedPaymentOption.payment_type?.toLowerCase() === "card" ? (
                                            <CreditCard className="h-4 w-4" />
                                        ) : (
                                            <Server className="h-4 w-4" />
                                        )
                                    }
                                >
                                    {selectedPaymentOption.payment_type?.toLowerCase() === "card"
                                        ? "Pay with card"
                                        : "Bank transfer"}
                                </ModernButton>
                            )}
                            <ModernButton
                                variant="outline"
                                onClick={pollTransactionStatus}
                                isDisabled={isPolling}
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                                {isPolling ? "Checking..." : "Check status"}
                            </ModernButton>
                        </div>
                    </div>

                    {paymentStatus === "pending" &&
                        selectedPaymentOption?.payment_type
                            ?.toLowerCase()
                            .includes("transfer") &&
                        selectedPaymentOption?.details && (
                            <div
                                className="mt-6 rounded-xl border px-4 py-3"
                                style={{
                                    backgroundColor: designTokens.colors.warning[50],
                                    borderColor: designTokens.colors.warning[200],
                                }}
                            >
                                <h5
                                    className="mb-3 flex items-center font-semibold"
                                    style={{ color: designTokens.colors.warning[800] }}
                                >
                                    <Server className="mr-2 h-4 w-4" />
                                    Bank transfer details
                                </h5>
                                <div className="space-y-2 text-sm">
                                    {selectedPaymentOption.details.account_name && (
                                        <div className="flex justify-between">
                                            <span style={{ color: designTokens.colors.warning[700] }}>
                                                Account name:
                                            </span>
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
                                            <span style={{ color: designTokens.colors.warning[700] }}>
                                                Account number:
                                            </span>
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
                                            <span style={{ color: designTokens.colors.warning[700] }}>
                                                Bank:
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: designTokens.colors.neutral[900] }}
                                            >
                                                {selectedPaymentOption.details.bank_name}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className="flex items-center justify-between border-t border-dashed pt-2"
                                        style={{ borderColor: designTokens.colors.warning[200] }}
                                    >
                                        <span style={{ color: designTokens.colors.warning[700] }}>
                                            Amount to transfer:
                                        </span>
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
                            className="mt-4 rounded-xl border px-4 py-3 text-sm"
                            style={{
                                backgroundColor: designTokens.colors.info[50],
                                borderColor: designTokens.colors.info[200],
                                color: designTokens.colors.info[700],
                            }}
                        >
                            <p className="flex items-start">
                                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                                {selectedPaymentOption?.payment_type?.toLowerCase().includes(
                                    "transfer"
                                )
                                    ? 'After making the bank transfer, click "Check status" or wait for automatic verification. Your instances will be provisioned once payment is confirmed.'
                                    : 'After completing payment, your instances will be automatically provisioned on Zadara. This card will update automatically, or you can click "Check status" to refresh.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InlinePaymentPanel;
