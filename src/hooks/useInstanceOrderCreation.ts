import { useState, useCallback } from "react";
import { useApiContext } from "./useApiContext";
import ToastUtils from "../utils/toastUtil";
import { Configuration, AdditionalVolume } from "../types/InstanceConfiguration";
import {
  evaluateConfigurationCompleteness,
  normalizePaymentOptions,
} from "../utils/instanceCreationUtils";

interface UseInstanceOrderCreationProps {
  configurations: Configuration[];
  isFastTrack: boolean;
  billingCountry: string;
  contextType: string;
  selectedTenantId: string;
  selectedUserId: string;
  setActiveStep: (step: number) => void;
  navigate: any;
}

export const useInstanceOrderCreation = ({
  configurations,
  isFastTrack,
  billingCountry,
  contextType,
  selectedTenantId,
  selectedUserId,
  setActiveStep,
  navigate,
}: UseInstanceOrderCreationProps) => {
  const { apiBaseUrl, authToken } = useApiContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [orderReceipt, setOrderReceipt] = useState<any>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<any>(null);

  const apiCall = useCallback(
    async (method: string, endpoint: string, body?: any) => {
      const headers: any = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data; // Usually backend returns { data: ... } or direct object
    },
    [apiBaseUrl, authToken]
  );

  const buildPayload = useCallback(() => {
    const pricing_requests = configurations.map((cfg, index) => {
      const requiredFields = [
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

      const parsedBandwidthCount = Number(cfg.bandwidth_count) || 1;
      const parsedFloatingIpCount = Number(cfg.floating_ip_count) || 0;
      const parsedMonths = Number(cfg.months) || 1;
      const parsedInstances = Number(cfg.instance_count) || 1;
      const parsedStorage = Number(cfg.storage_size_gb) || 50;
      const instanceName = (cfg.name || "").trim() || null;
      // const instanceDescription = (cfg.description || "").trim() || null; // Unused in payload
      const networkId = cfg.network_id || null;
      const subnetId = cfg.subnet_id || null;
      // const tags = (cfg.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean); // Unused in payload

      const sanitizedSgIds = (
        Array.isArray(cfg.security_group_ids)
          ? cfg.security_group_ids
          : ((cfg.security_group_ids as any) || "").split(",")
      )
        .map((v: any) => (v && v.value ? v.value : v))
        .map((v: any) => (v || "").toString().trim())
        .filter(Boolean);

      const extraVolumes = (cfg.additional_volumes || [])
        .map((vol: AdditionalVolume) => ({
          volume_type_id: vol.volume_type_id,
          storage_size_gb: Number(vol.storage_size_gb) || 0,
        }))
        .filter((vol) => vol.volume_type_id && vol.storage_size_gb > 0);

      const fastTrackLine = isFastTrack || cfg.launch_mode === "fast-track";

      return {
        project_id: cfg.project_id || undefined,
        region: cfg.region || undefined,
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
        security_group_ids: sanitizedSgIds,
        keypair_name: cfg.keypair_name || null,
        network_id: networkId,
        subnet_id: subnetId,
        name: instanceName,
        fast_track: fastTrackLine,
      };
    });

    const anyFastTrack = isFastTrack || pricing_requests.some((req) => req.fast_track);

    const payload: any = {
      fast_track: anyFastTrack,
      country_iso: billingCountry || undefined,
      pricing_requests,
    };
    if (contextType === "tenant" && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (contextType === "user" && selectedUserId) {
      payload.client_id = selectedUserId;
      if (selectedTenantId) {
        payload.tenant_id = selectedTenantId;
      }
    }

    return payload;
  }, [configurations, isFastTrack, billingCountry, contextType, selectedTenantId, selectedUserId]);

  const handleCreateOrder = async () => {
    setIsSubmitting(true);
    setSubmissionResult(null);
    setOrderReceipt(null);
    try {
      const incompleteIndex = configurations.findIndex(
        (cfg) => !evaluateConfigurationCompleteness(cfg).isComplete
      );
      if (incompleteIndex !== -1) {
        throw new Error(`Complete Configuration #${incompleteIndex + 1} before pricing.`);
      }
      const payload = buildPayload();

      const res = await apiCall("POST", "/instances/create", payload);
      const data = res?.data || res;

      const normalizedGatewayOptions = normalizePaymentOptions(
        data?.payment?.payment_gateway_options || data?.payment?.options || data?.payment_options
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
      };

      setSubmissionResult(mergedResult);
      setOrderReceipt({
        transaction: mergedResult?.transaction || null,
        order: mergedResult?.order || null,
        payment: mergedResult?.payment || null,
        pricing_breakdown: mergedResult?.pricing_breakdown || null,
      });
      setSelectedPaymentOption(normalizedGatewayOptions[0] || null);

      const isPaymentRequired = mergedResult?.payment?.required;

      ToastUtils.success(
        mergedResult?.message ||
          (isPaymentRequired
            ? "Order created. Complete payment to proceed."
            : "Instances initiated.")
      );

      // Determine next step based on fast-track mode and payment requirement
      if (payload.fast_track || !isPaymentRequired) {
        // Skip payment step - go directly to review
        // Assuming steps length is 4 (Workflow, Config, Payment, Review) so index 3
        setActiveStep(3);
      } else {
        // Payment required - go to payment step
        setActiveStep(2);
      }
    } catch (error: any) {
      console.error("Failed to create instances", error);
      ToastUtils.error(error?.message || "Could not create instances.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCompleted = async (payload?: any) => {
    const identifier =
      submissionResult?.transaction?.identifier ||
      submissionResult?.transaction?.reference ||
      submissionResult?.transaction?.id ||
      orderReceipt?.transaction?.identifier ||
      orderReceipt?.transaction?.id;

    if (!identifier) {
      ToastUtils.error("No transaction reference available to verify.");
      return;
    }

    const rawGateway =
      payload?.gateway ||
      submissionResult?.payment?.gateway ||
      orderReceipt?.payment?.gateway ||
      selectedPaymentOption?.name ||
      "";

    const normalizedGateway = (() => {
      const lower = String(rawGateway).toLowerCase();
      if (lower.includes("paystack") && lower.includes("card")) {
        return "Paystack_Card";
      }
      if (lower.includes("paystack")) return "Paystack";
      if (lower.includes("flutter")) return "Flutterwave";
      if (lower.includes("wallet")) return "Wallet";
      if (lower.includes("fincra")) return "Fincra";
      if (lower.includes("virtual")) return "Virtual_Account";
      return rawGateway || "Paystack";
    })();

    setIsVerifyingPayment(true);
    try {
      const apiPayload: any = {
        payment_gateway: normalizedGateway,
      };
      if (normalizedGateway.toLowerCase().includes("paystack")) {
        apiPayload.save_card_details = false;
      }

      const res = await apiCall("PUT", `/transactions/${identifier}`, apiPayload);
      const responseData = res?.data || res;

      const normalizedStatus = (
        responseData?.status ||
        responseData?.transaction?.status ||
        "pending"
      ).toLowerCase();

      const updateState = (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          transaction: {
            ...prev.transaction,
            status: normalizedStatus,
            payment_reference:
              responseData?.payment_reference ||
              responseData?.transaction?.payment_reference ||
              payload?.reference ||
              prev.transaction?.payment_reference,
          },
          payment: {
            ...(prev.payment || {}),
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
        setActiveStep(3);
      } else {
        ToastUtils.success(`Payment status: ${normalizedStatus}`);
        // Note: logic in original was mixing verifyPayment and paymentCompleted.
        // handlePaymentCompleted in original called PUT and eventually set status and moved step.
        // Here we replicate that.
        if (normalizedStatus === "pending") {
          // Check if we should advance? Original code advanced if status was success.
        }
      }
    } catch (error: any) {
      ToastUtils.error(error?.message || "Could not verify payment.");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  return {
    isSubmitting,
    isVerifyingPayment,
    submissionResult,
    setSubmissionResult, // Export setter if needed
    orderReceipt,
    selectedPaymentOption,
    setSelectedPaymentOption,
    handleCreateOrder,
    handlePaymentCompleted,
  };
};
