import React from "react";
import { useFetchClientProfile } from "@/hooks/clientHooks/resources";
import { useFetchClientProjects, Project } from "@/hooks/clientHooks/projectHooks";
import useAuthStore from "@/stores/authStore";
import { DashboardSidebar } from "@/shared/components/sidebar";
import { buildClientMenuItems, filterMenuByPermissions } from "@/shared/config/sidebarMenus";

interface ClientSidebarProps {
  isMobileMenuOpen?: boolean | undefined;
  onCloseMobileMenu?: (() => void) | undefined;
}

interface ClientProfile {
  email?: string | undefined;
  first_name?: string | undefined;
  last_name?: string | undefined;
  [key: string]: unknown;
}

const ClientSidebar: React.FC<ClientSidebarProps> = ({ isMobileMenuOpen, onCloseMobileMenu }) => {
  const { data: profile } = useFetchClientProfile();
  const { data: projectsResponse } = useFetchClientProjects();
  const permissions = useAuthStore((s) => s.permissions);

  // Extract projects array from response
  const projects: Project[] = ((projectsResponse as unknown) as Record<string, unknown>)?.data as Project[] ?? [];

  const menuItems = React.useMemo(
    () => filterMenuByPermissions(buildClientMenuItems(projects.length > 0), permissions),
    [projects.length, permissions]
  );

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
      regionStatus={{
        code: "NG-1",
        label: "Lagos",
        detail: "Sovereign · 99.99% SLA",
        status: "operational",
      }}
    />
  );
};

export default ClientSidebar;
