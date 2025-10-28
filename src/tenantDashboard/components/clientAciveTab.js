import React from "react";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

const BreadcrumbNav = ({ tenantData }) => {
  const location = useLocation();

  // Map URL path segments to human-readable names
  const pathMap = {
    dashboard: "Home",
    modules: "Modules",
    "instances-request": "Instances Request",
    "payment-history": "Payment History",
    "support-ticket": "Support Ticket",
    "app-settings": "App Settings",
  };

  // Generate breadcrumb items from the current pathname
  const getBreadcrumbItems = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment); // Remove empty segments

    if (pathSegments.length === 0)
      return [{ name: "Home", path: "/dashboard" }];

    return pathSegments.map((segment, index) => {
      const pathSoFar = `/${pathSegments.slice(0, index + 1).join("/")}`;
      return {
        name:
          pathMap[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1),
        path: pathSoFar,
      };
    });
  };

  const breadcrumbItems = getBreadcrumbItems();

  return (
    <div
      className="font-Outfit fixed top-[74px] left-0 md:left-20 lg:left-[20%] h-[52px] px-8 border-b flex items-center w-full md:w-[calc(100%-5rem)] lg:w-[80%] z-[99] bg-white"
      style={{ borderBottomColor: tenantData.color + "20" }}
    >
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="text-[#1C1C1C80] mx-2 w-4" />}
          <button
            className={`font-Outfit text-sm ${
              index === breadcrumbItems.length - 1
                ? `text-[tenantData.color] font-medium`
                : "text-[tenantData.color]/50 font-normal"
            }`}
            style={{
              color:
                index === breadcrumbItems.length - 1
                  ? tenantData.color
                  : `${tenantData.color}/50`,
              transition: "color 0.3s",
            }}
            onClick={() => (window.location.href = item.path)} // Basic navigation (replace with useNavigate if needed)
          >
            {item.name}
          </button>
        </div>
      ))}
    </div>
  );
};

export default BreadcrumbNav;
