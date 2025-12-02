import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TenantPageShell from "../components/TenantPageShell";
import ProjectsPageContainer from "../../shared/projects/ProjectsPageContainer";
import {
  useFetchTenantProjects,
  useDeleteTenantProject,
  useArchiveTenantProject,
  useActivateTenantProject,
} from "../../hooks/tenantHooks/projectHooks";
import { encodeProjectId } from "../../utils/projectUtils";
import ToastUtils from "../../utils/toastUtil";

const Projects = () => {
  const navigate = useNavigate();

  // Fetch projects using tenant hooks
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchTenantProjects();

  const deleteProjectMutation = useDeleteTenantProject();
  const archiveProjectMutation = useArchiveTenantProject();
  const activateProjectMutation = useActivateTenantProject();

  // Extract projects array from response
  const projects = projectsResponse?.data || [];

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/dashboard/projects/create");
  };

  const handleViewProject = (project) => {
    const encodedId = encodeProjectId(project.identifier);
    const encodedName = encodeURIComponent(project.name);
    navigate(`/dashboard/projects/details?id=${encodedId}&name=${encodedName}`);
  };

  // Single project operations
  const handleArchiveProject = async (project) => {
    if (!window.confirm(`Are you sure you want to archive "${project.name}"?`)) {
      return;
    }

    try {
      await archiveProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" archived successfully`);
    } catch (err) {
      console.error("Failed to archive project:", err);
      ToastUtils.error(err?.message || "Failed to archive project");
    }
  };

  const handleActivateProject = async (project) => {
    try {
      await activateProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" activated successfully`);
    } catch (err) {
      console.error("Failed to activate project:", err);
      ToastUtils.error(err?.message || "Failed to activate project");
    }
  };

  const handleDeleteProject = async (project) => {
    if (!window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" deleted successfully`);
    } catch (err) {
      console.error("Failed to delete project:", err);
      ToastUtils.error(err?.message || "Failed to delete project");
    }
  };

  // Bulk operations
  const handleBulkArchive = async (selectedIds) => {
    if (!window.confirm(`Are you sure you want to archive ${selectedIds.length} projects?`)) {
      return;
    }
    ToastUtils.info(`Bulk archive for ${selectedIds.length} projects coming soon`);
  };

  const handleBulkActivate = async (selectedIds) => {
    ToastUtils.info(`Bulk activate for ${selectedIds.length} projects coming soon`);
  };

  const handleBulkDelete = async (selectedIds) => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} projects? This action cannot be undone.`)) {
      return;
    }
    ToastUtils.info(`Bulk delete for ${selectedIds.length} projects coming soon`);
  };

  const handleBulkExport = async (selectedIds) => {
    const { exportSelectedProjects } = await import("../../utils/projectExport");
    try {
      await exportSelectedProjects(projects, selectedIds, "csv");
      ToastUtils.success(`Exported ${selectedIds.length} projects successfully`);
    } catch (err) {
      console.error("Failed to export projects:", err);
      ToastUtils.error(err?.message || "Failed to export projects");
    }
  };

  return (
    <TenantPageShell
      title="Projects"
      description="Manage and monitor your infrastructure projects"
    >
      <ProjectsPageContainer
        projects={projects}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={error}
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
    </TenantPageShell>
  );
};

export default Projects;
