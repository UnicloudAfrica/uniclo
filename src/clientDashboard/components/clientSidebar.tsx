// @ts-nocheck
import React from "react";
import { useFetchClientProfile } from "../../hooks/clientHooks/resources";
import { useFetchClientProjects } from "../../hooks/clientHooks/projectHooks";
import { DashboardSidebar, MenuEntry } from "../../shared/components/sidebar";
import {
  LayoutDashboard,
  Briefcase,
  Server,
  Calculator,
  CreditCard,
  LifeBuoy,
  Settings,
  HardDrive,
} from "lucide-react";

interface ClientSidebarProps {
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

interface Project {
  id: string;
  name: string;
  [key: string]: any;
}

interface ClientProfile {
  email?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: any;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const { data: profile } = useFetchClientProfile();
  const { data: projectsResponse } = useFetchClientProjects();

  // Extract projects array from response
  const projects: Project[] = Array.isArray(projectsResponse)
    ? projectsResponse
    : (projectsResponse as any)?.data || [];

  // Menu items - with optional groups for clients
  const menuItems: MenuEntry[] = [
    {
      name: "Home",
      icon: LayoutDashboard,
      isLucide: true,
      path: "/client-dashboard",
    },
    ...(projects.length > 0
      ? [
          {
            name: "Infrastructure",
            icon: Server,
            isLucide: true,
            children: [
              {
                name: "Projects",
                icon: Briefcase,
                isLucide: true,
                path: "/client-dashboard/projects",
              },
              {
                name: "Instances",
                icon: Server,
                isLucide: true,
                path: "/client-dashboard/instances",
              },
              {
                name: "Object Storage",
                icon: HardDrive,
                isLucide: true,
                path: "/client-dashboard/object-storage",
              },
            ],
          },
        ]
      : [
          {
            name: "Object Storage",
            icon: HardDrive,
            isLucide: true,
            path: "/client-dashboard/object-storage",
          },
        ]),
    {
      name: "Pricing Calculator",
      icon: Calculator,
      isLucide: true,
      path: "/client-dashboard/pricing-calculator",
    },
    {
      name: "Orders & Payments",
      icon: CreditCard,
      isLucide: true,
      path: "/client-dashboard/orders-payments",
    },
    {
      name: "Support",
      icon: LifeBuoy,
      isLucide: true,
      path: "/client-dashboard/support",
    },
    {
      name: "Account Settings",
      icon: Settings,
      isLucide: true,
      path: "/client-dashboard/account-settings",
    },
  ];

  const clientProfile = profile as ClientProfile | undefined;

  return (
    <DashboardSidebar
      menuItems={menuItems}
      sidebarLabel="CLIENT"
      logoutPath="/sign-in"
      isMobileMenuOpen={isMobileMenuOpen}
      onCloseMobileMenu={onCloseMobileMenu}
      userProfile={{
        email: clientProfile?.email,
        firstName: clientProfile?.first_name,
        lastName: clientProfile?.last_name,
      }}
    />
  );
};

export default ClientSidebar;
