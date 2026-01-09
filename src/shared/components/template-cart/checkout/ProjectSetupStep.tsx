// Project Setup Step - Context Aware for Admin/Tenant/Client
import React, { useState, useEffect } from "react";
import { useApiContext } from "../../../../hooks/useApiContext";
import clientApi from "../../../../index/client/api";
import { Check, Loader2 } from "lucide-react";
import ToastUtils from "../../../../utils/toastUtil";

interface ProjectSetupStepProps {
  onComplete: (projectData: any) => void;
  onBack: () => void;
}

const ProjectSetupStep: React.FC<ProjectSetupStepProps> = ({ onComplete, onBack }) => {
  const { context } = useApiContext();
  // Using clientApi for all contexts until tenant/admin APIs are created
  const api = clientApi;
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New project form
  const [projectName, setProjectName] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("africa-lagos");
  const [regions, setRegions] = useState<any[]>([]);

  // Fetch existing projects
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const endpoint = context === "client" ? "/business/projects" : "/projects";

        const response = await api("GET", endpoint);
        setProjects(response?.data || []);
      } catch (error: any) {
        console.error("Failed to fetch projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [api, context]);

  // Fetch regions
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const endpoint = context === "client" ? "/business/cloud-regions" : "/cloud-regions";

        const response = await api("GET", endpoint);
        setRegions(response?.data || response || []);
      } catch (error: any) {
        console.error("Failed to fetch regions:", error);
      }
    };

    fetchRegions();
  }, [api, context]);

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      ToastUtils.error("Please enter a project name");
      return;
    }

    setIsCreating(true);
    try {
      const endpoint = context === "client" ? "/business/projects" : "/projects";

      const response = await api("POST", endpoint, {
        name: projectName,
        region: selectedRegion,
        description: `Created from template cart - ${new Date().toLocaleDateString()}`,
      });

      const newProject = response?.data || response;
      ToastUtils.success("Project created successfully!");
      setSelectedProject(newProject);

      // Wait a moment to show success message
      setTimeout(() => {
        onComplete(newProject);
      }, 500);
    } catch (error: any) {
      ToastUtils.error(error.message || "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectExisting = () => {
    if (!selectedProject) {
      ToastUtils.error("Please select a project");
      return;
    }
    onComplete(selectedProject);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <h2 className="text-2xl font-semibold text-slate-900 mb-2">Step 1: Project Setup</h2>
        <p className="text-slate-600 mb-6">
          Select an existing project or create a new one for your instances
        </p>

        {/* Mode Toggle */}
        <div className="flex gap-4 mb-6">
          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="project-mode"
              value="new"
              checked={mode === "new"}
              onChange={() => setMode("new")}
              className="sr-only peer"
            />
            <div className="border-2 border-slate-200 peer-checked:border-primary-600 peer-checked:bg-primary-50 rounded-lg p-4 transition-all">
              <div className="font-semibold text-slate-900 mb-1">Create New Project</div>
              <div className="text-sm text-slate-600">
                Set up a fresh project for these instances
              </div>
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              type="radio"
              name="project-mode"
              value="existing"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
              className="sr-only peer"
            />
            <div className="border-2 border-slate-200 peer-checked:border-primary-600 peer-checked:bg-primary-50 rounded-lg p-4 transition-all">
              <div className="font-semibold text-slate-900 mb-1">Use Existing Project</div>
              <div className="text-sm text-slate-600">Add instances to an existing project</div>
            </div>
          </label>
        </div>

        {/* Form Content */}
        {mode === "new" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Project Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Production Environment"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Region *</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {regions.map((region) => (
                  <option key={region.id || region.slug} value={region.id || region.slug}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="text-green-900 font-medium">Project created successfully!</div>
                  <div className="text-green-700 text-sm">{selectedProject.name}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Project *
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : projects.length > 0 ? (
              <select
                value={selectedProject?.id || ""}
                onChange={(e) => {
                  const project = projects.find((p) => p.id === e.target.value);
                  setSelectedProject(project);
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} - {project.region}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-center py-8 text-slate-600">
                No existing projects found. Create a new one instead.
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
          >
            ← Back
          </button>

          {mode === "new" ? (
            <button
              onClick={handleCreateProject}
              disabled={isCreating || !projectName.trim()}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Project...
                </>
              ) : selectedProject ? (
                "Continue →"
              ) : (
                "Create Project & Continue →"
              )}
            </button>
          ) : (
            <button
              onClick={handleSelectExisting}
              disabled={!selectedProject}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 text-white rounded-lg font-medium transition-colors"
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSetupStep;
