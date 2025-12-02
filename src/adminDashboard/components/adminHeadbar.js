import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  Moon,
  Sun,
  HelpCircle,
  LogOut,
  Menu,
} from "lucide-react";
import logo from "./assets/logo.png";
import { Link, useLocation } from "react-router-dom";
import { designTokens } from "../../styles/designTokens";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { clearAllAuthSessions } from "../../stores/sessionUtils";

const AdminHeadbar = ({ onMenuClick }) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const profileRef = useRef(null);
  const notificationRef = useRef(null);

  // Map URL path segments to human-readable names - extended mapping
  const pathMap = {
    "admin-dashboard": "Dashboard",
    dashboard: "Dashboard",
    modules: "Modules",
    partners: "Tenants & Users",
    clients: "Clients",
    payment: "Payment",
    leads: "Leads",
    products: "Products",
    inventory: "Inventory",
    pricing: "Pricing",
    calculator: "Calculator",
    "pricing-calculator": "Calculator",
    "create-invoice": "Generate Invoice",
    projects: "Projects",
    regions: "Regions",
    "tax-configuration": "Tax Configuration",
    "admin-users": "Admin Users",
    "key-pairs": "Key Pairs",
    "country-pricing": "Country Pricing",
    "support-ticket": "Support Ticket",
    "enhanced-profile-settings": "Profile Settings",
    overview: "Overview",
    details: "Details",
  };

  // Get the active page name
  const getActivePageName = () => {
    const pathSegments = location.pathname
      .split("/")
      .filter((segment) => segment);
    if (pathSegments.length === 0) return "Dashboard";
    const lastSegment = pathSegments[pathSegments.length - 1];
    return (
      pathMap[lastSegment] ||
      lastSegment.charAt(0).toUpperCase() +
      lastSegment.slice(1).replace(/-/g, " ")
    );
  };

  const activePageName = getActivePageName();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAllAuthSessions();
    window.location.href = "/admin-signin";
  };

  // Dummy notifications for demo
  const notifications = [
    {
      id: 1,
      title: "New lead created",
      message: "John Doe submitted a new lead request",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: 2,
      title: "Instance deployed",
      message: "Instance i-1234567 has been successfully deployed",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "Payment received",
      message: "Payment of $299.99 has been processed",
      time: "3 hours ago",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const user = {
    name: "Admin User",
    email: "admin@unicloudafrica.com",
    avatar: null,
  };

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
        {/* Left Section - Logo and Search */}
        <div className="flex items-center gap-6 flex-1">
          <img src={logo} className="w-[71px] h-[54px]" alt="UniCloud Logo" />

          {/* Search Bar - Hidden on smaller screens */}
          {/* <div className="relative max-w-md flex-1 hidden lg:block">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200"
              style={{
                color: isSearchFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[400]
              }}
            />
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full h-10 pl-10 pr-4 text-sm transition-all duration-200 outline-none font-Outfit"
              style={{
                border: `1px solid ${isSearchFocused ? designTokens.colors.primary[300] : designTokens.colors.neutral[300]}`,
                borderRadius: designTokens.borderRadius.lg,
                backgroundColor: designTokens.colors.neutral[50]
              }}
            />
          </div> */}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          {/* <button
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button> */}

          {/* Help Button */}
          <Link
            to="/admin-dashboard/support-ticket"
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
          >
            <HelpCircle size={20} />
          </Link>

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-medium flex items-center justify-center border-2 border-white"
                  style={{ backgroundColor: designTokens.colors.error[500] }}
                >
                  {unreadCount}
                </div>
              )}
            </button>

            {isNotificationOpen && (
              <div
                className="absolute top-full right-0 mt-2 w-80 bg-white border shadow-lg z-[1000] overflow-hidden"
                style={{
                  borderColor: designTokens.colors.neutral[200],
                  borderRadius: designTokens.borderRadius.xl,
                  boxShadow: designTokens.shadows.lg,
                }}
              >
                <div
                  className="p-4 border-b"
                  style={{ borderColor: designTokens.colors.neutral[200] }}
                >
                  <h3 className="font-semibold text-sm">Notifications</h3>
                </div>

                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b cursor-pointer transition-colors duration-200 hover:bg-gray-50"
                    style={{
                      borderColor: designTokens.colors.neutral[100],
                      backgroundColor: notification.unread
                        ? designTokens.colors.primary[25]
                        : "transparent",
                    }}
                  >
                    <div className="font-medium text-sm mb-1">
                      {notification.title}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">
                      {notification.message}
                    </div>
                    <div className="text-xs text-gray-500">
                      {notification.time}
                    </div>
                  </div>
                ))}

                <div className="p-3 text-center">
                  <button
                    className="text-sm font-medium transition-colors duration-200"
                    style={{ color: designTokens.colors.primary[600] }}
                  >
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="flex items-center gap-3 p-2 rounded-xl transition-colors duration-200 hover:bg-gray-50"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div
                className="w-8 h-8 rounded-full font-semibold text-sm text-white flex items-center justify-center"
                style={{ backgroundColor: designTokens.colors.primary[500] }}
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  "AD"
                )}
              </div>
              <div className="text-left hidden xl:block">
                <div className="text-sm font-semibold text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-600">{user.email}</div>
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
                <Link
                  to="/admin-dashboard/profile-settings"
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <User size={18} />
                  Profile Settings
                </Link>

                <Link
                  to="/admin-dashboard/profile-settings"
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <Settings size={18} />
                  Account Settings
                </Link>

                <hr style={{ borderColor: designTokens.colors.neutral[200] }} />

                <button
                  className="w-full flex items-center gap-3 p-3 text-left transition-colors duration-200"
                  onClick={handleLogout}
                  style={{
                    color: designTokens.colors.error[600],
                    ":hover": {
                      backgroundColor: designTokens.colors.error[50],
                    },
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor =
                      designTokens.colors.error[50];
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = "transparent";
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
            onClick={onMenuClick}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-base text-gray-900">
            {activePageName}
          </h1>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Notifications */}
          <button
            className="relative p-2 rounded-lg border transition-colors duration-200 hover:bg-gray-50"
            style={{ borderColor: designTokens.colors.neutral[200] }}
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs font-medium flex items-center justify-center"
                style={{ backgroundColor: designTokens.colors.error[500] }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminHeadbar;
