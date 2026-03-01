import React from "react";
import { useFetchClientProfile } from "../../hooks/clientHooks/resources";
import { useFetchClientProjects, Project } from "../../hooks/clientHooks/projectHooks";
import { DashboardSidebar } from "../../shared/components/sidebar";
import { buildClientMenuItems } from "../../shared/config/sidebarMenus";

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

  // Extract projects array from response
  const projects: Project[] = projectsResponse?.data || [];

  const menuItems = React.useMemo(
    () => buildClientMenuItems(projects.length > 0),
    [projects.length]
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
    />
  );
};

export default ClientSidebar;
