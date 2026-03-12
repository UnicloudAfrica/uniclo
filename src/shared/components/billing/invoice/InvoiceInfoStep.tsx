import React from "react";
import CustomerContextSelector from "../../common/CustomerContextSelector";
import InvoiceInfoCard from "./InvoiceInfoCard";
import { InvoiceFormData, UpdateInvoiceFormData } from "../types";

interface InvoiceInfoStepProps {
  formData: InvoiceFormData;
  errors: Record<string, string | null>;
  updateFormData: UpdateInvoiceFormData;
  mode?: "admin" | "tenant" | "client";
  // Customer context props
  contextType: string;
  setContextType: (type: string) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedUserId: string;
  setSelectedUserId: (id: string) => void;
  tenants: unknown;
  isTenantsFetching: boolean;
  userPool: unknown;
  isUsersFetching: boolean;
  // Currency props
  countryCode: string;
  currencyCode: string;
  onCurrencyChange: (country: string, currency: string) => void;
}

const InvoiceInfoStep: React.FC<InvoiceInfoStepProps> = ({
  formData,
  errors,
  updateFormData,
  mode = "admin",
  // Customer context props
  contextType,
  setContextType,
  selectedTenantId,
  setSelectedTenantId,
  selectedUserId,
  setSelectedUserId,
  tenants,
  isTenantsFetching,
  userPool,
  isUsersFetching,
  // Currency props
  countryCode,
  currencyCode,
  onCurrencyChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Customer Context - Full width on top */}
      <CustomerContextSelector
        contextType={contextType as never}
        setContextType={setContextType}
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        tenants={tenants as never}
        isTenantsFetching={isTenantsFetching}
        userPool={userPool as never}
        isUsersFetching={isUsersFetching}
      />

      {/* Invoice Information - Full width below */}
      <InvoiceInfoCard
        formData={formData}
        errors={errors}
        updateFormData={updateFormData}
        mode={mode}
        countryCode={countryCode}
        currencyCode={currencyCode}
        onCurrencyChange={onCurrencyChange}
      />
    </div>
  );
};

export default InvoiceInfoStep;
