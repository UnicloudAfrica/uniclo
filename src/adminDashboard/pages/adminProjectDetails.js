import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Loader2, 
  RefreshCw,
  CheckCircle, 
  XCircle,
  Network,
  Key,
  Shield,
  Route,
  Wifi,
  Globe,
  GitBranch,
  Radio
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import { useProjectStatus } from "../../hooks/adminHooks/projectHooks";
import KeyPairs from "./infraComps/keyPairs";
import SecurityGroup from "./infraComps/securityGroup";
import VPCs from "./infraComps/vpcs";
import Subnets from "./infraComps/subNet";
import IGWs from "./infraComps/igw";
import RouteTables from "./infraComps/routetable";
import ENIs from "./infraComps/enis";
import EIPs from "./infraComps/eips";
import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import { designTokens } from "../../styles/designTokens";

const decodeId = (encodedId) => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding ID:", e);
    return null;
  }
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("setup");
  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const contentRef = useRef(null);

  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  const projectId = identifierParam
    ? identifierParam
    : encodedProjectId
      ? decodeId(encodedProjectId)
      : null;

  const {
    data: projectStatusData,
    isFetching: isProjectStatusFetching,
    refetch: refetchProjectStatus,
  } = useProjectStatus(projectId);

  const project = projectStatusData?.project;
  const summary = project?.summary ?? [];

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSectionClick = (sectionKey) => {
    setActiveSection(sectionKey);
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Define infrastructure sections with icons and status checks
  const infrastructureSections = [
    { 
      key: "setup", 
      label: "Setup", 
      icon: <CheckCircle size={16} />,
      checkKey: "project_setup_complete"
    },
    { 
      key: "vpcs", 
      label: "VPCs", 
      icon: <Network size={16} />,
      checkKey: "default_vpc_exists"
    },
    { 
      key: "keypairs", 
      label: "Create Key Pair", 
      icon: <Key size={16} />,
      checkKey: "keypairs_exist"
    },
    { 
      key: "edge", 
      label: "Configure Edge Network", 
      icon: <Wifi size={16} />,
      checkKey: "edge_network_configured"
    },
    { 
      key: "security-groups", 
      label: "Create Security Groups", 
      icon: <Shield size={16} />,
      checkKey: "security_groups_exist"
    },
    { 
      key: "subnets", 
      label: "Manage Subnets", 
      icon: <GitBranch size={16} />,
      checkKey: "subnets_exist"
    },
    { 
      key: "igws", 
      label: "Configure IGW", 
      icon: <Globe size={16} />,
      checkKey: "internet_gateway_exists"
    },
    { 
      key: "route-tables", 
      label: "Route Tables", 
      icon: <Route size={16} />,
      checkKey: "route_tables_exist"
    },
    { 
      key: "enis", 
      label: "ENIs", 
      icon: <Radio size={16} />,
      checkKey: "network_interfaces_exist"
    },
    { 
      key: "eips", 
      label: "EIPs", 
      icon: <Wifi size={16} />,
      checkKey: "elastic_ips_exist"
    },
  ];

  const getStatusForSection = (checkKey) => {
    const item = summary.find(s => s.key === checkKey);
    return item?.complete === true;
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "setup":
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
              Project Setup
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Project ID</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.identifier || projectId}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Project Name</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.name || "N/A"}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Region</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.region || "N/A"}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: designTokens.colors.neutral[50] }}>
                <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>Provider</div>
                <div className="text-lg font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                  {project?.provider || "N/A"}
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-3" style={{ color: designTokens.colors.neutral[800] }}>Setup Checklist</h4>
              <div className="space-y-2">
                {summary.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: designTokens.colors.neutral[50] }}
                  >
                    {item.complete ? (
                      <CheckCircle size={18} style={{ color: designTokens.colors.success[500] }} />
                    ) : (
                      <XCircle size={18} style={{ color: designTokens.colors.error[500] }} />
                    )}
                    <span style={{ color: designTokens.colors.neutral[700] }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "vpcs":
        return <VPCs projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "keypairs":
        return <KeyPairs projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "edge":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                Configure Edge Network
              </h3>
              <button
                onClick={() => setIsAssignEdgeOpen(true)}
                className="px-4 py-2 rounded-lg font-medium text-white"
                style={{ backgroundColor: designTokens.colors.primary[600] }}
              >
                Assign Edge Config
              </button>
            </div>
            <p style={{ color: designTokens.colors.neutral[600] }}>
              Configure edge network settings for enhanced connectivity and performance.
            </p>
          </div>
        );
      case "security-groups":
        return <SecurityGroup projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "subnets":
        return <Subnets projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "igws":
        return <IGWs projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "route-tables":
        return <RouteTables projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "enis":
        return <ENIs projectId={projectId} region={project?.region} provider={project?.provider} />;
      case "eips":
        return <EIPs projectId={projectId} region={project?.region} provider={project?.provider} />;
      default:
        return <div>Select a section from the menu</div>;
    }
  };

  if (isProjectStatusFetching && !project) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 
          className="w-12 animate-spin" 
          style={{ color: designTokens.colors.primary[500] }}
        />
      </div>
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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin-dashboard/projects")}
                className="flex items-center gap-2 text-sm font-medium"
                style={{ color: designTokens.colors.primary[600] }}
              >
                <ChevronLeft size={20} />
                Back to Projects
              </button>
            </div>
            <button
              onClick={() => refetchProjectStatus()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              style={{ 
                backgroundColor: designTokens.colors.neutral[100],
                color: designTokens.colors.neutral[700]
              }}
              disabled={isProjectStatusFetching}
            >
              <RefreshCw size={16} className={isProjectStatusFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Overview Block */}
          <ModernCard>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: designTokens.colors.neutral[900] }}>
                {project?.name || "Project Details"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Project ID
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.identifier || projectId}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Region
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.region || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Provider
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.neutral[900] }}>
                    {project?.provider || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: designTokens.colors.neutral[600] }}>
                    Status
                  </div>
                  <div className="text-base font-semibold mt-1" style={{ color: designTokens.colors.success[600] }}>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - 25% */}
            <div className="lg:col-span-1">
              <ModernCard>
                <div className="p-4">
                  <h3 className="font-semibold mb-4" style={{ color: designTokens.colors.neutral[900] }}>
                    Infrastructure Setup
                  </h3>
                  <div className="space-y-1">
                    {infrastructureSections.map((section) => {
                      const isComplete = getStatusForSection(section.checkKey);
                      const isActive = activeSection === section.key;
                      return (
                        <button
                          key={section.key}
                          onClick={() => handleSectionClick(section.key)}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
                          style={{
                            backgroundColor: isActive 
                              ? designTokens.colors.primary[50] 
                              : "transparent",
                            color: isActive 
                              ? designTokens.colors.primary[700] 
                              : designTokens.colors.neutral[700]
                          }}
                        >
                          {isComplete ? (
                            <CheckCircle size={16} style={{ color: designTokens.colors.success[500] }} />
                          ) : (
                            <XCircle size={16} style={{ color: designTokens.colors.error[500] }} />
                          )}
                          <span className="flex-1 text-sm font-medium">{section.label}</span>
                          {React.cloneElement(section.icon, {
                            style: { color: isActive ? designTokens.colors.primary[600] : designTokens.colors.neutral[400] }
                          })}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </ModernCard>
            </div>

            {/* Right Content - 75% */}
            <div className="lg:col-span-3" ref={contentRef}>
              <ModernCard>
                <div className="p-6">
                  {renderSectionContent()}
                </div>
              </ModernCard>
            </div>
          </div>
        </div>
      </main>

      {/* Assign Edge Config Modal */}
      {isAssignEdgeOpen && (
        <AssignEdgeConfigModal
          isOpen={isAssignEdgeOpen}
          onClose={() => setIsAssignEdgeOpen(false)}
          projectId={projectId}
          onSuccess={() => {
            refetchProjectStatus();
            setIsAssignEdgeOpen(false);
          }}
        />
      )}
    </>
  );
}
