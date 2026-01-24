import { BellRing, CircleHelp, Menu } from "lucide-react";
import logo from "./assets/logo.png";
import { useLocation } from "react-router-dom";
import { useFetchProfile } from "../../hooks/resource";
import { useApplyBrandingTheme, useTenantBrandingTheme } from "../../hooks/useBrandingTheme";
import { designTokens } from "../../styles/designTokens";

const Headbar = ({ onMenuClick }) => {
  const location = useLocation();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { data: branding, isFetching: isBrandingFetching } = useTenantBrandingTheme();

  useApplyBrandingTheme(branding, { fallbackLogo: logo, updateFavicon: true });

  // Map URL path segments to human-readable names
  const pathMap = {
    dashboard: "Home",
    modules: "Modules",
    clients: "Clients",
    "payment-history": "Payment History",
    "support-ticket": "Support Ticket",
    "app-settings": "App Settings",
    overview: "Overview",
  };

  // Get the active page name
  const getActivePageName = () => {
    const pathSegments = location.pathname.split("/").filter((segment) => segment); // Remove empty segments
    if (pathSegments.length === 0) return "Home";
    const lastSegment = pathSegments[pathSegments.length - 1];
    return pathMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
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
        style={{
          borderColor: designTokens.colors.neutral[200],
          boxShadow: designTokens.shadows.xs,
        }}
      >
        {/* Logo */}
        {isBrandingFetching ? (
          <div className="w-[110px] h-[48px] bg-gray-200 rounded animate-pulse" />
        ) : (
          <a
            href={branding?.logoHref || "/"}
            className="inline-flex items-center"
            aria-label="Tenant home"
          >
            <img
              src={branding?.logo ?? logo}
              className="max-h-[54px] max-w-[160px] object-contain"
              alt={branding?.company?.name ? `${branding.company.name} Logo` : "Portal Logo"}
            />
          </a>
        )}
        {/* Centered Free Trial Button */}
        {/* <div className="absolute left-1/2 transform -translate-x-1/2">
          <button className="bg-[#288DD11A] rounded-[10px] py-3 px-9 text-center font-normal text-base text-[#288DD1]">
            Free Trial
          </button>
        </div> */}
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center">
            {isProfileFetching ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1C1C1C33] font-semibold text-sm text-center flex items-center justify-center">
                {getInitials(profile?.first_name, profile?.last_name) || "--"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 py-3 z-[999] border-b bg-white flex md:hidden justify-between items-center font-Outfit"
        style={{
          borderColor: designTokens.colors.neutral[200],
          boxShadow: designTokens.shadows.xs,
        }}
      >
        <div className="flex items-center space-x-3">
          <button onClick={onMenuClick}>
            <Menu />
          </button>
          <p className="font-semibold text-base text-[#1C1C1C]">{activePageName}</p>
        </div>
        <div className="flex items-center border border-[#ECEDF0] justify-center rounded-[8px] w-10 h-10">
          <BellRing className="text-[#1C1C1C] w-4" />
        </div>
      </div>
    </>
  );
};

export default Headbar;
