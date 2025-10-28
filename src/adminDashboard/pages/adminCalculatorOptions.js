import { useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import { useFetchCalculatorOptions } from "../../hooks/adminHooks/calculatorOptionHooks";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import AdminPageShell from "../components/AdminPageShell";

const AdminCalculatorOptions = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const { data: options, isFetching: isOptionssFetching } =
    useFetchCalculatorOptions();

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
            <AdminPageShell contentClassName="p-6 md:p-8">      </AdminPageShell>
    </>
  );
};

export default AdminCalculatorOptions;
