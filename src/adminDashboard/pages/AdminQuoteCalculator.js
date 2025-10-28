import React from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import QuoteCalculatorWizard from "../../dashboard/pages/QuoteCalculatorWizard";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";

export default function AdminQuoteCalculator() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const navigate = useNavigate();
  const { token } = useAdminAuthStore();

  useEffect(() => {
    if (!token) {
      navigate("/admin-signin");
    }
  }, [token, navigate]);

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
            <AdminPageShell contentClassName="p-6 md:p-8">
        {/* Embed the wizard without public Navbar/Footer */}
        <QuoteCalculatorWizard embedded />
            </AdminPageShell>
    </>
  );
}
