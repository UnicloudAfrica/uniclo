import { useFetchProfile } from "../../hooks/resource";
import { DashboardSidebar } from "../../shared/components/sidebar";
import {
  Home,
  Users,
  UserCheck,
  Server,
  FolderKanban,
  Database,
  DollarSign,
  Calculator,
  FileText,
  CreditCard,
  Shield,
  Package,
  LifeBuoy,
  Settings,
} from "lucide-react";

// Menu items for tenant dashboard
const menuItems = [
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
        icon: UserCheck,
        isLucide: true,
        path: "/dashboard/leads",
      },
      {
        name: "Admin Users",
        icon: Users,
        isLucide: true,
        path: "/dashboard/admin-users",
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
        icon: Database,
        isLucide: true,
        path: "/dashboard/object-storage",
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
        name: "Tax Configurations",
        icon: Shield,
        isLucide: true,
        path: "/dashboard/tax-configurations",
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
    name: "Support Ticket",
    icon: LifeBuoy,
    isLucide: true,
    path: "/dashboard/support-ticket",
  },
  {
    name: "Account Settings",
    icon: Settings,
    isLucide: true,
    path: "/dashboard/account-settings",
  },
];

const Sidebar = ({ isMobileMenuOpen = false, onCloseMobileMenu }) => {
  const { data: profile } = useFetchProfile();

  return (
    <DashboardSidebar
      menuItems={menuItems}
      sidebarLabel="TENANT"
      logoutPath="/sign-in"
      isMobileMenuOpen={isMobileMenuOpen}
      onCloseMobileMenu={onCloseMobileMenu}
      userProfile={{
        email: profile?.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
      }}
    />
  );
};

export default Sidebar;
