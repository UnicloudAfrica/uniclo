export type ApiContext = "admin" | "tenant" | "client";
export type PaymentModeId = "card" | "bank_transfer" | "saved_card";

export type PaymentGatewayDetails = {
  account_name?: string;
  account_number?: string;
  bank_name?: string;
};

export type PaymentGatewayChargeBreakdown = {
  base_amount?: number;
  tax?: number;
  total_fees?: number;
  grand_total?: number;
};

export type PaymentGatewayOption = {
  id?: string | number;
  name?: string;
  payment_type?: string;
  transaction_reference?: string;
  public_key?: string;
  publicKey?: string;
  gateway?: string;
  provider?: string;
  charge_breakdown?: PaymentGatewayChargeBreakdown;
  subtotal?: number;
  tax?: number;
  fees?: number;
  total?: number;
  currency?: string;
  details?: PaymentGatewayDetails;
};

export type SavedCard = {
  id?: string | number;
  identifier?: string;
  card_type?: string;
  last4?: string;
  exp_month?: string | number;
  exp_year?: string | number;
  bank?: string;
  payment_gateway?: string;
};

export type PaymentAccount = {
  id?: string | number;
};

export type StorageProfile = {
  id?: string | number | undefined;
  name?: string | undefined;
  tierName?: string | undefined;
  tier_key?: string | undefined;
  tierKey?: string | undefined;
  region?: string | undefined;
  regionLabel?: string | undefined;
  currency?: string | undefined;
  months?: number | undefined;
  subtotal?: number | undefined;
  account?: PaymentAccount | undefined;
  account_id?: string | number | undefined;
};

export type InstanceSummary = {
  id?: string | number;
  name?: string;
  provider?: string;
  region?: string;
  status?: string;
};

export type TransactionUser = {
  email?: string;
};

export type TransactionSummary = {
  identifier?: string | undefined;
  reference?: string | undefined;
  id?: string | number | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  third_party_fee?: number | undefined;
  transaction_fee?: number | undefined;
  payment_gateway?: string | undefined;
  status?: string | undefined;
  user?: TransactionUser | undefined;
};

export type PaymentSummary = {
  payment_gateway_options?: PaymentGatewayOption[] | undefined;
  saved_cards?: SavedCard[] | undefined;
  public_key?: string | undefined;
  customer_context?:
    | {
        email?: string | undefined;
      }
    | undefined;
  reference?: string | undefined;
  transaction_reference?: string | undefined;
  gateway?: string | undefined;
  expires_at?: string | undefined;
};

export type OrderSummary = {
  storage_profiles?: StorageProfile[];
  items?: StorageProfile[];
};

export type TransactionContext = {
  transaction?: TransactionSummary;
  order?: OrderSummary;
  instances?: InstanceSummary[];
  payment?: PaymentSummary;
  accounts?: PaymentAccount[];
  order_items?: StorageProfile[];
};

export type TransactionPayload = {
  data?: TransactionContext;
};

export type PaymentModeOption = {
  id: PaymentModeId;
  label: string;
};

export type ConfirmTransactionOptions = {
  gatewayOverride?: string;
  body?: Record<string, unknown>;
  includeSaveCardDetails?: boolean;
};

export type ConfirmTransactionPayload = {
  payment_gateway: string;
  save_card_details?: boolean;
} & Record<string, unknown>;

export type ApiResponse<T = unknown> = {
  success?: boolean;
  status?: string;
  data?: T;
  cards?: SavedCard[];
} & Record<string, unknown>;

export interface PricingSummaryData {
  subtotal?: number;
  tax?: number;
  gatewayFees?: number;
  grandTotal?: number;
  currency?: string;
}

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionData?: TransactionPayload | undefined;
  onPaymentComplete?: ((payload: unknown) => void) | undefined;
  mode?: "modal" | "inline" | undefined;
  className?: string | undefined;
  onPaymentOptionChange?: ((option: PaymentGatewayOption | null) => void) | undefined;
  apiBaseUrl?: string | undefined;
  amount?: number | undefined;
  currency?: string | undefined;
  email?: string | undefined;
  transactionReference?: string | undefined;
  paymentOptions?: PaymentGatewayOption[] | null;
  publicKey?: string | undefined;
  pricingSummary?: PricingSummaryData | undefined;
}
