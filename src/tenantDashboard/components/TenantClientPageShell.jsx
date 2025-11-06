import React, { useState } from "react";
import Sidebar from "./clientSidebar";
import HeaderBar from "./clientHeadbar";
import BreadcrumbNav from "./clientAciveTab";

const TenantClientPageShell = ({
  title,
  description,
  children,
  className = "",
  contentClassName = "",
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <HeaderBar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <BreadcrumbNav />
      <main
        className={[
          "dashboard-content-shell p-6 md:p-8 space-y-6",
          className,
        ]
          .filter(Boolean)
          .join(" ")
          .trim()}
      >
        <section
          className={[
            "rounded-lg border border-gray-200 bg-white px-6 py-5 space-y-3",
            contentClassName,
          ]
            .filter(Boolean)
            .join(" ")
            .trim()}
        >
          {title ? (
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          ) : null}
          {description ? (
            typeof description === "string" ? (
              <p className="text-sm text-gray-500">{description}</p>
            ) : (
              description
            )
          ) : null}
        </section>
        {children}
      </main>
    </>
  );
};

export default TenantClientPageShell;
