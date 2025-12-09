// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  X,
  Home,
  Layers,
  Server,
  UserPlus,
  MapPin,
  DollarSign,
  ClipboardList,
  HardDrive,
  Calculator,
  FileText,
  CreditCard,
  HelpCircle,
  Settings,
  Percent,
} from "lucide-react";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import { CollapsibleMenu, MenuEntry } from "../../shared/components/sidebar";

interface TenantData {
  name?: string;
  logo?: string;
  color?: string;
  [key: string]: any;
}

interface TenantSidebarProps {
  tenantData?: TenantData;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const TenantSidebar: React.FC<TenantSidebarProps> = ({ tenantData, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update activeTab based on the current path
  useEffect(() => {
    if (!setActiveTab) return;

    const currentPath = location.pathname;
    // Simple path matching for active tab
    if (currentPath.includes("modules")) setActiveTab("modules");
    else if (currentPath.includes("instances-request")) setActiveTab("instances request");
    else if (currentPath.includes("object-storage")) setActiveTab("object storage");
    else if (currentPath.includes("leads")) setActiveTab("leads");
    else if (currentPath.includes("region-requests")) setActiveTab("region requests");
    else if (currentPath.includes("onboarding")) setActiveTab("onboarding review");
    else if (currentPath.includes("revenue")) setActiveTab("revenue");
    else if (currentPath.includes("pricing-calculator")) setActiveTab("pricing calculator");
    else if (currentPath.includes("create-invoice")) setActiveTab("generate invoice");
    else if (currentPath.includes("payment-history")) setActiveTab("payment history");
    else if (currentPath.includes("support-ticket")) setActiveTab("support ticket");
    else if (currentPath.includes("app-settings")) setActiveTab("app settings");
    else setActiveTab("home");
  }, [location.pathname, setActiveTab]);

  // Menu items with collapsible groups
  const menuItems: MenuEntry[] = [
    {
      name: "Home",
      icon: Home,
      isLucide: true,
      path: "/dashboard",
    },
    {
      name: "Modules",
      icon: Layers,
      isLucide: true,
      path: "/dashboard/modules",
    },
    // Client Management Group
    {
      name: "Client Management",
      icon: Server,
      isLucide: true,
      children: [
        {
          name: "Instances Request",
          icon: Server,
          isLucide: true,
          path: "/dashboard/instances-request",
        },
        {
          name: "Object Storage",
          icon: HardDrive,
          isLucide: true,
          path: "/tenant-dashboard/object-storage",
        },
        {
          name: "Leads",
          icon: UserPlus,
          isLucide: true,
          path: "/tenant-dashboard/leads",
        },
      ],
    },
    // Regional Group
    {
      name: "Regional",
      icon: MapPin,
      isLucide: true,
      children: [
        {
          name: "Region Requests",
          icon: MapPin,
          isLucide: true,
          path: "/tenant-dashboard/region-requests",
        },
        {
          name: "Onboarding Review",
          icon: ClipboardList,
          isLucide: true,
          path: "/tenant-dashboard/onboarding",
        },
      ],
    },
    // Billing Group
    {
      name: "Billing",
      icon: DollarSign,
      isLucide: true,
      children: [
        {
          name: "Revenue",
          icon: DollarSign,
          isLucide: true,
          path: "/tenant-dashboard/revenue",
        },
        {
          name: "Pricing Calculator",
          icon: Calculator,
          isLucide: true,
          path: "/dashboard/pricing-calculator",
        },
        {
          name: "Generate Invoice",
          icon: FileText,
          isLucide: true,
          path: "/dashboard/create-invoice",
        },
        {
          name: "Payment History",
          icon: CreditCard,
          isLucide: true,
          path: "/dashboard/payment-history",
        },
        {
          name: "Discounts & Margins",
          icon: Percent,
          isLucide: true,
          path: "/tenant-dashboard/discounts",
        },
      ],
    },
    // Standalone items
    {
      name: "Support Ticket",
      icon: HelpCircle,
      isLucide: true,
      path: "/dashboard/support-ticket",
    },
    {
      name: "App Settings",
      icon: Settings,
      isLucide: true,
      path: "/dashboard/app-settings",
    },
  ];

  const handleItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    clearAllAuthSessions();
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  const themeColor = tenantData?.color || "#14547F";

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:block fixed top-[74px] left-0 z-[999] w-[80%] md:w-20 lg:w-[20%] h-full border-r bg-white font-Outfit"
        style={{ borderColor: `${themeColor}20` }}
      >
        <div className="flex flex-col h-full">
          <div
            className="px-3 py-4 md:px-3.5 md:py-6 w-full border-b"
            style={{ borderColor: `${themeColor}20` }}
          >
            <button className="py-1 px-2 text-[#676767] font-normal text-sm lg:text-sm hidden lg:block">
              TENANT
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto w-full mt-3 px-2">
            <CollapsibleMenu
              items={menuItems}
              onItemClick={handleItemClick}
              themeColor={themeColor}
            />
            <ul className="mt-4">
              <li>
                <button
                  className="w-full flex items-center py-2 px-4 space-x-2 text-left text-[#DC3F41] hover:bg-red-50 rounded-lg transition-colors duration-200"
                  onClick={handleLogout}
                >
                  <div className="flex items-center justify-center w-4 h-4 flex-shrink-0">
                    <LogOut size={16} />
                  </div>
                  <span className="text-sm font-medium hidden lg:flex">Logout</span>
                </button>
              </li>
            </ul>
          </nav>
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
            className={`fixed top-0 left-0 h-full w-[280px] text-white flex flex-col transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ backgroundColor: themeColor }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex justify-between items-center p-6 border-b"
              style={{ borderColor: `${themeColor}20` }}
            >
              <div className="flex items-center">
                {tenantData?.logo && (
                  <img
                    src={tenantData.logo}
                    className="w-[40px] mr-2 rounded"
                    alt={`${tenantData.name} Logo`}
                  />
                )}
                <h2 className="text-lg font-semibold">{tenantData?.name}</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
              <CollapsibleMenu
                items={menuItems}
                isMobile={true}
                onItemClick={handleItemClick}
                themeColor={themeColor}
              />
              <ul className="space-y-1 px-4 mt-2">
                <li>
                  <button
                    className="w-full flex items-center py-3 px-4 space-x-3 text-left text-[#DC3F41] hover:bg-white/15 rounded-lg transition-colors duration-200"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                      <LogOut size={16} />
                    </div>
                    <span className="text-xs font-medium">Logout</span>
                  </button>
                </li>
              </ul>
            </nav>

            <div
              className="text-xs text-white/80 font-Outfit px-6 py-4 border-t"
              style={{ borderColor: `${themeColor}20` }}
            >
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

export default TenantSidebar;
