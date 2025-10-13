import React, { useEffect, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernTable from "../components/ModernTable";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernButton from "../components/ModernButton";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { 
  Eye, 
  Loader2, 
  Plus, 
  FolderOpen, 
  Calendar, 
  Users, 
  Activity,
  FileText,
  Settings,
  Check,
  AlertCircle,
  Clock
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import CreateProjectModal from "./projectComps/addProject";
import { designTokens } from "../../styles/designTokens";

// Function to encode the ID for URL
const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

export default function AdminProjects() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedItem, setSelectedItem] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddProjectOpen, setAddProject] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const openAddProject = () => setAddProject(true);
  const closeAddProject = () => setAddProject(false);

  const [currentPage, setCurrentPage] = useState(() => {
    const p = Number(searchParams.get("page"));
    return Number.isFinite(p) && p > 0 ? p : 1;
  });
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const pp = Number(searchParams.get("per_page"));
    return [10, 20, 30].includes(pp) ? pp : 10;
  });

  // Fetch projects with backend pagination
  const { 
    data: projectsResponse, 
    isFetching: isProjectsFetching, 
    isError: isProjectsError, 
    error: projectsError, 
    refetch: refetchProjects 
  } = useFetchProjects(
    { page: currentPage, per_page: itemsPerPage },
    {
      refetchInterval: 5000, // Always refresh every 5 seconds to catch processing updates
      refetchIntervalInBackground: false
    }
  );

  // Extract list and pagination meta
  const currentData = projectsResponse?.data || [];
  const totalPages = projectsResponse?.meta?.last_page || 1;
  const totalProjects = projectsResponse?.meta?.total || 0;

  // Calculate project statistics
  const projectStats = {
    totalProjects: totalProjects,
    activeProjects: currentData.filter(p => p.status === 'active').length,
    completedProjects: currentData.filter(p => p.status === 'completed').length,
    projectTypes: [...new Set(currentData.map(p => p.type))].length
  };

  // Define columns for ModernTable
  const columns = [
    {
      key: 'name',
      header: 'Project Name',
      render: (value) => (
        <div className="flex items-center gap-2">
          <FolderOpen size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (value) => (
        <div className="max-w-xs truncate">
          <span title={value}>{value || 'No description'}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (value) => (
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: designTokens.colors.success[50],
            color: designTokens.colors.success[700]
          }}
        >
          {value || 'Standard'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value, row) => {
        const getStatusStyle = (status) => {
          switch (status) {
            case 'processing':
            case 'provisioning':
              return {
                backgroundColor: '#FEF3C7',
                color: '#D97706',
                icon: <Loader2 size={12} className="animate-spin" />
              };
            case 'active':
              return {
                backgroundColor: '#D1FAE5',
                color: '#059669',
                icon: <Check size={12} />
              };
            case 'failed':
            case 'error':
              return {
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                icon: <AlertCircle size={12} />
              };
            default:
              return {
                backgroundColor: designTokens.colors.neutral[100],
                color: designTokens.colors.neutral[600],
                icon: <Clock size={12} />
              };
          }
        };
        
        const style = getStatusStyle(value);
        return (
          <div className="flex items-center gap-1">
            <span 
              className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
              style={{
                backgroundColor: style.backgroundColor,
                color: style.color
              }}
            >
              {style.icon}
              <span className="capitalize">
                {value === 'processing' ? 'Processing...' : 
                 value === 'provisioning' ? 'Provisioning...' : 
                 value || 'Unknown'}
              </span>
            </span>
            {row._isOptimistic && (
              <span className="text-xs text-gray-400 italic">*</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">
            {value ? new Date(value).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      )
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <Eye size={16} />,
      label: '',
      onClick: (item) => handleRowClick(item)
    }
  ];

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePerPageChange = (e) => {
    const value = Number(e.target.value);
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Keep URL in sync when state changes
  useEffect(() => {
    const currentParamsPage = Number(searchParams.get("page")) || 1;
    const currentParamsPerPage = Number(searchParams.get("per_page")) || 10;
    if (currentParamsPage !== currentPage || currentParamsPerPage !== itemsPerPage) {
      setSearchParams({ page: String(currentPage), per_page: String(itemsPerPage) }, { replace: true });
    }
  }, [currentPage, itemsPerPage, searchParams, setSearchParams]);

  // Update state if URL is changed externally
  useEffect(() => {
    const sp = Number(searchParams.get("page"));
    const spp = Number(searchParams.get("per_page"));
    const pageFromUrl = Number.isFinite(sp) && sp > 0 ? sp : 1;
    const perPageFromUrl = [10, 20, 30].includes(spp) ? spp : 10;
    if (pageFromUrl !== currentPage) setCurrentPage(pageFromUrl);
    if (perPageFromUrl !== itemsPerPage) setItemsPerPage(perPageFromUrl);
  }, [searchParams]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    const encodedId = encodeId(item.identifier);
    const encodedName = encodeURIComponent(item.name);
    navigate(
      `/admin-dashboard/projects/details?id=${encodedId}&name=${encodedName}`
    );
  };

  if (isProjectsFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2 
            className="w-8 h-8 animate-spin" 
            style={{ color: designTokens.colors.primary[500] }}
          />
          <p className="ml-2" style={{ color: designTokens.colors.neutral[700] }}>
            Loading projects...
          </p>
        </main>
      </>
    );
  }

  if (isProjectsError) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main 
          className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex items-center justify-center"
          style={{ backgroundColor: designTokens.colors.neutral[25] }}
        >
          <ModernCard className="max-w-xl w-full">
            <div className="text-center">
              <div 
                className="text-lg font-medium mb-2"
                style={{ color: designTokens.colors.error[700] }}
              >
                Failed to load projects
              </div>
              <div 
                className="text-sm mb-4"
                style={{ color: designTokens.colors.error[600] }}
              >
                {projectsError?.message || "An unexpected error occurred."}
              </div>
              <div className="flex items-center justify-center space-x-2">
                <ModernButton
                  onClick={() => refetchProjects()}
                  variant="outline"
                >
                  Retry
                </ModernButton>
                <ModernButton onClick={openAddProject}>
                  Add Project
                </ModernButton>
              </div>
            </div>
          </ModernCard>
        </main>
        <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Project Management
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Manage and track your infrastructure projects
              </p>
            </div>
            <ModernButton
              onClick={openAddProject}
              className="flex items-center gap-2"
            >
              <Plus size={18} />
              Add Project
            </ModernButton>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Projects"
              value={projectStats.totalProjects}
              icon={<FolderOpen size={24} />}
              change={3}
              trend="up"
              color="primary"
              description="All projects"
            />
            <ModernStatsCard
              title="Active Projects"
              value={projectStats.activeProjects}
              icon={<Activity size={24} />}
              color="success"
              description="Currently active"
            />
            <ModernStatsCard
              title="Completed"
              value={projectStats.completedProjects}
              icon={<FileText size={24} />}
              color="info"
              description="Finished projects"
            />
            <ModernStatsCard
              title="Project Types"
              value={projectStats.projectTypes}
              icon={<Settings size={24} />}
              color="warning"
              description="Different types"
            />
          </div>

          {/* Projects Table */}
          <ModernCard>
            <ModernTable
              title={`Projects (${totalProjects} total)`}
              data={currentData}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={isProjectsFetching}
              onRowClick={handleRowClick}
              emptyMessage="No projects found. Create your first project to get started."
            />
          </ModernCard>
        </div>
      </main>
      <CreateProjectModal isOpen={isAddProjectOpen} onClose={closeAddProject} />
    </>
  );
}