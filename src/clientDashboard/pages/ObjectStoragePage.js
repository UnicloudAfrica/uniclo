import React, { useState } from "react";
import ClientActiveTab from "../components/clientActiveTab";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";

const ObjectStoragePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        title="Object Storage"
        description="Purchase and track S3-compatible capacity for your projects."
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Object Storage" },
        ]}
      />
    </>
  );
};

export default ObjectStoragePage;
