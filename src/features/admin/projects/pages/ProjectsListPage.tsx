/**
 * Admin Projects List Page (New Architecture)
 * Migrated to use feature-based structure with TypeScript
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../../../../adminDashboard/components/adminHeadbar";
import AdminSidebar from "../../../../adminDashboard/components/AdminSidebar";
import AdminPageShell from "../../../../adminDashboard/components/AdminPageShell";
import ProjectsPageContainer from "@/shared/components/projects/ProjectsPageContainer";
import {
  useAdminProjects,
  useDeleteAdminProject,
  useArchiveAdminProject,
  useActivateAdminProject,
  useBulkArchiveProjects,
  useBulkActivateProjects,
  useBulkDeleteProjects,
} from "../hooks/useAdminProjects";
import { encodeProjectId } from "@/shared/domains/projects/utils/projectHelpers";
import ToastUtils from "@/utils/toastUtil";
import type { Project } from "@/shared/domains/projects/types/project.types";

const AdminProjectsListPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch projects using new hooks
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminProjects();

  // Mutations
  const deleteProjectMutation = useDeleteAdminProject();
  const archiveProjectMutation = useArchiveAdminProject();
  const activateProjectMutation = useActivateAdminProject();
  const bulkArchiveMutation = useBulkArchiveProjects();
  const bulkActivateMutation = useBulkActivateProjects();
  const bulkDeleteMutation = useBulkDeleteProjects();

  // Extract projects array from response
  const projects = projectsResponse?.data || [];

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/admin-dashboard/projects/create");
  };

  const handleViewProject = (project: Project) => {
    const encodedId = encodeProjectId(project.identifier);
    const encodedName = encodeURIComponent(project.name);
    navigate(`/admin-dashboard/projects/details?id=${encodedId}&name=${encodedName}`);
  };

  // Single project operations
  const handleArchiveProject = async (project: Project) => {
    if (!window.confirm(`Are you sure you want to archive "${project.name}"?`)) {
      return;
    }

    try {
      await archiveProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" archived successfully`);
    } catch (err: any) {
      console.error("Failed to archive project:", err);
      ToastUtils.error(err?.message || "Failed to archive project");
    }
  };

  const handleActivateProject = async (project: Project) => {
    try {
      await activateProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" activated successfully`);
    } catch (err: any) {
      console.error("Failed to activate project:", err);
      ToastUtils.error(err?.message || "Failed to activate project");
    }
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
  const handleBulkArchive = async (selectedIds: string[]) => {
    if (!window.confirm(`Are you sure you want to archive ${selectedIds.length} projects?`)) {
      return;
    }

    try {
      await bulkArchiveMutation.mutateAsync(selectedIds);
      ToastUtils.success(`Successfully archived ${selectedIds.length} projects`);
    } catch (err: any) {
      console.error("Failed to bulk archive:", err);
      ToastUtils.error(err?.message || "Failed to archive projects");
    }
  };

  const handleBulkActivate = async (selectedIds: string[]) => {
    try {
      await bulkActivateMutation.mutateAsync(selectedIds);
      ToastUtils.success(`Successfully activated ${selectedIds.length} projects`);
    } catch (err: any) {
      console.error("Failed to bulk activate:", err);
      ToastUtils.error(err?.message || "Failed to activate projects");
    }
  };

  const handleBulkDelete = async (selectedIds: string[]) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} projects? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync(selectedIds);
      ToastUtils.success(`Successfully deleted ${selectedIds.length} projects`);
    } catch (err: any) {
      console.error("Failed to bulk delete:", err);
      ToastUtils.error(err?.message || "Failed to delete projects");
    }
  };

  const handleBulkExport = async (selectedIds: string[]) => {
    const { exportSelectedProjects } = await import("@/utils/projectExport");
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
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Projects"
        description="Manage and monitor all infrastructure projects"
        contentClassName="space-y-6"
        mainClassName="admin-dashboard-shell"
      >
        <ProjectsPageContainer
          projects={projects as any}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error as any}
          onRefresh={refetch}
          onCreateProject={handleCreateProject}
          onViewProject={handleViewProject}
          onArchiveProject={handleArchiveProject}
          onActivateProject={handleActivateProject}
          onDeleteProject={handleDeleteProject}
          onBulkArchive={handleBulkArchive}
          onBulkActivate={handleBulkActivate}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          showCreateButton={true}
          showRefreshButton={true}
          showBulkActions={true}
          showStats={true}
          enableExport={true}
        />
      </AdminPageShell>
    </>
  );
};

export default AdminProjectsListPage;
