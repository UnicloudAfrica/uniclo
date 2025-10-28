import React, { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchCountryPricings } from "../../hooks/adminHooks/countryPricingHooks";
import AdminPageShell from "../components/AdminPageShell";

export default function AdminCountryPricing() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isFetching: isCountryPricingFetching, data: countryPricings } =
    useFetchCountryPricings();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
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
