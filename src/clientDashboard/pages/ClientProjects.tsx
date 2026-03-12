import React from "react";
import { useNavigate } from "react-router-dom";
import ClientActiveTab from "../components/clientActiveTab";
import ClientPageShell from "../components/ClientPageShell";
import ProjectsPageContainer from "@/shared/components/projects/ProjectsPageContainer";
import {
  useFetchClientProjects,
  useDeleteClientProject,
  Project as HookProject,
} from "@/hooks/clientHooks/projectHooks";
import { Project } from "@/types/project";
import { ProjectExportRecord } from "@/utils/projectExport";
import { encodeProjectId } from "@/utils/projectUtils";
import ToastUtils from "@/utils/toastUtil";

const ClientProjects: React.FC = () => {
  const navigate = useNavigate();

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

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/client-dashboard/projects/create");
  };

  const handleViewProject = (project: HookProject) => {
    const encodedId = encodeProjectId(String(project.identifier || project.id));
    const encodedName = encodeURIComponent(project.name);
    navigate(`/client-dashboard/projects/details?id=${encodedId}&name=${encodedName}`);
  };

  const handleDeleteProject = async (project: HookProject) => {
    if (
      !globalThis.window.confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(String(project.identifier || project.id));
      ToastUtils.success(`Project "${project.name}" deleted successfully`);
    } catch (err: unknown) {
      const error = err as Error;
      ToastUtils.error(error.message || "Failed to delete project");
    }
  };

  // Bulk operations
  const handleBulkExport = async (selectedIds: string[]) => {
    const projectsRaw = ((projectsResponse as Record<string, any>)?.data || []) as HookProject[];
    const { exportSelectedProjects } = await import("../../utils/projectExport");
    try {
      await exportSelectedProjects(
        projectsRaw as unknown as ProjectExportRecord[],
        selectedIds,
        "csv"
      );
      ToastUtils.success(`Exported ${selectedIds.length} projects successfully`);
    } catch (err: unknown) {
      const error = err as Error;
      ToastUtils.error(error.message || "Failed to export projects");
    }
  };

  // Convert HookProject[] to GlobalProject[] for the container
  const projects = ((projectsResponse as Record<string, any>)?.data as unknown as Project[]) || [];

  return (
    <>
      <ClientActiveTab />
      <ClientPageShell title="Projects" description="Manage your infrastructure projects">
        <ProjectsPageContainer
          projects={projects}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          error={error}
          onRefresh={() => {
            refetch();
          }}
          onCreateProject={handleCreateProject}
          onViewProject={(p: Project) => handleViewProject(p as unknown as HookProject)}
          onDeleteProject={(p: Project) => handleDeleteProject(p as unknown as HookProject)}
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
