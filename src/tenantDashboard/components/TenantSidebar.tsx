// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  X,
  Home,
  Layers,
  Server,
  Users,
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
  FolderKanban,
  Package,
  Wallet,
  TrendingUp,
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
    if (currentPath.includes("clients")) setActiveTab("clients");
    else if (currentPath.includes("leads")) setActiveTab("leads");
    else if (currentPath.includes("projects")) setActiveTab("projects");
    else if (currentPath.includes("instances")) setActiveTab("instances");
    else if (currentPath.includes("object-storage")) setActiveTab("object-storage");
    else if (currentPath.includes("region-requests")) setActiveTab("region-requests");
    else if (currentPath.includes("onboarding")) setActiveTab("onboarding");
    else if (currentPath.includes("revenue")) setActiveTab("revenue");
    else if (currentPath.includes("pricing-calculator")) setActiveTab("pricing-calculator");
    else if (currentPath.includes("create-invoice")) setActiveTab("create-invoice");
    else if (currentPath.includes("payment-history")) setActiveTab("payment-history");
    else if (currentPath.includes("discounts")) setActiveTab("discounts");
    else if (currentPath.includes("payouts")) setActiveTab("payouts");
    else if (currentPath.includes("products")) setActiveTab("products");
    else if (currentPath.includes("support")) setActiveTab("support");
    else if (currentPath.includes("settings") || currentPath.includes("app-settings"))
      setActiveTab("settings");
    else setActiveTab("home");
  }, [location.pathname, setActiveTab]);

  // Unified Menu Items - All using /dashboard prefix
  const menuItems: MenuEntry[] = [
    {
      name: "Home",
      icon: Home,
      isLucide: true,
      path: "/dashboard",
    },

    // Customer Management Group
    {
      name: "Customer Management",
      icon: Users,
      isLucide: true,
      children: [
        {
          name: "Clients",
          icon: Users,
          isLucide: true,
          path: "/dashboard/clients",
        },
        {
          name: "Leads",
          icon: UserPlus,
          isLucide: true,
          path: "/dashboard/leads",
        },
      ],
    },
    // Infrastructure Group
    {
      name: "Infrastructure",
      icon: Server,
      isLucide: true,
      children: [
        {
          name: "Projects",
          icon: FolderKanban,
          isLucide: true,
          path: "/dashboard/projects",
        },
        {
          name: "Instances",
          icon: Server,
          isLucide: true,
          path: "/dashboard/instances",
        },
        {
          name: "Object Storage",
          icon: HardDrive,
          isLucide: true,
          path: "/dashboard/object-storage",
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
          path: "/dashboard/region-requests",
        },
        {
          name: "Onboarding Review",
          icon: ClipboardList,
          isLucide: true,
          path: "/dashboard/onboarding",
        },
      ],
    },
    // Billing & Revenue Group
    {
      name: "Billing & Revenue",
      icon: DollarSign,
      isLucide: true,
      children: [
        {
          name: "Revenue",
          icon: TrendingUp,
          isLucide: true,
          path: "/dashboard/revenue",
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
          path: "/dashboard/discounts",
        },
        {
          name: "Payouts & Banking",
          icon: Wallet,
          isLucide: true,
          path: "/dashboard/payouts",
        },
      ],
    },
    // Standalone items
    {
      name: "Products",
      icon: Package,
      isLucide: true,
      path: "/dashboard/products",
    },
    {
      name: "Support",
      icon: HelpCircle,
      isLucide: true,
      path: "/dashboard/support",
    },
    {
      name: "Settings",
      icon: Settings,
      isLucide: true,
      path: "/dashboard/settings",
    },
  ];

  const themeColor = tenantData?.color || "#1C1C1C";

  const handleLogout = async () => {
    try {
      clearAllAuthSessions();
      navigate("/tenant-signin");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col fixed left-0 top-[74px] h-[calc(100vh-74px)] w-20 lg:w-[20%] bg-white border-r border-gray-200 z-40"
        style={{ borderColor: "rgb(229, 231, 235)" }}
      >
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <span className="text-xs font-semibold tracking-wider" style={{ color: themeColor }}>
            TENANT
          </span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <CollapsibleMenu items={menuItems} themeColor={themeColor} />
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={closeMobileMenu} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-white z-50 transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <span className="text-xs font-semibold tracking-wider" style={{ color: themeColor }}>
            TENANT
          </span>
          <button onClick={closeMobileMenu} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Mobile Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <CollapsibleMenu
            items={menuItems}
            themeColor={themeColor}
            onItemClick={closeMobileMenu}
          />
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default TenantSidebar;
