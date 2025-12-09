// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell.tsx";
import ProjectsPageContainer from "../../shared/components/projects/ProjectsPageContainer";
import { useFetchProjects, useDeleteProject } from "../../hooks/adminHooks/projectHooks";
import { encodeProjectId } from "../../utils/projectUtils";
import ToastUtils from "../../utils/toastUtil";

const AdminProjects = () => {
  const navigate = useNavigate();

  // Fetch projects using admin hooks
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useFetchProjects();

  const deleteProjectMutation = useDeleteProject();

  // Extract projects array from response
  const projects = projectsResponse?.data || [];

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/admin-dashboard/projects/create");
  };
  const handleViewProject = (project: any) => {
    const encodedId = encodeProjectId(project.identifier);
    const encodedName = encodeURIComponent(project.name);
    navigate(`/admin-dashboard/projects/details?id=${encodedId}&name=${encodedName}`);

    // Single project operations
  };
  const handleArchiveProject = async (project) => {
    // TODO: Implement archive functionality when backend endpoint is ready
    ToastUtils.info("Archive functionality coming soon");
  };
  const handleActivateProject = async (project) => {
    // TODO: Implement activate functionality when backend endpoint is ready
    ToastUtils.info("Activate functionality coming soon");
  };
  const handleDeleteProject = async (project) => {
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
    } catch (err) {
      console.error("Failed to delete project:", err);
      ToastUtils.error(err?.message || "Failed to delete project");
    }

    // Bulk operations
  };
  const handleBulkArchive = async (selectedIds) => {
    ToastUtils.info(`Bulk archive for ${selectedIds.length} projects coming soon`);
  };
  const handleBulkActivate = async (selectedIds) => {
    ToastUtils.info(`Bulk activate for ${selectedIds.length} projects coming soon`);
  };
  const handleBulkDelete = async (selectedIds) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} projects? This action cannot be undone.`
      )
    ) {
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
      </AdminPageShell>
    </>
  );
};
export default AdminProjects;
