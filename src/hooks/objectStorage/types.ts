import React from "react";
import { Option, ServiceProfile } from "../objectStorageUtils";
import {
  ResolvedProfile,
  SummaryTotals,
  ObjectStorageOrderSummary,
  PaymentOptionLike,
} from "../useObjectStoragePricing";

// ---- Context ----
export type ObjectStorageContext = "admin" | "tenant" | "client";

// ---- Internal utility types ----
export type UnknownRecord = Record<string, unknown>;

export type PricingHookOptions = Record<string, unknown> & {
  enabled?: boolean;
  countryCode?: string;
};

export type SubmitEvent = { preventDefault?: () => void };

// ---- Storage / payment related types ----
export type StorageProfileLike = {
  id?: string | number;
  name?: string;
  tierName?: string;
  tier_key?: string;
  tierKey?: string;
  region?: string;
  regionLabel?: string;
  currency?: string;
  months?: number;
  subtotal?: number;
  account?: { id?: string | number };
  account_id?: string | number;
};

export type InstanceSummaryLike = {
  id?: string | number;
  name?: string;
  provider?: string;
  region?: string;
  status?: string;
};

export type PaymentAccountLike = {
  id?: string | number;
};

export type SavedCardLike = {
  id?: string | number;
  identifier?: string;
  card_type?: string;
  last4?: string;
  exp_month?: string | number;
  exp_year?: string | number;
  bank?: string;
  payment_gateway?: string;
};

export type TransactionSummaryLike = {
  identifier?: string | number;
  reference?: string | number;
  id?: string | number;
  amount?: number;
  currency?: string;
  third_party_fee?: number;
  transaction_fee?: number;
  payment_gateway_options?: unknown;
  status?: string;
  user?: { email?: string };
};

export type PaymentSummaryLike = {
  payment_gateway_options?: PaymentOptionLike[];
  saved_cards?: SavedCardLike[];
  public_key?: string;
  customer_context?: { email?: string };
  reference?: string;
  transaction_reference?: string;
  gateway?: string;
  expires_at?: string;
};

export type PaymentTransactionData = {
  data?: {
    transaction?: TransactionSummaryLike | null;
    order?: {
      storage_profiles?: StorageProfileLike[];
      items?: StorageProfileLike[];
    } | null;
    instances?: InstanceSummaryLike[];
    payment?: PaymentSummaryLike | null;
    accounts?: PaymentAccountLike[];
    order_items?: StorageProfileLike[];
  };
};

// ---- Config passed into the main hook ----
export interface ObjectStorageLogicConfig {
  context?: ObjectStorageContext;
  tenantId?: string;
  userId?: string;
  allowFastTrack?: boolean;
  useRegionsHook?: () => { data: unknown; isFetching: boolean };
  useCountriesHook?: () => { data: unknown; isFetching: boolean };
  usePricingHook?: (
    region: string,
    productType: string,
    options: PricingHookOptions
  ) => { data: unknown; isFetching: boolean };
  submitOrderFn?: (payload: Record<string, unknown>) => Promise<unknown>;
}

// ---- Return type of the main hook ----
export interface ObjectStorageLogicReturn {
  // Mode & Steps
  mode: string;
  isFastTrack: boolean;
  activeStep: number;
  steps: { id: string; label: string; description: string }[];
  isFirstStep: boolean;
  isLastStep: boolean;

  // Service Profiles
  serviceProfiles: ServiceProfile[];
  resolvedProfiles: ResolvedProfile[];
  addProfile: () => void;
  removeProfile: (id: string) => void;
  updateProfile: (id: string, updates: Partial<ServiceProfile>) => void;
  handleRegionChange: (id: string, region: string) => void;
  handleTierChange: (id: string, tierKey: string) => void;
  handleMonthsChange: (id: string, months: string) => void;
  handleStorageGbChange: (id: string, storageGb: string) => void;
  handleNameChange: (id: string, name: string) => void;
  handleUnitPriceChange: (id: string, unitPrice: string) => void;

  // Options
  regionOptions: Option[];
  countryOptions: Option[];
  tenantOptions: Option[];
  clientOptions: Option[];

  // Form Data
  formData: { countryCode: string };
  selectedCountryCode: string;
  selectedCurrency: string;
  isCountryLocked: boolean;
  setFormData: React.Dispatch<React.SetStateAction<{ countryCode: string }>>;
  setBillingCountry: (code: string) => void;
  setIsCountryLocked: (locked: boolean) => void;

  // Customer Context
  contextType: string;
  setContextType: (type: string) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  assignmentLabel: string;

  // Pricing
  summaryTotals: SummaryTotals;
  displayedTotals: SummaryTotals;
  summaryCurrency: string;
  grandTotalWithFees: number;
  hasCurrencyMismatch: boolean;

  // Order State
  lastOrderSummary: ObjectStorageOrderSummary | null;
  orderId?: string | null;
  transactionId?: string | null;
  accountIds: string[];
  paymentRequired: boolean | null;
  paymentTransactionData: PaymentTransactionData | null;
  paymentOptions: PaymentOptionLike[];
  selectedPaymentOption: PaymentOptionLike | null;
  setSelectedPaymentOption: (option: PaymentOptionLike | null) => void;
  isPaymentComplete: boolean;
  isPaymentFailed: boolean;
  transactionStatus: string;

  // Loading States
  isRegionsLoading: boolean;
  isCountriesLoading: boolean;
  isPricingLoading: boolean;
  isTenantsFetching: boolean;
  isUsersFetching: boolean;
  isSubmitting: boolean;
  isGeneratingPayment: boolean;

  // Handlers
  handleModeChange: (mode: string) => void;
  goToStep: (step: number) => void;
  handleNextStep: () => void;
  handlePreviousStep: () => void;
  validateWorkflowStep: () => boolean;
  validateServiceStep: () => boolean;
  createOrder: (options?: {
    fastTrackOverride?: boolean;
  }) => Promise<ObjectStorageOrderSummary | null>;
  handlePaymentCompleted: (payload?: Record<string, unknown>) => void;
  resetOrderState: () => void;
  submitOrder: (
    event?: SubmitEvent,
    fastTrackOverride?: boolean,
    options?: Record<string, unknown>
  ) => Promise<ObjectStorageOrderSummary | null>;
  resetForm: () => void;

  // Context info
  dashboardContext: ObjectStorageContext;
}
