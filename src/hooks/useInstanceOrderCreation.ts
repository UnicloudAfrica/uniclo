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
  const paymentStepIndex = isFastTrack ? null : 2;
  const reviewStepIndex = isFastTrack ? 2 : 3;
  const { apiBaseUrl, authHeaders } = useApiContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [orderReceipt, setOrderReceipt] = useState<any>(null);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<any>(null);

  const apiCall = useCallback(
    async (method: string, endpoint: string, body?: any) => {
      const headers = authHeaders;

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method,
        headers,
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data; // Usually backend returns { data: ... } or direct object
    },
    [apiBaseUrl, authHeaders]
  );

  const buildPayload = useCallback(() => {
    const pricing_requests = configurations.map((cfg, index) => {
      const isNewProject = cfg.project_mode === "new" || Boolean(cfg.template_locked);
      const assignmentScopePayload = cfg.assignment_scope || undefined;
      const sanitizedMemberIds = Array.isArray(cfg.member_user_ids)
        ? cfg.member_user_ids.map((id) => Number(id)).filter(Boolean)
        : [];
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

      const parsedBandwidthCount = cfg.bandwidth_id ? 1 : 0;
      const parsedFloatingIpCount = Number(cfg.floating_ip_count) || 0;
      const parsedMonths = Number(cfg.months) || 1;
      const parsedInstances = Number(cfg.instance_count) || 1;
      const parsedStorage = Number(cfg.storage_size_gb) || 50;
      const instanceName = (cfg.name || "").trim() || null;
      // const instanceDescription = (cfg.description || "").trim() || null; // Unused in payload
      const networkId = isNewProject ? undefined : cfg.network_id || undefined;
      const subnetId = isNewProject ? undefined : cfg.subnet_id || undefined;
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
      };
    });

    const anyFastTrack = isFastTrack;

    const payload: any = {
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

    return payload;
  }, [configurations, isFastTrack, billingCountry, contextType, selectedTenantId, selectedUserId]);

  const handleCreateOrder = async () => {
    setSubmissionResult(null);
    setOrderReceipt(null);
    setIsSubmitting(true);
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
    } catch (error: any) {
      console.error("Failed to create instances", error);
      ToastUtils.error(error?.message || "Could not create instances.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentCompleted = async (payload?: any) => {
    const identifier =
      selectedPaymentOption?.transaction_reference ||
      submissionResult?.payment?.payment_gateway_options?.[0]?.transaction_reference ||
      orderReceipt?.payment?.payment_gateway_options?.[0]?.transaction_reference ||
      submissionResult?.transaction?.identifier ||
      submissionResult?.transaction?.reference ||
      orderReceipt?.transaction?.identifier ||
      orderReceipt?.transaction?.reference ||
      null;

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
      const keypairMaterials =
        responseData?.keypair_materials ||
        responseData?.metadata?.keypair_materials ||
        responseData?.transaction?.metadata?.keypair_materials ||
        null;

      const updateState = (prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          ...(keypairMaterials ? { keypair_materials: keypairMaterials } : {}),
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
