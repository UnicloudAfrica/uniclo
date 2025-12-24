import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, Bell, HelpCircle, User, Settings, LogOut, ChevronDown } from "lucide-react";
import { designTokens } from "../../../styles/designTokens";
import NotificationCenter from "../NotificationCenter";

export interface DashboardHeadbarProps {
  /** Dashboard type for context-aware styling */
  dashboardType: "admin" | "client" | "tenant";
  /** Callback for mobile menu toggle */
  onMobileMenuToggle?: () => void;
  /** User profile information */
  userProfile?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    initials?: string;
  };
  /** Logo configuration */
  logo?: {
    src: string;
    alt?: string;
    link?: string;
    className?: string;
  };
  /** Theme color for branding (hex color) */
  themeColor?: string;
  /** Custom logout handler */
  onLogout?: () => void;
  /** Logout redirect path */
  logoutPath?: string;
  /** Profile settings path */
  profilePath?: string;
  /** Show notifications bell */
  showNotifications?: boolean;
  /** Show help icon */
  showHelp?: boolean;
  /** Help link path */
  helpPath?: string;
  /** Loading state for profile */
  isProfileLoading?: boolean;
  /** Loading state for logo/theme */
  isThemeLoading?: boolean;
}

const DashboardHeadbar: React.FC<DashboardHeadbarProps> = ({
  dashboardType,
  onMobileMenuToggle,
  userProfile,
  logo,
  themeColor = designTokens.colors.primary[500],
  onLogout,
  logoutPath = "/sign-in",
  profilePath,
  showNotifications = true,
  showHelp = true,
  helpPath,
  isProfileLoading = false,
  isThemeLoading = false,
}) => {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Path mapping for page titles
  const pathMaps: Record<string, Record<string, string>> = {
    admin: {
      "admin-dashboard": "Dashboard",
      partners: "Tenants & Users",
      clients: "Clients",
      payment: "Payment",
      leads: "Leads",
      products: "Products",
      inventory: "Inventory",
      pricing: "Pricing",
      "pricing-calculator": "Calculator",
      "create-invoice": "Generate Invoice",
      projects: "Projects",
      regions: "Regions",
      "tax-configuration": "Tax Configuration",
      account: "Account Settings",
      instances: "Instances",
      "object-storage": "Object Storage",
    },
    client: {
      "client-dashboard": "Home",
      projects: "Projects",
      instances: "Instances",
      "orders-payments": "Orders & Payments",
      security: "Security",
      support: "Support",
      "account-settings": "Account Settings",
      "object-storage": "Object Storage",
      "pricing-calculator": "Pricing Calculator",
    },
    tenant: {
      dashboard: "Home",
      modules: "Modules",
      "instances-request": "Instances Request",
      "payment-history": "Payment History",
      "support-ticket": "Support Ticket",
      "app-settings": "App Settings",
      leads: "Leads",
      revenue: "Revenue",
      "region-requests": "Region Requests",
      onboarding: "Onboarding Review",
      "object-storage": "Object Storage",
    },
  };

  const getActivePageName = (): string => {
    const pathSegments = location.pathname.split("/").filter((s) => s);
    if (pathSegments.length === 0) return "Dashboard";
    const lastSegment = pathSegments[pathSegments.length - 1];
    const pathMap = pathMaps[dashboardType] || {};
    return (
      pathMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, " ")
    );
  };

  const getInitials = (): string => {
    if (userProfile?.initials) return userProfile.initials;
    const first = userProfile?.firstName?.trim()?.[0]?.toUpperCase() || "";
    const last = userProfile?.lastName?.trim()?.[0]?.toUpperCase() || "";
    return first + last || "--";
  };

  const activePageName = getActivePageName();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = logoutPath;
    }
    setIsProfileOpen(false);
  };

  const defaultLogo: {
    src: string;
    alt: string;
    link: string;
    className?: string;
  } = {
    src: "/logo.svg",
    alt: `${dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Portal`,
    link: `/${dashboardType}-dashboard`,
  };

  const logoConfig = logo || defaultLogo;

  return (
    <>
      {/* Desktop Layout */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-white hidden md:flex justify-between items-center font-Outfit"
        style={{
          borderColor: designTokens.colors.neutral[200],
          boxShadow: designTokens.shadows.xs,
        }}
      >
        {/* Left Section - Logo */}
        <div className="flex items-center gap-6">
          {isThemeLoading ? (
            <div className="w-[110px] h-[48px] bg-gray-200 rounded animate-pulse" />
          ) : (
            <Link to={logoConfig.link || "/"} className="inline-flex items-center">
              <img
                src={logoConfig.src}
                className={logoConfig.className || "w-auto h-[54px] max-w-[160px] object-contain"}
                alt={logoConfig.alt}
              />
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Help Button */}
          {showHelp && helpPath && (
            <Link
              to={helpPath}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            >
              <HelpCircle size={20} />
            </Link>
          )}

          {/* Notifications */}
          {showNotifications && <NotificationCenter />}

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-3 p-2 rounded-xl transition-colors duration-200 hover:bg-gray-50"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div
                className="w-8 h-8 rounded-full font-semibold text-sm text-white flex items-center justify-center"
                style={{ backgroundColor: themeColor }}
              >
                {userProfile?.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.firstName || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  getInitials()
                )}
              </div>
              <div className="text-left hidden xl:block">
                {isProfileLoading ? (
                  <>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="text-sm font-semibold text-gray-900">
                      {userProfile?.email || "No email"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {userProfile?.firstName || userProfile?.lastName
                        ? `${userProfile.firstName || ""} ${userProfile.lastName || ""}`.trim()
                        : "No name"}
                    </div>
                  </>
                )}
              </div>
              <ChevronDown
                size={16}
                className="text-gray-500 transition-transform duration-200"
                style={{
                  transform: isProfileOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>

            {isProfileOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-64 bg-white border shadow-lg z-[1000] overflow-hidden"
                style={{
                  borderColor: designTokens.colors.neutral[200],
                  borderRadius: designTokens.borderRadius.xl,
                  boxShadow: designTokens.shadows.lg,
                }}
              >
                {profilePath && (
                  <>
                    <Link
                      to={profilePath}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors duration-200"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={18} />
                      Account Settings
                    </Link>

                    <hr style={{ borderColor: designTokens.colors.neutral[200] }} />
                  </>
                )}

                <button
                  className="w-full flex items-center gap-3 p-3 text-left transition-colors duration-200"
                  onClick={handleLogoutClick}
                  style={{
                    color: designTokens.colors.error[600],
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = designTokens.colors.error[50];
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 py-3 z-[999] border-b bg-white flex md:hidden justify-between items-center font-Outfit"
        style={{
          borderColor: designTokens.colors.neutral[200],
          boxShadow: designTokens.shadows.xs,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-base text-gray-900">{activePageName}</h1>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2">{showNotifications && <NotificationCenter />}</div>
      </div>
    </>
  );
};

export default DashboardHeadbar;
