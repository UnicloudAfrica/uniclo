import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Key, FolderOpen, Loader2 } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import KeyPairsContainer from "@/shared/components/infrastructure/containers/KeyPairsContainer";
import { useFetchKeyPairs, useDeleteKeyPair, useSyncKeyPairs } from "@/shared/hooks/keyPairsHooks";
import { useFetchProjects } from "@/hooks/adminHooks/projectHooks";

interface Project {
  id: number;
  name: string;
  identifier: string;
  region?: string;
}

const AdminKeyPairs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL
  const urlProject = searchParams.get("project") || "";
  const urlRegion = searchParams.get("region") || "";

  const [selectedProjectId, setSelectedProjectId] = useState(urlProject);

  // Fetch projects for the selector
  const { data: projectsData, isLoading: isLoadingProjects } = useFetchProjects({ per_page: 100 });

  const projects: Project[] = useMemo(
    () =>
      Array.isArray((projectsData as Record<string, unknown>)?.data)
        ? (projectsData as Record<string, unknown>).data
        : [],
    [projectsData]
  );

  // Auto-select from URL param (identifier or id match)
  useEffect(() => {
    if (urlProject && projects.length > 0 && !selectedProjectId) {
      const found = projects.find(
        (p) => String(p.id) === urlProject || p.identifier === urlProject
      );
      if (found) {
        setSelectedProjectId(found.identifier);
      }
    }
  }, [urlProject, projects, selectedProjectId]);

  // Derive the project identifier and region from the selected project
  const selectedProject = useMemo(
    () =>
      projects.find(
        (p) =>
          p.identifier === selectedProjectId ||
          String(p.id) === selectedProjectId
      ),
    [projects, selectedProjectId]
  );

  const projectId = selectedProject?.identifier || selectedProjectId || undefined;
  const region = selectedProject?.region || urlRegion || undefined;

  // Update URL params when selection changes
  const handleProjectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setSelectedProjectId(value);

      const next = new URLSearchParams(searchParams);
      if (value) {
        next.set("project", value);
        // Find the project to get the region
        const proj = projects.find(
          (p) => p.identifier === value || String(p.id) === value
        );
        if (proj?.region) {
          next.set("region", proj.region);
        } else {
          next.delete("region");
        }
      } else {
        next.delete("project");
        next.delete("region");
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, projects]
  );

  const hooks = {
    useList: useFetchKeyPairs,
    useDelete: useDeleteKeyPair,
    useSync: useSyncKeyPairs,
  };

  // Project selector filter bar
  const projectFilterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <FolderOpen size={16} className="text-gray-400 flex-shrink-0" />
        <label
          htmlFor="kp-project-select"
          className="text-sm font-medium text-gray-600 whitespace-nowrap"
        >
          Project
        </label>
      </div>
      <div className="relative">
        <select
          id="kp-project-select"
          value={selectedProjectId}
          onChange={handleProjectChange}
          disabled={isLoadingProjects}
          className="block w-full min-w-[220px] max-w-xs pl-3 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-shadow disabled:opacity-50 disabled:cursor-wait appearance-none"
        >
          <option value="">All Projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.identifier}>
              {project.name} ({project.identifier})
            </option>
          ))}
        </select>
        {isLoadingProjects && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      {selectedProject?.region && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
          {selectedProject.region}
        </span>
      )}
      {!selectedProjectId && (
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
          Select a project to enable Create &amp; Sync
        </span>
      )}
    </div>
  );

  return (
    <>
      <KeyPairsContainer
        hierarchy="admin"
        projectId={projectId}
        region={region}
        hooks={hooks as unknown}
        hideResourceHeader={true}
        wrapper={({ headerActions, children }) => (
          <AdminPageShell
            title="Key Pairs"
            description="Manage SSH key pairs for secure instance access"
            icon={<Key className="w-6 h-6 text-purple-600" />}
            breadcrumbs={[
              { label: "Home", href: "/admin-dashboard" },
              { label: "Infrastructure", href: "/admin-dashboard/projects" },
              { label: "Key Pairs" },
            ]}
            actions={headerActions}
            subHeaderContent={projectFilterBar}
          >
            {children}
          </AdminPageShell>
        )}
      />
    </>
  );
};

export default AdminKeyPairs;
