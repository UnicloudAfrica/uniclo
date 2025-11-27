import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import home from "./assets/home.png";
import activeHome from "./assets/activeHome.png";
import modules from "./assets/module.png";
import activemodules from "./assets/activeModule.png";
import clients from "./assets/clients.png";
import activeClients from "./assets/activeClients.png";
import paymentHistory from "./assets/history.png";
import activePaymentHistory from "./assets/activeHistory.png";
import supportTicket from "./assets/support.png";
import activeSupportTicket from "./assets/activeSupport.png";
import appSettings from "./assets/settings.png";
import {
  LogOut,
  X,
  Users,
  MapPin,
  DollarSign,
  ClipboardList,
  HardDrive,
} from "lucide-react";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import { clearAllAuthSessions } from "../../stores/sessionUtils";

const Sidebar = ({ tenantData, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Map of paths to menu item names
  const pathToItemMap = {
    "/dashboard": "Home",
    "/dashboard/modules": "Modules",
    "/dashboard/instances-request": "Instances Request",
    "/tenant-dashboard/leads": "Leads",
    "/tenant-dashboard/region-requests": "Region Requests",
    "/tenant-dashboard/revenue": "Revenue",
    "/tenant-dashboard/onboarding": "Onboarding Review",
    "/tenant-dashboard/onboarding-review": "Onboarding Review",
    "/tenant-dashboard/object-storage": "Object Storage",
    "/dashboard/payment-history": "Payment History",
    "/dashboard/support-ticket": "Support Ticket",
    "/dashboard/app-settings": "App Settings",
  };

  // Update activeTab based on the current path
  useEffect(() => {
    const currentPath = location.pathname;
    const itemName = pathToItemMap[currentPath] || "Home";
    setActiveTab(itemName.toLowerCase());
  }, [location.pathname, setActiveTab]);

  const menuItems = [
    { name: "Home", icon: home, activeIcon: activeHome, path: "/dashboard" },
    {
      name: "Modules",
      icon: modules,
      activeIcon: activemodules,
      path: "/dashboard/modules",
    },
    {
      name: "Instances Request",
      icon: clients,
      activeIcon: activeClients,
      path: "/dashboard/instances-request",
    },
    {
      name: "Object Storage",
      icon: HardDrive,
      activeIcon: HardDrive,
      path: "/tenant-dashboard/object-storage",
      isLucide: true,
    },
    {
      name: "Leads",
      icon: clients, // Using clients icon temporarily - you can add a specific leads icon
      activeIcon: activeClients,
      path: "/tenant-dashboard/leads",
    },
    {
      name: "Region Requests",
      icon: MapPin,
      activeIcon: MapPin,
      path: "/tenant-dashboard/region-requests",
      isLucide: true,
    },
    {
      name: "Onboarding Review",
      icon: ClipboardList,
      activeIcon: ClipboardList,
      path: "/tenant-dashboard/onboarding",
      isLucide: true,
    },
    {
      name: "Revenue",
      icon: DollarSign,
      activeIcon: DollarSign,
      path: "/tenant-dashboard/revenue",
      isLucide: true,
    },
    {
      name: "Payment History",
      icon: paymentHistory,
      activeIcon: activePaymentHistory,
      path: "/dashboard/payment-history",
    },
    {
      name: "Support Ticket",
      icon: supportTicket,
      activeIcon: activeSupportTicket,
      path: "/dashboard/support-ticket",
    },
  ];

  const settingsItem = {
    name: "App Settings",
    icon: appSettings,
    activeIcon: appSettings,
    path: "/dashboard/app-settings",
  };

  const handleItemClick = (itemName, path) => {
    setActiveTab(itemName.toLowerCase());
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleLogout = () => {
    clearAllAuthSessions();
    navigate("/login"); // Redirect to login page
    setIsMobileMenuOpen(false); // Close mobile menu if open
  };

  const renderMenuItem = (item, isBottom = false) => {
    const isActive = activeTab === item.name.toLowerCase();

    return (
      <li key={item.name} className={isBottom ? "mt-auto" : ""}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-3.5 space-x-2 text-left transition-all duration-200 hover:bg-gray-50 ${
            isActive ? "text-[#1C1C1C]" : "text-[#676767] hover:text-[#1C1C1C]"
          }`}
          style={{
            backgroundColor: isActive ? tenantData.color + "15" : "transparent",
            transition: "background-color 0.3s",
          }}
        >
          <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
            {isActive && (
              <div className="absolute left-[-14px] w-1 h-4 bg-[tenantData.color] rounded-[3px]" />
            )}
            {item.isLucide ? (
              <item.icon size={16} className="flex-shrink-0" />
            ) : (
              <img
                src={isActive ? item.activeIcon : item.icon}
                className="w-4 h-4"
                alt={item.name}
              />
            )}
          </div>
          <span className="text-sm font-normal md:hidden lg:block font-Outfit">
            {item.name}
          </span>
        </button>
      </li>
    );
  };

  const renderMobileMenuItem = (item) => {
    const isActive = activeTab === item.name.toLowerCase();

    return (
      <li key={item.name}>
        <button
          onClick={() => handleItemClick(item.name, item.path)}
          className={`w-full flex items-center py-2 px-4 space-x-3 text-left transition-all duration-200 rounded-lg ${
            isActive
              ? "bg-[tenantData.color] text-white"
              : "text-gray-200 hover:bg-[tenantData.color] hover:text-white"
          }`}
          style={{
            transition: "background-color 0.3s, color 0.3s",
          }}
        >
          <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
            {item.isLucide ? (
              <item.icon size={16} className="brightness-0 invert" />
            ) : (
              <img
                src={isActive ? item.activeIcon : item.icon}
                className="w-4 h-4 brightness-0 invert"
                alt={item.name}
              />
            )}
          </div>
          <span className="text-xs font-medium">{item.name}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-[74px] left-0 z-[999] w-[80%] md:w-20 lg:w-[20%] h-full border-r border-[tenantData.color]20 bg-white font-Outfit">
        <div className="flex flex-col h-full">
          <div className="px-3 py-4 md:px-3.5 md:py-6 w-full border-b border-[tenantData.color]20">
            <button className="py-1 px-2 text-[#676767] font-normal text-sm lg:text-sm">
              Menu
            </button>
            <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
              <ul className="flex flex-col h-full w-full">
                {menuItems.map((item) => renderMenuItem(item))}
                {renderMenuItem(settingsItem)}
                <button
                  className="w-full flex items-center py-2 px-4 space-x-2 text-left text-[#DC3F41] hover:bg-[tenantData.color]10 rounded-lg transition-colors duration-200"
                  onClick={handleLogout}
                  style={{ transition: "background-color 0.3s" }}
                >
                  <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                    <LogOut />
                  </div>
                  <span className="text-xs font-medium hidden lg:flex">
                    Logout
                  </span>
                </button>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Overlay Sidebar */}
      <div className="md:hidden">
        {/* Overlay Background */}
        <div
          className={`fixed inset-0 bg-black z-[999] transition-all duration-300 ease-in-out ${
            isMobileMenuOpen
              ? "bg-opacity-50 pointer-events-auto"
              : "bg-opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Sidebar Panel */}
          <div
            className={`fixed top-0 left-0 h-full w-[280px] bg-[tenantData.color] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-[tenantData.color]20">
              <div className="flex items-center">
                <img
                  src={tenantData.logo}
                  className="w-[40px] mr-2 rounded"
                  alt={`${tenantData.name} Logo`}
                />
                <h2 className="text-lg font-semibold">{tenantData.name}</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:bg-[tenantData.color]20 p-2 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <ul className="space-y-1 px-4">
                {menuItems.map((item) => renderMobileMenuItem(item))}
                {renderMobileMenuItem(settingsItem)}
                <li>
                  <button
                    className="w-full flex items-center py-3 px-4 space-x-3 text-left text-[#DC3F41] hover:bg-[tenantData.color]20 rounded-lg transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <LogOut />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div className="text-xs text-white80 font-Outfit px-6 py-4 border-t border-[tenantData.color]20">
              Version 1.0 - Live • Terms of Service
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Toggle Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-[1000] p-2 bg-white rounded-lg shadow-md"
        onClick={() => setIsMobileMenuOpen(true)}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          />
        </svg>
      </button>
    </>
  );
};

export default Sidebar;
