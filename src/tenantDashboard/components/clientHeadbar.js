import React from "react";
import { BellRing, CircleHelp, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useFetchProfile } from "../../hooks/resource";

const HeaderBar = ({ tenantData, onMenuClick }) => {
  const location = useLocation();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();

  // Map URL path segments to human-readable names
  const pathMap = {
    dashboard: "Home",
    modules: "Modules",
    "instances-request": "Instances Request",
    "payment-history": "Payment History",
    "support-ticket": "Support Ticket",
    "app-settings": "App Settings",
  };

  // Get the active page name
  const getActivePageName = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment); // Remove empty segments
    if (pathSegments.length === 0) return "Home";
    const lastSegment = pathSegments[pathSegments.length - 1];
    return (
      pathMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
    );
  };

  // Get user initials
  const getInitials = (firstName, lastName) => {
    if (!firstName && !lastName) return "";
    const firstInitial = firstName?.trim()?.[0]?.toUpperCase() || "";
    const lastInitial = lastName?.trim()?.[0]?.toUpperCase() || "";
    return firstInitial + lastInitial;
  };

  const activePageName = getActivePageName();

  return (
    <>
      {/* Desktop View */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-white hidden md:flex justify-between items-center font-Outfit"
        style={{ borderBottomColor: tenantData.color + "20" }}
      >
        {/* Logo */}
        <img
          src={tenantData.logo}
          className="w-[71px] h-[54px]"
          alt={`${tenantData.name} Logo`}
        />
        {/* User Info */}
        <div className="flex items-center space-x-6">
          <BellRing className="text-[#1C1C1C] w-5" />
          <CircleHelp className="text-[#1C1C1C] w-5" />
          <div>
            {isProfileFetching ? (
              <>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </>
            ) : (
              <>
                <p className="text-[#1C1C1C] font-semibold text-sm">
                  {profile?.email || "No email"}
                </p>
                <p className="font-normal text-sm text-[#1C1C1C]">
                  {profile?.first_name || profile?.last_name
                    ? `${profile?.first_name || ""} ${profile?.last_name || ""}`
                    : "No name"}
                </p>
              </>
            )}
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: tenantData.color + "33" }}
          >
            {isProfileFetching ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <span className="font-semibold text-sm text-black">
                {getInitials(profile?.first_name, profile?.last_name) || "--"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-white flex md:hidden justify-between items-center font-Outfit"
        style={{ borderBottomColor: tenantData.color + "20" }}
      >
        <div className="flex items-center space-x-3">
          <button onClick={onMenuClick}>
            <Menu
              className="text-[tenantData.color]"
              style={{ color: tenantData.color }}
            />
          </button>
          <p className="font-semibold text-base text-[#1C1C1C]">
            {activePageName}
          </p>
        </div>
        <div
          className="flex items-center border justify-center rounded-[8px] w-10 h-10"
          style={{ borderColor: tenantData.color + "20" }}
        >
          <BellRing className="text-[#1C1C1C] w-4" />
        </div>
      </div>
    </>
  );
};

export default HeaderBar;
