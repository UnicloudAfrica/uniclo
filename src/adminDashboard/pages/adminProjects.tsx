import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import ProjectsPageContainer from "../../shared/components/projects/ProjectsPageContainer";
import {
  useFetchProjects,
  useDeleteProject,
  useBulkSyncProjectStatus,
} from "../../hooks/adminHooks/projectHooks";
import ToastUtils from "../../utils/toastUtil";
import { Project } from "../../types/project";

interface ProjectsResponse {
  data?: Project[];
}

interface BulkSyncResult {
  fixed?: number;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
};

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
  const bulkSyncStatusMutation = useBulkSyncProjectStatus();

  // Extract projects array from response
  const typedResponse = projectsResponse as ProjectsResponse | undefined;
  const projects: Project[] = Array.isArray(typedResponse?.data) ? typedResponse.data : [];
  const normalizedError =
    error instanceof Error
      ? error
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
        ? { message: (error as { message: string }).message }
        : null;

  // Navigation handlers
  const handleCreateProject = () => {
    navigate("/admin-dashboard/projects/create");
  };
  const handleViewProject = (project: Project) => {
    // Use identifier directly to avoid base64 encoding issues
    const encodedName = encodeURIComponent(project.name);
    navigate(
      `/admin-dashboard/projects/details?identifier=${project.identifier}&name=${encodedName}`
    );

    // Single project operations
  };
  const handleArchiveProject = async (_project: Project) => {
    // TODO: Implement archive functionality when backend endpoint is ready
    ToastUtils.info("Archive functionality coming soon");
  };
  const handleActivateProject = async (_project: Project) => {
    // TODO: Implement activate functionality when backend endpoint is ready
    ToastUtils.info("Activate functionality coming soon");
  };
  const handleDeleteProject = async (project: Project) => {
    if (
      !globalThis.window.confirm(
        `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteProjectMutation.mutateAsync(project.identifier);
      ToastUtils.success(`Project "${project.name}" deleted successfully`);
    } catch (err: unknown) {
      console.error("Failed to delete project:", err);
      ToastUtils.error(getErrorMessage(err, "Failed to delete project"));
    }

    // Bulk operations
  };
  const handleBulkArchive = async (selectedIds: string[]) => {
    ToastUtils.info(`Bulk archive for ${selectedIds.length} projects coming soon`);
  };
  const handleBulkActivate = async (selectedIds: string[]) => {
    ToastUtils.info(`Bulk activate for ${selectedIds.length} projects coming soon`);
  };
  const handleBulkDelete = async (selectedIds: string[]) => {
    if (
      !globalThis.window.confirm(
        `Are you sure you want to delete ${selectedIds.length} projects? This action cannot be undone.`
      )
    ) {
      return;
    }
    ToastUtils.info(`Bulk delete for ${selectedIds.length} projects coming soon`);
  };
  const handleBulkExport = async (selectedIds: string[]) => {
    const { exportSelectedProjects } = await import("../../utils/projectExport");
    try {
      await exportSelectedProjects(
        projects as unknown as Array<{ identifier?: string | number; [key: string]: unknown }>,
        selectedIds,
        "csv"
      );
      ToastUtils.success(`Exported ${selectedIds.length} projects successfully`);
    } catch (err: unknown) {
      console.error("Failed to export projects:", err);
      ToastUtils.error(getErrorMessage(err, "Failed to export projects"));
    }
  };

  // Sync all project statuses based on provisioning progress
  const handleBulkSyncStatus = async () => {
    try {
      ToastUtils.info("Syncing project statuses...");
      const result = (await bulkSyncStatusMutation.mutateAsync([])) as BulkSyncResult;
      const fixedCount = result.fixed ?? 0;
      if (fixedCount > 0) {
        ToastUtils.success(`Fixed ${fixedCount} project status(es)`);
      } else {
        ToastUtils.success("All project statuses are already correct");
      }
    } catch (err: unknown) {
      console.error("Failed to sync statuses:", err);
      ToastUtils.error(getErrorMessage(err, "Failed to sync project statuses"));
    }
  };

  return (
    <AdminPageShell
      title="Projects"
      description="Manage and monitor all infrastructure projects"
      contentClassName="space-y-6"
      mainClassName="admin-dashboard-shell"
      actions={
        <button
          onClick={handleBulkSyncStatus}
          disabled={bulkSyncStatusMutation.isPending}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {bulkSyncStatusMutation.isPending ? "Syncing..." : "🔄 Sync All Statuses"}
        </button>
      }
    >
      <ProjectsPageContainer
        projects={projects}
        isLoading={isLoading}
        isFetching={isFetching}
        isError={isError}
        error={normalizedError}
        onRefresh={async () => {
          await refetch();
        }}
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
  );
};
export default AdminProjects;
