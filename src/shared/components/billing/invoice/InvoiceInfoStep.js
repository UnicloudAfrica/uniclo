import React from "react";
import CustomerContextSelector from "../../common/CustomerContextSelector";
import InvoiceInfoCard from "./InvoiceInfoCard";

const InvoiceInfoStep = ({
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
        contextType={contextType}
        setContextType={setContextType}
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        tenants={tenants}
        isTenantsFetching={isTenantsFetching}
        userPool={userPool}
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
