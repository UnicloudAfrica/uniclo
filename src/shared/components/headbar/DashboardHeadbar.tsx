import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, HelpCircle, Settings, LogOut, ChevronDown, Sun, Moon } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import NotificationCenter from "../NotificationCenter";
import { useTheme } from "@/shared/hooks/useTheme";
import {
  GlobalSearchTrigger,
  type CommandPaletteItem,
} from "@/shared/components/command-palette";
import {
  TenantThemeSwitcher,
  SettingsDrawer,
  useSettingsHotkey,
  useTenantThemeEnforcer,
} from "@/shared/components/shell";
import useShellPreferencesStore from "@/stores/shellPreferencesStore";

const logoCache = new Map<string, string>();

export interface DashboardHeadbarProps {
  /** Dashboard type for context-aware styling */
  dashboardType: "admin" | "client" | "tenant";
  /** Callback for mobile menu toggle */
  onMobileMenuToggle?: () => void;
  /** User profile information */
  userProfile?: {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    avatar?: string | undefined;
    initials?: string | undefined;
  };
  /** Logo configuration */
  logo?: {
    src: string;
    alt?: string;
    link?: string;
    className?: string;
    fallbackSrc?: string;
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
  /**
   * Items powering the global ⌘K search bar in the centre of the headbar.
   * When provided, a `<GlobalSearchTrigger />` is rendered. Omit to hide.
   */
  searchItems?: CommandPaletteItem[];
}

const DashboardHeadbar: React.FC<DashboardHeadbarProps> = ({
  dashboardType,
  onMobileMenuToggle,
  userProfile,
  logo,
  themeColor: _themeColor = designTokens.colors.primary[500],
  onLogout,
  logoutPath = "/sign-in",
  profilePath,
  showNotifications = true,
  showHelp = true,
  helpPath,
  isProfileLoading = false,
  isThemeLoading = false,
  searchItems,
}) => {
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { toggleTheme, isDark } = useTheme();
  const setSettingsOpen = useShellPreferencesStore((state) => state.setSettingsOpen);

  // Bind the global ⌘, shortcut for opening the shell settings drawer.
  useSettingsHotkey();
  // Keep the active tenant palette winning even when the branding hook
  // re-runs and rewrites root inline styles (race fix).
  useTenantThemeEnforcer();

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
      "object-storage": "Silo Storage",
    },
    client: {
      "client-dashboard": "Home",
      projects: "Projects",
      instances: "Instances",
      "orders-payments": "Orders & Payments",
      security: "Security",
      support: "Support",
      "account-settings": "Account Settings",
      "object-storage": "Silo Storage",
      "pricing-calculator": "Pricing Calculator",
    },
    tenant: {
      dashboard: "Home",
      modules: "Modules",
      "instances-request": "Instances Request",
      "payment-history": "Payment History",
      "support-ticket": "Support Ticket",
      account: "Account Settings",
      leads: "Leads",
      revenue: "Revenue",
      "region-requests": "Region Requests",
      onboarding: "Onboarding Review",
      "object-storage": "Silo Storage",
    },
  };

  const getActivePageName = (): string => {
    const pathSegments = location.pathname.split("/").filter((s) => s);
    if (pathSegments.length === 0) return "Dashboard";
    const lastSegment = pathSegments[pathSegments.length - 1] ?? "";
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
      globalThis.window.location.href = logoutPath;
    }
    setIsProfileOpen(false);
  };

  const defaultLogo: {
    src: string;
    alt: string;
    link: string;
    className?: string;
    fallbackSrc?: string;
  } = {
    src: "/logo.svg",
    alt: `${dashboardType.charAt(0).toUpperCase() + dashboardType.slice(1)} Portal`,
    link: `/ ${dashboardType} -dashboard`,
  };

  const logoConfig = logo || defaultLogo;
  const cacheKey = `${dashboardType}:${logoConfig.alt || ""} `;
  const isFallbackLogo =
    logoConfig.src === logoConfig.fallbackSrc || logoConfig.src === defaultLogo.src;
  const cachedLogo = logoCache.get(cacheKey);
  const resolvedLogoSrc =
    (isFallbackLogo && cachedLogo) || logoConfig.src || logoConfig.fallbackSrc || defaultLogo.src;
  const [logoSrc, setLogoSrc] = useState(resolvedLogoSrc);

  useEffect(() => {
    const nextIsFallback =
      logoConfig.src === logoConfig.fallbackSrc || logoConfig.src === defaultLogo.src;
    const nextCached = logoCache.get(cacheKey);
    const nextSrc =
      (nextIsFallback && nextCached) || logoConfig.src || logoConfig.fallbackSrc || defaultLogo.src;
    setLogoSrc(nextSrc);
    if (!nextIsFallback && logoConfig.src) {
      logoCache.set(cacheKey, logoConfig.src);
    }
  }, [logoConfig.src, logoConfig.fallbackSrc, defaultLogo.src, cacheKey]);

  const handleLogoError = () => {
    const fallback = logoConfig.fallbackSrc || defaultLogo.src;
    if (fallback && logoSrc !== fallback) {
      setLogoSrc(fallback);
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div
        className="w-full fixed top-0 left-0 h-[74px] px-6 md:px-8 py-3 z-[999] border-b bg-white hidden md:flex justify-between items-center font-Outfit"
        style={{
          borderColor: "var(--theme-border-color)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        {/* Left Section - Logo */}
        <div className="flex shrink-0 items-center gap-6">
          {isThemeLoading ? (
            <div className="w-[110px] h-[48px] bg-gray-200 rounded animate-pulse" />
          ) : (
            <Link to={logoConfig.link || "/"} className="inline-flex items-center">
              <img
                src={logoSrc}
                className={logoConfig.className || "w-auto h-[54px] max-w-[160px] object-contain"}
                alt={logoConfig.alt}
                onError={handleLogoError}
              />
            </Link>
          )}
        </div>

        {/* Centre — global ⌘K search trigger */}
        {searchItems && searchItems.length > 0 ? (
          <div className="mx-6 hidden flex-1 justify-center md:flex">
            <GlobalSearchTrigger items={searchItems} />
          </div>
        ) : null}

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Tenant theme switcher (whitelabel preview) */}
          <TenantThemeSwitcher />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn p-2 rounded-lg transition-all duration-300"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              backgroundColor: isDark ? "rgba(56, 163, 235, 0.12)" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!isDark) e.currentTarget.style.backgroundColor = "var(--theme-color-10)";
            }}
            onMouseLeave={(e) => {
              if (!isDark) e.currentTarget.style.backgroundColor = "transparent";
              else e.currentTarget.style.backgroundColor = "rgba(56, 163, 235, 0.12)";
            }}
          >
            {isDark ? (
              <Sun size={20} className="transition-transform duration-300" style={{ color: "#fbbf24" }} />
            ) : (
              <Moon size={20} style={{ color: "var(--theme-muted-color)" }} className="transition-transform duration-300" />
            )}
          </button>

          {/* Display settings (nav variant + density + dark mode) */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            title="Display settings (⌘,)"
            aria-label="Open display settings"
            style={{ color: "var(--theme-muted-color)" }}
          >
            <Settings size={20} />
          </button>

          {/* Help Button */}
          {showHelp && helpPath && (
            <Link
              to={helpPath}
              className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              style={{ color: "var(--theme-muted-color)" }}
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
                className="w-9 h-9 rounded-full font-semibold text-sm text-white flex items-center justify-center"
                style={{
                  // Brand → secondary gradient (matches reference avatar)
                  background:
                    "linear-gradient(135deg, var(--theme-color), var(--secondary-color))",
                  boxShadow: "var(--shadow-xs)",
                }}
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
                    <div className="text-sm font-semibold" style={{ color: "var(--theme-heading-color)" }}>
                      {userProfile?.email || "No email"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--theme-muted-color)" }}>
                      {userProfile?.firstName || userProfile?.lastName
                        ? `${userProfile.firstName || ""} ${userProfile.lastName || ""} `.trim()
                        : "No name"}
                    </div>
                  </>
                )}
              </div>
              <ChevronDown
                size={16}
                style={{ color: "var(--theme-muted-color)" }}
                className="transition-transform duration-200"
              />
            </button>

            {isProfileOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-64 bg-white border shadow-lg z-[1000] overflow-hidden"
                style={{
                  borderColor: "var(--theme-border-color)",
                  borderRadius: designTokens.borderRadius.xl,
                  boxShadow: designTokens.shadows.lg,
                }}
              >
                {profilePath && (
                  <>
                    <Link
                      to={profilePath}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors duration-200"
                      style={{ color: "var(--theme-heading-color)" }}
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings size={18} />
                      Account Settings
                    </Link>

                    <hr style={{ borderColor: "var(--theme-border-color)" }} />
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
          borderColor: "var(--theme-border-color)",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            style={{ color: "var(--theme-muted-color)" }}
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-base" style={{ color: "var(--theme-heading-color)" }}>{activePageName}</h1>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition-all duration-300"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              backgroundColor: isDark ? "rgba(56, 163, 235, 0.12)" : "transparent",
            }}
          >
            {isDark ? (
              <Sun size={18} style={{ color: "#fbbf24" }} />
            ) : (
              <Moon size={18} style={{ color: "var(--theme-muted-color)" }} />
            )}
          </button>
          {showNotifications && <NotificationCenter />}
        </div>
      </div>

      {/* Shell-wide display settings drawer (mounted once per headbar). */}
      <SettingsDrawer />
    </>
  );
};

export default DashboardHeadbar;
