import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientApi from "../index/client/api";
import clientSilentApi from "../index/client/silent";
import api from "../index/api"; // Keep for public endpoints
import silentApi from "../index/silent"; // Keep for public endpoints
import {
  useSharedCalculatorOptions,
  useSharedMultiQuotes,
  useSharedCalculatorPricing,
} from "./sharedCalculatorHooks";

/**
 * Business/Client API Hooks
 *
 * These hooks provide comprehensive business/client API functionality for all endpoints
 * available in api.php (/api/v1/business/*) and public endpoints
 */

// ================================
// Public Endpoints (No Auth Required)
// ================================

// Calculator Options - Use shared hook instead
const fetchCalculatorOptions = async () => {
  const res = await silentApi("GET", "/calculator-options");
  if (!res.data) throw new Error("Failed to fetch calculator options");
  return res;
};

// Product Pricing Catalog
const fetchProductPricing = async () => {
  const res = await silentApi("GET", "/product-pricing");
  if (!res.data) throw new Error("Failed to fetch product pricing");
  return res;
};

// Multi Quotes - Use shared hook instead
// const createMultiQuote = async (quoteData) => {
const createMultiQuote = async (quoteData) => {
  const res = await clientApi("POST", "/multi-quotes", quoteData);
  if (!res.data) throw new Error("Failed to create multi quote");
  return res.data;
};

// App Settings
const fetchAppSettings = async () => {
  const res = await silentApi("GET", "/app-settings");
  if (!res.data) throw new Error("Failed to fetch app settings");
  return res;
};

// Countries
const fetchCountries = async () => {
  const res = await silentApi("GET", "/countries");
  if (!res.data) throw new Error("Failed to fetch countries");
  return res;
};

const fetchCountryById = async (id) => {
  const res = await silentApi("GET", `/countries/${id}`);
  if (!res.data) throw new Error(`Failed to fetch country with ID ${id}`);
  return res.data;
};

// States
const fetchStateById = async (id) => {
  const res = await silentApi("GET", `/states/${id}`);
  if (!res.data) throw new Error(`Failed to fetch state with ID ${id}`);
  return res.data;
};

// Industries
const fetchIndustries = async () => {
  const res = await silentApi("GET", "/industries");
  if (!res.data) throw new Error("Failed to fetch industries");
  return res;
};

// Product Offers
const fetchProductOffers = async () => {
  const res = await silentApi("GET", "/product-offers");
  if (!res.data) throw new Error("Failed to fetch product offers");
  return res;
};

const fetchProductOfferById = async (id) => {
  const res = await silentApi("GET", `/product-offers/${id}`);
  if (!res.data) throw new Error(`Failed to fetch product offer with ID ${id}`);
  return res.data;
};

// Product Bandwidth
const fetchProductBandwidth = async () => {
  const res = await silentApi("GET", "/product-bandwidth");
  if (!res.data) throw new Error("Failed to fetch product bandwidth");
  return res;
};

// Product OS Images
const fetchProductOsImages = async () => {
  const res = await silentApi("GET", "/product-os-image");
  if (!res.data) throw new Error("Failed to fetch product OS images");
  return res;
};

// Product Compute Instances
const fetchProductComputeInstances = async () => {
  const res = await silentApi("GET", "/product-compute-instance");
  if (!res.data) throw new Error("Failed to fetch product compute instances");
  return res;
};

// Product Volume Types
const fetchProductVolumeTypes = async () => {
  const res = await silentApi("GET", "/product-volume-type");
  if (!res.data) throw new Error("Failed to fetch product volume types");
  return res;
};

// Product Cross Connect
const fetchProductCrossConnect = async () => {
  const res = await silentApi("GET", "/product-cross-connect");
  if (!res.data) throw new Error("Failed to fetch product cross connect");
  return res;
};

// Product Floating IP
const fetchProductFloatingIp = async () => {
  const res = await silentApi("GET", "/product-floating-ip");
  if (!res.data) throw new Error("Failed to fetch product floating IP");
  return res;
};

const fetchProductFloatingIpById = async (id) => {
  const res = await silentApi("GET", `/product-floating-ip/${id}`);
  if (!res.data) throw new Error(`Failed to fetch product floating IP with ID ${id}`);
  return res.data;
};

// Pricing Calculator Leads
const createPricingCalculatorLead = async (leadData) => {
  const res = await clientApi("POST", "/pricing-calculator-leads", leadData);
  if (!res.data) throw new Error("Failed to create pricing calculator lead");
  return res.data;
};

// Business Verifications
const createBusinessVerification = async (verificationData) => {
  const res = await clientApi("POST", "/business-verifications", verificationData);
  if (!res.data) throw new Error("Failed to create business verification");
  return res.data;
};

// Calculator Pricing - Use shared hook instead
const calculatePricing = async (pricingData) => {
  const res = await clientApi("POST", "/calculator/pricing", pricingData);
  if (!res.data) throw new Error("Failed to calculate pricing");
  return res.data;
};

// ================================
// Business Auth Endpoints
// ================================

// Login
const businessLogin = async (loginData) => {
  const res = await clientApi("POST", "/business/auth/login", loginData);
  if (!res.data) throw new Error("Failed to login");
  return res.data;
};

// Register
const businessRegister = async (registerData) => {
  const res = await clientApi("POST", "/business/auth/register", registerData);
  if (!res.data) throw new Error("Failed to register");
  return res.data;
};

// Forgot Password
const businessForgotPassword = async (forgotData) => {
  const res = await clientApi("POST", "/business/auth/forgot-password", forgotData);
  if (!res.data) throw new Error("Failed to process forgot password");
  return res.data;
};

// Send Email
const businessSendEmail = async (emailData) => {
  const res = await clientApi("POST", "/business/auth/send-email", emailData);
  if (!res.data) throw new Error("Failed to send email");
  return res.data;
};

// Verify Email
const businessVerifyEmail = async (verifyData) => {
  const res = await clientApi("POST", "/business/auth/verify-email", verifyData);
  if (!res.data) throw new Error("Failed to verify email");
  return res.data;
};

// Reset Password OTP
const businessResetPasswordOtp = async (resetData) => {
  const res = await clientApi("POST", "/business/auth/reset-password-otp", resetData);
  if (!res.data) throw new Error("Failed to reset password");
  return res.data;
};

// ================================
// 2FA Endpoints
// ================================

// Setup 2FA
const setup2FA = async (setupData) => {
  const res = await clientApi("GET", "/2fa-setup", setupData);
  if (!res.data) throw new Error("Failed to setup 2FA");
  return res.data;
};

// Disable 2FA
const disable2FA = async (disableData) => {
  const res = await clientApi("POST", "/2fa-disable", disableData);
  if (!res.data) throw new Error("Failed to disable 2FA");
  return res.data;
};

// Enable 2FA
const enable2FA = async (enableData) => {
  const res = await clientApi("POST", "/2fa-enable", enableData);
  if (!res.data) throw new Error("Failed to enable 2FA");
  return res.data;
};

// ================================
// Profile Endpoints
// ================================

const fetchProfile = async () => {
  const res = await clientSilentApi("GET", "/business/profile");
  if (!res.data) throw new Error("Failed to fetch profile");
  return res;
};

const createProfile = async (profileData) => {
  const res = await clientApi("POST", "/business/profile", profileData);
  if (!res.data) throw new Error("Failed to create profile");
  return res.data;
};

const fetchProfileById = async (id) => {
  const res = await clientSilentApi("GET", `/business/profile/${id}`);
  if (!res.data) throw new Error(`Failed to fetch profile with ID ${id}`);
  return res.data;
};

const deleteProfile = async (id) => {
  const res = await clientApi("DELETE", `/business/profile/${id}`);
  if (!res.data) throw new Error(`Failed to delete profile with ID ${id}`);
  return res.data;
};

// ================================
// Transaction Endpoints
// ================================

const fetchTransactions = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await clientSilentApi(
    "GET",
    `/business/transaction${queryString ? `?${queryString}` : ""}`
  );
  if (!res.data) throw new Error("Failed to fetch transactions");
  return res;
};

const fetchTransactionById = async (id) => {
  const res = await clientSilentApi("GET", `/business/transaction/${id}`);
  if (!res.data) throw new Error(`Failed to fetch transaction with ID ${id}`);
  return res.data;
};

// Transaction Reverifications
const createTransactionReverification = async (reverificationData) => {
  const res = await clientApi("POST", "/business/transaction-reverifications", reverificationData);
  if (!res.data) throw new Error("Failed to create transaction reverification");
  return res.data;
};

// ================================
// Quote Endpoints
// ================================

const previewQuote = async (quoteData) => {
  const res = await clientApi("POST", "/quote-previews", quoteData);
  if (!res.data) throw new Error("Failed to preview quote");
  return res.data;
};

// ================================
// HOOKS - Public Endpoints
// ================================

export const useFetchCalculatorOptions = (options = {}) => {
  return useQuery({
    queryKey: ["calculator-options"],
    queryFn: fetchCalculatorOptions,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductPricing = (options = {}) => {
  return useQuery({
    queryKey: ["product-pricing"],
    queryFn: fetchProductPricing,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateMultiQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultiQuote,
    onError: (error) => {
      console.error("Error creating multi quote:", error);
    },
  });
};

export const useFetchAppSettings = (options = {}) => {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: fetchAppSettings,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchCountries = (options = {}) => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchCountryById = (id, options = {}) => {
  return useQuery({
    queryKey: ["country", id],
    queryFn: () => fetchCountryById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchStateById = (id, options = {}) => {
  return useQuery({
    queryKey: ["state", id],
    queryFn: () => fetchStateById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchIndustries = (options = {}) => {
  return useQuery({
    queryKey: ["industries"],
    queryFn: fetchIndustries,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductOffers = (options = {}) => {
  return useQuery({
    queryKey: ["product-offers"],
    queryFn: fetchProductOffers,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductOfferById = (id, options = {}) => {
  return useQuery({
    queryKey: ["product-offer", id],
    queryFn: () => fetchProductOfferById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductBandwidth = (options = {}) => {
  return useQuery({
    queryKey: ["product-bandwidth"],
    queryFn: fetchProductBandwidth,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductOsImages = (options = {}) => {
  return useQuery({
    queryKey: ["product-os-images"],
    queryFn: fetchProductOsImages,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductComputeInstances = (options = {}) => {
  return useQuery({
    queryKey: ["product-compute-instances"],
    queryFn: fetchProductComputeInstances,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductVolumeTypes = (options = {}) => {
  return useQuery({
    queryKey: ["product-volume-types"],
    queryFn: fetchProductVolumeTypes,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductCrossConnect = (options = {}) => {
  return useQuery({
    queryKey: ["product-cross-connect"],
    queryFn: fetchProductCrossConnect,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductFloatingIp = (options = {}) => {
  return useQuery({
    queryKey: ["product-floating-ip"],
    queryFn: fetchProductFloatingIp,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchProductFloatingIpById = (id, options = {}) => {
  return useQuery({
    queryKey: ["product-floating-ip", id],
    queryFn: () => fetchProductFloatingIpById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreatePricingCalculatorLead = () => {
  return useMutation({
    mutationFn: createPricingCalculatorLead,
    onError: (error) => {
      console.error("Error creating pricing calculator lead:", error);
    },
  });
};

export const useCreateBusinessVerification = () => {
  return useMutation({
    mutationFn: createBusinessVerification,
    onError: (error) => {
      console.error("Error creating business verification:", error);
    },
  });
};

export const useCalculatePricing = () => {
  return useMutation({
    mutationFn: calculatePricing,
    onError: (error) => {
      console.error("Error calculating pricing:", error);
    },
  });
};

// ================================
// HOOKS - Auth Endpoints
// ================================

export const useBusinessLogin = () => {
  return useMutation({
    mutationFn: businessLogin,
    onError: (error) => {
      console.error("Error logging in:", error);
    },
  });
};

export const useBusinessRegister = () => {
  return useMutation({
    mutationFn: businessRegister,
    onError: (error) => {
      console.error("Error registering:", error);
    },
  });
};

export const useBusinessForgotPassword = () => {
  return useMutation({
    mutationFn: businessForgotPassword,
    onError: (error) => {
      console.error("Error processing forgot password:", error);
    },
  });
};

export const useBusinessSendEmail = () => {
  return useMutation({
    mutationFn: businessSendEmail,
    onError: (error) => {
      console.error("Error sending email:", error);
    },
  });
};

export const useBusinessVerifyEmail = () => {
  return useMutation({
    mutationFn: businessVerifyEmail,
    onError: (error) => {
      console.error("Error verifying email:", error);
    },
  });
};

export const useBusinessResetPasswordOtp = () => {
  return useMutation({
    mutationFn: businessResetPasswordOtp,
    onError: (error) => {
      console.error("Error resetting password:", error);
    },
  });
};

// ================================
// HOOKS - 2FA Endpoints
// ================================

export const useSetup2FA = () => {
  return useMutation({
    mutationFn: setup2FA,
    onError: (error) => {
      console.error("Error setting up 2FA:", error);
    },
  });
};

export const useDisable2FA = () => {
  return useMutation({
    mutationFn: disable2FA,
    onError: (error) => {
      console.error("Error disabling 2FA:", error);
    },
  });
};

export const useEnable2FA = () => {
  return useMutation({
    mutationFn: enable2FA,
    onError: (error) => {
      console.error("Error enabling 2FA:", error);
    },
  });
};

// ================================
// HOOKS - Profile Endpoints
// ================================

export const useFetchProfile = (options = {}) => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error creating profile:", error);
    },
  });
};

export const useFetchProfileById = (id, options = {}) => {
  return useQuery({
    queryKey: ["profile", id],
    queryFn: () => fetchProfileById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useDeleteProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error deleting profile:", error);
    },
  });
};

// ================================
// HOOKS - Transaction Endpoints
// ================================

export const useFetchTransactions = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["transactions", params],
    queryFn: () => fetchTransactions(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchTransactionById = (id, options = {}) => {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: () => fetchTransactionById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateTransactionReverification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransactionReverification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
    onError: (error) => {
      console.error("Error creating transaction reverification:", error);
    },
  });
};

// ================================
// HOOKS - Quote Endpoints
// ================================

export const usePreviewQuote = () => {
  return useMutation({
    mutationFn: previewQuote,
    onError: (error) => {
      console.error("Error previewing quote:", error);
    },
  });
};

// Export individual functions for direct use if needed
export {
  fetchCalculatorOptions,
  fetchProductPricing,
  createMultiQuote,
  fetchAppSettings,
  fetchCountries,
  fetchCountryById,
  fetchStateById,
  fetchIndustries,
  fetchProductOffers,
  fetchProductOfferById,
  businessLogin,
  businessRegister,
  businessForgotPassword,
  businessVerifyEmail,
  fetchTransactions,
  fetchTransactionById,
  previewQuote,
};
