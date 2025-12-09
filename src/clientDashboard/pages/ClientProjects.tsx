// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import ProjectsPageContainer from "../../shared/components/projects/ProjectsPageContainer";
import {
  useFetchClientProjects,
  useDeleteClientProject,
} from "../../hooks/clientHooks/projectHooks";
import { encodeProjectId } from "../../utils/projectUtils";
import ToastUtils from "../../utils/toastUtil";

interface Project {
  identifier: string;
  name: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

interface ProjectsResponse {
  data?: Project[];
}

const ClientProjects: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Fetch projects using client hooks
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchClientProjects();

  const deleteProjectMutation = useDeleteClientProject();

  // Extract projects array from response
  const projects: Project[] =
    (projectsResponse as ProjectsResponse)?.data ||
    (Array.isArray(projectsResponse) ? projectsResponse : []) ||
    [];

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/client-dashboard/projects/create");
  };

  const handleViewProject = (project: Project) => {
    const encodedId = encodeProjectId(project.identifier);
    const encodedName = encodeURIComponent(project.name);
    navigate(`/client-dashboard/projects/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleDeleteProject = async (project: Project) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" deleted successfully`);
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      ToastUtils.error(err?.message || "Failed to delete project");
    }
  };

  // Bulk operations
  const handleBulkExport = async (selectedIds: string[]) => {
    const { exportSelectedProjects } = await import("../../utils/projectExport");
    try {
      await exportSelectedProjects(projects, selectedIds, "csv");
      ToastUtils.success(`Exported ${selectedIds.length} projects successfully`);
    } catch (err: any) {
      console.error("Failed to export projects:", err);
      ToastUtils.error(err?.message || "Failed to export projects");
    }
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={closeMobileMenu} />
      <ClientActiveTab />
      <ClientPageShell title="Projects" description="Manage your infrastructure projects">
        <ProjectsPageContainer
          projects={projects as any}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error as any}
          onRefresh={refetch}
          onCreateProject={handleCreateProject}
          onViewProject={handleViewProject}
          onDeleteProject={handleDeleteProject}
          onBulkExport={handleBulkExport}
          showCreateButton={true}
          showRefreshButton={true}
          showBulkActions={true}
          showStats={true}
          enableExport={true}
          // Client specific: no archive/activate actions
          onArchiveProject={undefined}
          onActivateProject={undefined}
          onBulkArchive={undefined}
          onBulkActivate={undefined}
          onBulkDelete={undefined}
        />
      </ClientPageShell>
    </>
  );
};

export default ClientProjects;
