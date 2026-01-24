// @ts-nocheck
import React, { useState } from "react";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchCountryPricings } from "../../hooks/adminHooks/countryPricingHooks";
import AdminPageShell from "../components/AdminPageShell.tsx";

export default function AdminCountryPricing() {
  const { isFetching: isCountryPricingFetching, data: countryPricings } = useFetchCountryPricings();

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title="Country Pricing"
        description="Review regional pricing configurations and localization rules."
        contentClassName="space-y-6"
      >
        AdminCountryPricing
      </AdminPageShell>
    </>
  );
}
