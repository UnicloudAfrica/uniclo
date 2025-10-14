import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Server,
  Database,
  Network,
  Key,
  Shield,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Activity,
  HardDrive,
  Boxes,
  Info
} from "lucide-react";
import { 
  useFetchProjectById,
  useProvisionProject,
  useVerifyZadara,
  useEnableVpc,
  useProjectStatus
} from "../../hooks/adminHooks/projectHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import Skeleton from "react-loading-skeleton";
import { toast } from "sonner";

const AdminProjectDetailsRevamped = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Get project identifier from URL and validate it
  const rawIdentifier = searchParams.get("identifier") || searchParams.get("id");
  
  // Validate identifier format (should be 6 uppercase alphanumeric characters)
  const projectIdentifier = rawIdentifier;
  
  // Debug log
  useEffect(() => {
    if (rawIdentifier) {
      console.log('Raw identifier from URL:', rawIdentifier);
      console.log('Length:', rawIdentifier.length);
      console.log('Encoded:', encodeURIComponent(rawIdentifier));
    }
  }, [rawIdentifier]);

  // Fetch project details
  const {
    data: projectResponse,
    isLoading,
    refetch: refetchProject
  } = useFetchProjectById(projectIdentifier);

  const project = projectResponse?.data;
  
  // Additional hooks for project actions
  const provisionMutation = useProvisionProject();
  const enableVpcMutation = useEnableVpc();
  const { data: zadaraVerification, refetch: refetchZadara } = useVerifyZadara(
    projectIdentifier,
    { enabled: false } // Only fetch on demand
  );
  
  // Handlers
  const handleProvision = async () => {
    if (!window.confirm('Are you sure you want to provision this project?')) return;
    
    try {
      await provisionMutation.mutateAsync(projectIdentifier);
      toast.success('Project provisioning started!');
      refetchProject();
    } catch (error) {
      toast.error(error.message || 'Failed to provision project');
    }
  };
  
  const handleVerifyZadara = async () => {
    try {
      await refetchZadara();
      toast.success('Zadara verification complete');
    } catch (error) {
      toast.error(error.message || 'Failed to verify Zadara connection');
    }
  };
  
  const handleEnableVpc = async () => {
    if (!window.confirm('Enable VPC for this project?')) return;
    
    try {
      await enableVpcMutation.mutateAsync(projectIdentifier);
      toast.success('VPC enabled successfully!');
      refetchProject();
    } catch (error) {
      toast.error(error.message || 'Failed to enable VPC');
    }
  };

  // Auto-refresh if provisioning
  useEffect(() => {
    if (project?.provisioning_progress?.status === 'provisioning') {
      const interval = setInterval(() => {
        refetchProject();
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [project?.provisioning_progress?.status, refetchProject]);

  // Status badge
  const StatusBadge = ({ status, provisioningProgress }) => {
    const getConfig = () => {
      if (provisioningProgress?.status === 'provisioning' || provisioningProgress?.status === 'pending') {
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Loader2 size={16} className="animate-spin" />,
          label: 'Provisioning...'
        };
      }

      switch (status) {
        case 'active':
          return {
            bg: 'bg-green-100',
            text: 'text-green-800',
            icon: <CheckCircle2 size={16} />,
            label: 'Active'
          };
        case 'inactive':
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: <Clock size={16} />,
            label: 'Inactive'
          };
        case 'error':
          return {
            bg: 'bg-red-100',
            text: 'text-red-800',
            icon: <AlertCircle size={16} />,
            label: 'Error'
          };
        default:
          return {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            icon: <Clock size={16} />,
            label: 'Pending'
          };
      }
    };

    const config = getConfig();

    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Info card component
  const InfoCard = ({ icon: Icon, label, value, color = "bg-blue-500" }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  // Tabs
  const tabs = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "instances", label: "Instances", icon: Server },
    { id: "volumes", label: "Volumes", icon: Database },
    { id: "networks", label: "Networks", icon: Network },
    { id: "security", label: "Security", icon: Shield }
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col md:ml-20 lg:ml-[20%]">
          <AdminHeadbar
            toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Project Details"
          />
          <main className="flex-1 p-6 pt-20 md:pt-6">
            <Skeleton height={200} className="mb-6" />
            <Skeleton height={400} />
          </main>
        </div>
      </div>
    );
  }

  if (!project && !isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />
        <div className="flex-1 flex flex-col md:ml-20 lg:ml-[20%]">
          <AdminHeadbar
            toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            title="Project Details"
          />
          <main className="flex-1 p-6 pt-20 md:pt-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
              <p className="text-sm text-gray-500 mb-4">Identifier: <code className="bg-gray-100 px-2 py-1 rounded">{projectIdentifier}</code></p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-gray-700 mb-2"><strong>This might be cached data.</strong></p>
                <p className="text-xs text-gray-600">Try:</p>
                <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1 mt-2">
                  <li>Hard refresh the page (Cmd/Ctrl + Shift + R)</li>
                  <li>Clear browser cache</li>
                  <li>Go back to projects list and click again</li>
                </ol>
              </div>
              <button
                onClick={() => {
                  // Clear React Query cache
                  window.location.href = "/admin-dashboard/projects-revamped";
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                ← Back to projects list
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col md:ml-20 lg:ml-[20%]">
        <AdminHeadbar
          toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          title="Project Details"
        />

        <main className="flex-1 p-6 pt-20 md:pt-6 overflow-auto">
          {/* Back button */}
          <button
            onClick={() => navigate("/admin-dashboard/projects-revamped")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Projects
          </button>

          {/* Project Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.name}</h1>
                <p className="text-gray-600">{project.description || "No description"}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-sm text-gray-500">ID: {project.identifier}</span>
                  <span className="text-gray-300">|</span>
                  <StatusBadge
                    status={project.status}
                    provisioningProgress={project.provisioning_progress}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    refetchProject();
                    toast.success("Project data refreshed");
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                
                {/* Show provision button only if project is pending */}
                {project.status === 'pending' && (
                  <button
                    onClick={handleProvision}
                    disabled={provisionMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {provisionMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Settings size={16} />}
                    Provision
                  </button>
                )}
                
                {/* Verify Zadara button */}
                <button
                  onClick={handleVerifyZadara}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Verify Zadara Connection"
                >
                  <CheckCircle2 size={16} />
                  Verify
                </button>
                
                {/* Enable VPC button (if not already enabled) */}
                {project.type !== 'vpc' && (
                  <button
                    onClick={handleEnableVpc}
                    disabled={enableVpcMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    title="Enable VPC"
                  >
                    {enableVpcMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Network size={16} />}
                    Enable VPC
                  </button>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <InfoCard
                icon={Network}
                label="Region"
                value={project.default_region || "N/A"}
                color="bg-blue-500"
              />
              <InfoCard
                icon={Activity}
                label="Provider"
                value={project.default_provider || "zadara"}
                color="bg-purple-500"
              />
              <InfoCard
                icon={Server}
                label="Instances"
                value={project.resources_count?.instances || 0}
                color="bg-green-500"
              />
              <InfoCard
                icon={Database}
                label="Volumes"
                value={project.resources_count?.volumes || 0}
                color="bg-orange-500"
              />
            </div>
          </div>

          {/* Provisioning Progress */}
          {project.provisioning_progress && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Provisioning Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {project.provisioning_progress.status}
                  </span>
                </div>
                {project.provisioning_progress.step && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Step:</span>
                    <span className="font-medium text-gray-900">
                      {project.provisioning_progress.step}
                    </span>
                  </div>
                )}
                {project.provisioning_started_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(project.provisioning_started_at).toLocaleString()}
                    </span>
                  </div>
                )}
                {project.provisioning_completed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(project.provisioning_completed_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Tab Headers */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-primary-600 text-primary-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <tab.icon size={18} />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Name</label>
                        <p className="font-medium text-gray-900">{project.name}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Identifier</label>
                        <p className="font-medium text-gray-900">{project.identifier}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Type</label>
                        <p className="font-medium text-gray-900 capitalize">{project.type || "standard"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Provider Resource ID</label>
                        <p className="font-medium text-gray-900">{project.provider_resource_id || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Created At</label>
                        <p className="font-medium text-gray-900">
                          {new Date(project.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">Updated At</label>
                        <p className="font-medium text-gray-900">
                          {new Date(project.updated_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Resource Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resources Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <Server size={24} className="mx-auto text-primary-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {project.resources_count?.instances || 0}
                        </p>
                        <p className="text-sm text-gray-600">Instances</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <Database size={24} className="mx-auto text-orange-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {project.resources_count?.volumes || 0}
                        </p>
                        <p className="text-sm text-gray-600">Volumes</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <Network size={24} className="mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {project.resources_count?.vpcs || 0}
                        </p>
                        <p className="text-sm text-gray-600">VPCs</p>
                      </div>
                      <div className="border border-gray-200 rounded-lg p-4 text-center">
                        <Boxes size={24} className="mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                          {project.resources_count?.subnets || 0}
                        </p>
                        <p className="text-sm text-gray-600">Subnets</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "instances" && (
                <div className="text-center py-12 text-gray-600">
                  <Server size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Instances list will be displayed here</p>
                  <button
                    onClick={() => navigate(`/admin-dashboard/instances?project=${project.identifier}`)}
                    className="mt-4 text-primary-600 hover:text-primary-700"
                  >
                    View all instances →
                  </button>
                </div>
              )}

              {activeTab === "volumes" && (
                <div className="text-center py-12 text-gray-600">
                  <Database size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Volumes list will be displayed here</p>
                </div>
              )}

              {activeTab === "networks" && (
                <div className="text-center py-12 text-gray-600">
                  <Network size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Networks list will be displayed here</p>
                </div>
              )}

              {activeTab === "security" && (
                <div className="text-center py-12 text-gray-600">
                  <Shield size={48} className="mx-auto mb-4 text-gray-400" />
                  <p>Security groups and settings will be displayed here</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProjectDetailsRevamped;
