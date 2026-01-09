import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Key, ArrowLeft, Loader2, Upload, AlertCircle } from "lucide-react";
import AdminHeadbar from "../../components/adminHeadbar";
import AdminSidebar from "../../components/AdminSidebar";
import AdminPageShell from "../../components/AdminPageShell";
import { useCreateKeyPair } from "../../../hooks/adminHooks/keyPairHooks";
import { useFetchProjects } from "../../../hooks/adminHooks/projectHooks"; // Assuming this hook exists based on previous checks

const AdminKeyPairCreate: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Add this
  const urlProjectId = searchParams.get("project");

  // Find project by identifier if passed
  const [name, setName] = useState("");
  const [projectId, setProjectId] = useState(""); // Will effect-set this
  const [publicKey, setPublicKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createKeyPair, isPending: isCreating } = useCreateKeyPair();
  const { data: projectsData, isLoading: isLoadingProjects } = useFetchProjects({ per_page: 100 });

  const projects = projectsData?.data || [];

  // Auto-select project from URL
  useEffect(() => {
    if (urlProjectId && projects.length > 0) {
      // urlProjectId might be identifier or ID.
      // Let's try to find matching project.
      const found = projects.find(
        (p: any) => String(p.id) === urlProjectId || p.identifier === urlProjectId
      );
      if (found) {
        setProjectId(String(found.id));
      }
    }
  }, [urlProjectId, projects]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!projectId) {
      setError("Please select a project context.");
      return;
    }

    try {
      // Find the selected project to get the region
      const project = projects.find((p: any) => p.id === parseInt(projectId));
      if (!project) throw new Error("Project not found");

      const payload = {
        name,
        project_id: project.identifier, // API expects identifier
        region: project.region,
        public_key: publicKey || undefined, // Send undefined if empty to trigger generation
      };

      const result: any = await createKeyPair(payload);

      // If a private key is returned (generation mode), trigger download
      if (result?.material) {
        const element = document.createElement("a");
        const file = new Blob([result.material], { type: "text/plain" });
        element.href = URL.createObjectURL(file);
        element.download = `${name}.pem`;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
        document.body.removeChild(element);
      }

      navigate("/admin-dashboard/key-pairs");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create key pair.");
    }
  };

  const breadcrumbs = [
    { label: "Home", href: "/admin-dashboard" },
    { label: "Infrastructure", href: "/admin-dashboard/projects" },
    { label: "Key Pairs", href: "/admin-dashboard/key-pairs" },
    { label: "Create" },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Create Key Pair"
        description="Generate a new SSH key pair or import an existing public key."
        icon={<Key className="w-6 h-6 text-purple-600" />}
        breadcrumbs={breadcrumbs}
      >
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate("/admin-dashboard/key-pairs")}
            className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to List
          </button>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-gray-900">Key Pair Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                {publicKey
                  ? "Import user's existing public key."
                  : "A new key pair will be generated and the private key downloaded."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 text-sm">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* Project Context Selection */}
              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
                  Context Project <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-lg border transition-shadow"
                    required
                  >
                    <option value="">Select a project...</option>
                    {projects.map((project: any) => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.identifier})
                      </option>
                    ))}
                  </select>
                  {isLoadingProjects && (
                    <div className="absolute right-8 top-3">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Required to determine the Cloud Provider and Region context. The key pair will be
                  available to all User projects in this region.
                </p>
              </div>

              {/* Name Input */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="e.g. my-production-key"
                  required
                />
              </div>

              {/* Public Key Import (Optional) */}
              <div>
                <label htmlFor="publicKey" className="block text-sm font-medium text-gray-700 mb-1">
                  Public Key (Optional)
                </label>
                <textarea
                  id="publicKey"
                  rows={4}
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm font-mono text-xs"
                  placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
                />
                <p className="mt-2 text-xs text-gray-500 flex items-center">
                  <Upload className="w-3 h-3 mr-1" />
                  Leave blank to generate a new key pair. Paste an OpenSSH public key to import it.
                </p>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => navigate("/admin-dashboard/key-pairs")}
                  className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !projectId || !name}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {publicKey ? "Import Key Pair" : "Create & Download"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminKeyPairCreate;
