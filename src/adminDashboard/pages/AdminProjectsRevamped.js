import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Settings,
  Trash2,
  Server,
  Database,
  Network,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { useFetchProjects, useDeleteProject } from "../../hooks/adminHooks/projectHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import Skeleton from "react-loading-skeleton";
import { toast } from "sonner";
import CreateProjectModal from "./projectComps/addProject";

const AdminProjectsRevamped = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRegion, setFilterRegion] = useState("");

  const toggleMobileMenu = () =>
    setIsMobileMenuOpen((prevState) => !prevState);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Pagination from URL
  const currentPage = Number(searchParams.get("page")) || 1;
  const itemsPerPage = Number(searchParams.get("per_page")) || 15;

  // Fetch projects with filters
  const {
    data: projectsResponse,
    isLoading,
    isFetching,
    refetch
  } = useFetchProjects({
    page: currentPage,
    per_page: itemsPerPage,
    status: filterStatus || undefined,
    region: filterRegion || undefined
  });

  const deleteProject = useDeleteProject();

  // Debug: Log API response structure
  React.useEffect(() => {
    if (projectsResponse) {
      console.log('API Response structure:', projectsResponse);
      console.log('First project:', projectsResponse?.data?.data?.[0] || projectsResponse?.data?.[0]);
    }
  }, [projectsResponse]);

  // Extract data - handle both possible response structures
  const projects = projectsResponse?.data?.data || projectsResponse?.data || [];
  const pagination = projectsResponse?.data?.meta || projectsResponse?.meta;
  const totalProjects = pagination?.total || 0;
  const totalPages = pagination?.last_page || 1;

  // Filter locally by search query
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name?.toLowerCase().includes(query) ||
      project.identifier?.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  });

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams({ page: newPage, per_page: itemsPerPage });
  };

  // Handle delete
  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;

    try {
      await deleteProject.mutateAsync(projectId);
      toast.success("Project deleted successfully");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete project");
    }
  };

  // Status badge component
  const StatusBadge = ({ status, provisioningProgress }) => {
    const getStatusConfig = () => {
      if (provisioningProgress?.status === 'provisioning' || provisioningProgress?.status === 'pending') {
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Loader2 size={14} className="animate-spin" />,
          label: 'Provisioning...'
        };
      }

      switch (status) {
        case 'active':
          return {
            bg: 'bg-green-100',
            text: 'text-green-800',
            icon: <CheckCircle2 size={14} />,
            label: 'Active'
          };
        case 'inactive':
          return {
            bg: 'bg-gray-100',
            text: 'text-gray-800',
            icon: <Clock size={14} />,
            label: 'Inactive'
          };
        case 'error':
          return {
            bg: 'bg-red-100',
            text: 'text-red-800',
            icon: <AlertCircle size={14} />,
            label: 'Error'
          };
        default:
          return {
            bg: 'bg-blue-100',
            text: 'text-blue-800',
            icon: <Clock size={14} />,
            label: 'Pending'
          };
      }
    };

    const config = getStatusConfig();

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Stats cards
  const StatsCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />

      <div className="flex-1 flex flex-col md:ml-20 lg:ml-[20%]">
        <AdminHeadbar onMenuClick={toggleMobileMenu} />

        <main className="flex-1 p-4 sm:p-6 pt-[6.5rem] overflow-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
                <p className="text-gray-600 mt-1">Manage your cloud infrastructure projects</p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                Create Project
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatsCard
              icon={FolderOpen}
              label="Total Projects"
              value={totalProjects}
              color="bg-blue-500"
            />
            <StatsCard
              icon={CheckCircle2}
              label="Active Projects"
              value={projects.filter(p => p.status === 'active').length}
              color="bg-green-500"
            />
            <StatsCard
              icon={Loader2}
              label="Provisioning"
              value={projects.filter(p => p.provisioning_progress?.status === 'provisioning').length}
              color="bg-yellow-500"
            />
            <StatsCard
              icon={Server}
              label="Total Instances"
              value={projects.reduce((sum, p) => sum + (p.resources_count?.instances || 0), 0)}
              color="bg-purple-500"
            />
          </div>

          {/* Filters and Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="sm:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search projects by name, identifier..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="error">Error</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} height={80} />
                ))}
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterStatus ? "Try adjusting your filters" : "Get started by creating your first project"}
                </p>
                {!searchQuery && !filterStatus && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Plus size={20} />
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredProjects.map((project) => (
                    <div key={project.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                            <FolderOpen size={20} className="text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{project.identifier}</p>
                            {project.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                            )}
                          </div>
                        </div>
                        <StatusBadge
                          status={project.status}
                          provisioningProgress={project.provisioning_progress}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Region</p>
                          <p className="text-sm font-medium text-gray-900">{project.default_region || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Provider</p>
                          <p className="text-sm font-medium text-gray-900">{project.default_provider || 'zadara'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Server size={12} />
                            <span>{project.resources_count?.instances || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Database size={12} />
                            <span>{project.resources_count?.volumes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Network size={12} />
                            <span>{project.resources_count?.vpcs || 0}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const projectId = project.identifier || project.id;
                              navigate(`/admin-dashboard/projects-revamped/details?identifier=${projectId}`);
                            }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id)}
                            disabled={deleteProject.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full min-w-[960px]">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Project
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Region
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resources
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProjects.map((project) => (
                        <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary-100 rounded-lg">
                                <FolderOpen size={20} className="text-primary-600" />
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{project.name}</div>
                                <div className="text-sm text-gray-500">{project.identifier}</div>
                                {project.description && (
                                  <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                                    {project.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">{project.default_region || 'N/A'}</div>
                              <div className="text-gray-500">{project.default_provider || 'zadara'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge
                              status={project.status}
                              provisioningProgress={project.provisioning_progress}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <div className="flex items-center gap-1" title="Instances">
                                <Server size={14} />
                                <span>{project.resources_count?.instances || 0}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Volumes">
                                <Database size={14} />
                                <span>{project.resources_count?.volumes || 0}</span>
                              </div>
                              <div className="flex items-center gap-1" title="Networks">
                                <Network size={14} />
                                <span>{project.resources_count?.vpcs || 0}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {new Date(project.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const projectId = project.identifier || project.id;
                                  console.log('Navigating to project:', { identifier: project.identifier, id: project.id, using: projectId });
                                  navigate(`/admin-dashboard/projects-revamped/details?identifier=${projectId}`);
                                }}
                                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => navigate(`/admin-dashboard/projects/edit?id=${project.id}`)}
                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Settings"
                              >
                                <Settings size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(project.id)}
                                disabled={deleteProject.isPending}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {pagination?.from || 0} to {pagination?.to || 0} of {totalProjects} projects
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Create Project Modal */}
      {isCreateModalOpen && (
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default AdminProjectsRevamped;
