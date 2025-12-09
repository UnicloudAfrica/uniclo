// @ts-nocheck
import React from "react";
import {
  Home,
  Users,
  UserPlus,
  CreditCard,
  Package,
  Layers,
  DollarSign,
  FolderOpen,
  MapPin,
  Calculator,
  FileText,
  Settings,
  HelpCircle,
  User,
  CheckSquare,
  Server,
  ClipboardList,
  HardDrive,
  SlidersHorizontal,
  Building2,
  Globe,
  Wallet,
  Repeat,
  Receipt,
  BarChart3,
} from "lucide-react";
import lapapi from "../../index/admin/lapapi";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { clearAllAuthSessions } from "../../stores/sessionUtils";
import { DashboardSidebar, MenuEntry } from "../../shared/components/sidebar";
import { useNavigate } from "react-router-dom";
import useSidebarStore from "../../stores/sidebarStore";

// Admin menu items with groups
const menuItems: MenuEntry[] = [
  {
    name: "Home",
    icon: Home,
    isLucide: true,
    path: "/admin-dashboard",
  },
  {
    name: "Analytics",
    icon: BarChart3,
    isLucide: true,
    path: "/admin-dashboard/analytics",
  },
  {
    name: "Support Tickets",
    icon: HelpCircle,
    isLucide: true,
    path: "/admin-dashboard/tickets",
  },
  // Customer Management Group
  {
    name: "Customer Management",
    icon: Users,
    isLucide: true,
    children: [
      {
        name: "Tenants & Users",
        icon: Users,
        isLucide: true,
        path: "/admin-dashboard/partners",
      },
      {
        name: "Clients",
        icon: Building2,
        isLucide: true,
        path: "/admin-dashboard/clients",
      },
      {
        name: "Leads",
        icon: UserPlus,
        isLucide: true,
        path: "/admin-dashboard/leads",
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
        icon: FolderOpen,
        isLucide: true,
        path: "/admin-dashboard/projects",
      },
      {
        name: "Instances",
        icon: Server,
        isLucide: true,
        path: "/admin-dashboard/instances",
      },
      {
        name: "Object Storage",
        icon: HardDrive,
        isLucide: true,
        path: "/admin-dashboard/object-storage",
      },
    ],
  },
  // Billing & Pricing Group
  {
    name: "Billing & Pricing",
    icon: DollarSign,
    isLucide: true,
    children: [
      {
        name: "Payment",
        icon: CreditCard,
        isLucide: true,
        path: "/admin-dashboard/payment",
      },
      {
        name: "Pricing",
        icon: DollarSign,
        isLucide: true,
        path: "/admin-dashboard/pricing",
      },
      {
        name: "Pricing Calculator",
        icon: Calculator,
        isLucide: true,
        path: "/admin-dashboard/pricing-calculator",
      },
      {
        name: "Generate Invoice",
        icon: FileText,
        isLucide: true,
        path: "/admin-dashboard/create-invoice",
      },
      {
        name: "Tax Configuration",
        icon: Settings,
        isLucide: true,
        path: "/admin-dashboard/tax-configuration",
      },
      {
        name: "Subscription Plans",
        icon: Repeat,
        isLucide: true,
        path: "/admin-dashboard/subscription-plans",
      },
      {
        name: "Wallet",
        icon: Wallet,
        isLucide: true,
        path: "/admin-dashboard/wallet",
      },
      {
        name: "Settlements",
        icon: Receipt,
        isLucide: true,
        path: "/admin-dashboard/settlements",
      },
      {
        name: "Payouts",
        icon: CreditCard,
        isLucide: true,
        path: "/admin-dashboard/payouts",
      },
    ],
  },
  // Regional Group
  {
    name: "Regional",
    icon: Globe,
    isLucide: true,
    children: [
      {
        name: "Regions",
        icon: MapPin,
        isLucide: true,
        path: "/admin-dashboard/regions",
      },
      {
        name: "Region Approvals",
        icon: CheckSquare,
        isLucide: true,
        path: "/admin-dashboard/region-approvals",
      },
    ],
  },
  // Onboarding Group
  {
    name: "Onboarding",
    icon: ClipboardList,
    isLucide: true,
    children: [
      {
        name: "Onboarding Review",
        icon: ClipboardList,
        isLucide: true,
        path: "/admin-dashboard/onboarding-review",
      },
      {
        name: "Onboarding Settings",
        icon: SlidersHorizontal,
        isLucide: true,
        path: "/admin-dashboard/onboarding-settings",
      },
    ],
  },
  // Standalone items
  {
    name: "Products",
    icon: Package,
    isLucide: true,
    path: "/admin-dashboard/products",
  },
  {
    name: "Inventory",
    icon: Layers,
    isLucide: true,
    path: "/admin-dashboard/inventory",
  },
  {
    name: "Profile Settings",
    icon: User,
    isLucide: true,
    path: "/admin-dashboard/profile-settings",
  },
];

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const clearUserEmail = useAdminAuthStore((state) => state.clearUserEmail);
  const { isMobileOpen, closeMobile } = useSidebarStore();

  const handleLogout = async () => {
    try {
      await lapapi("POST", "/business/auth/logout");
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      clearAllAuthSessions();
      clearUserEmail?.();
      closeMobile();
      navigate("/admin-signin");
    }
  };

  return (
    <DashboardSidebar
      menuItems={menuItems}
      sidebarLabel="ADMIN"
      logoutPath="/admin-signin"
      isMobileMenuOpen={isMobileOpen}
      onCloseMobileMenu={closeMobile}
      onLogout={handleLogout}
      userProfile={{
        initials: "AD",
        email: "admin@email.com",
        firstName: "Admin",
      }}
    />
  );
};

export default AdminSidebar;
