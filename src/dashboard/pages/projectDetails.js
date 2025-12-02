import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Activity,
    CheckCircle,
    Clock,
    Layers,
    Loader2,
    MapPin,
    RefreshCw,
    Server,
    Shield,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import PaymentModal from "../../adminDashboard/components/PaymentModal";
import config from "../../config";
import {
    useFetchTenantProjectById,
    useTenantProjectStatus,
    useUpdateTenantProject,
} from "../../hooks/tenantHooks/projectHooks";
import { useTenantProjectInfrastructureStatus } from "../../hooks/tenantHooks/projectInfrastructureHooks";
import KeyPairs from "./infraComps/KeyPairs";
import SecurityGroup from "./infraComps/SecurityGroup";
import VPCs from "./infraComps/VPCs";
// import Networks from "./infraComps/Networks";
import { useFetchTenantNetworks } from "../../hooks/tenantHooks/networkHooks";
import { useFetchTenantKeyPairs } from "../../hooks/keyPairsHook";
import { useFetchTenantSecurityGroups } from "../../hooks/securityGroupHooks";
import { useFetchTenantSubnets } from "../../hooks/subnetHooks";
import { useFetchTenantIgws } from "../../hooks/internetGatewayHooks";
import { useFetchTenantRouteTables } from "../../hooks/routeTable";
import { useFetchTenantElasticIps } from "../../hooks/elasticIPHooks";
import { useFetchTenantNetworkInterfaces } from "../../hooks/eni";
// import Subnets from "./infraComps/Subnets";
// import IGWs from "./infraComps/IGWs";
// import RouteTables from "./infraComps/RouteTables";
// import ENIs from "./infraComps/ENIs";
// import EIPs from "./infraComps/EIPs";
import TenantAssignEdgeConfigModal from "./projectComps/TenantAssignEdgeConfigModal";
import { designTokens } from "../../styles/designTokens";
import { useFetchTenantProjectEdgeConfig } from "../../hooks/tenantHooks/edgeHooks";
import ToastUtils from "../../utils/toastUtil";

import ProjectDetailsHero from "../../shared/projects/details/ProjectDetailsHero";
import ProjectInstancesOverview from "../../shared/projects/details/ProjectInstancesOverview";
import ProjectInfrastructureJourney from "../../shared/projects/details/ProjectInfrastructureJourney";
import ProjectQuickStatus from "../../shared/projects/details/ProjectQuickStatus";
import ProjectProvisioningSnapshot from "../../shared/projects/details/ProjectProvisioningSnapshot";

const ProjectDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const projectId = queryParams.get("id");
    const projectName = queryParams.get("name");

    const [activeTab, setActiveTab] = useState("overview");
    const [isAssignEdgeModalOpen, setAssignEdgeModalOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    // Fetch Project Data
    const {
        data: projectResponse,
        isLoading: isProjectLoading,
        refetch: refetchProject,
    } = useFetchTenantProjectById(projectId);

    const project = projectResponse?.data || projectResponse?.project || {};

    // Fetch Status & Infrastructure
    const { data: statusData } = useTenantProjectStatus(projectId);
    const { data: infraStatusData } = useTenantProjectInfrastructureStatus(projectId);
    const { data: edgeConfig } = useFetchTenantProjectEdgeConfig(projectId, project?.region);

    // Fetch Resources for Counts (Optional, can rely on infraStatusData)
    // We keep these hooks if we need detailed lists for tabs, but for overview counts, infraStatusData is better.

    const handleBack = () => navigate("/dashboard/projects");

    const handleTabChange = (tabId) => setActiveTab(tabId);

    const handleAssignEdgeSuccess = () => {
        setAssignEdgeModalOpen(false);
        ToastUtils.success("Edge configuration assigned successfully.");
        refetchProject();
    };

    const tabs = [
        { id: "overview", label: "Overview", icon: <Activity size={18} /> },
        { id: "instances", label: "Instances", icon: <Server size={18} /> },
        { id: "infrastructure", label: "Infrastructure", icon: <Layers size={18} /> },
        { id: "security", label: "Security", icon: <Shield size={18} /> },
        // { id: "activity", label: "Activity", icon: <Clock size={18} /> },
    ];

    const renderContent = () => {
        if (activeTab === "overview") {
            return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <ProjectDetailsHero
                        project={project}
                        statusData={statusData}
                        onAssignEdge={() => setAssignEdgeModalOpen(true)}
                        edgeConfig={edgeConfig}
                        isClient={false} // Tenant is not client in this context, or maybe it is? It's Tenant.
                        isTenant={true}
                    />

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            <ProjectInstancesOverview
                                projectId={projectId}
                                region={project.region}
                                onNavigate={(path) => navigate(path)}
                            />
                            <ProjectInfrastructureJourney
                                infraStatus={infraStatusData?.data}
                                projectId={projectId}
                            />
                        </div>
                        <div className="space-y-8">
                            <ProjectQuickStatus
                                project={project}
                                statusData={statusData}
                                infraStatus={infraStatusData?.data}
                            />
                            <ProjectProvisioningSnapshot
                                infraStatus={infraStatusData?.data}
                            />
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === "instances") {
            return (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <ProjectInstancesOverview
                        projectId={projectId}
                        region={project.region}
                        onNavigate={(path) => navigate(path)}
                        detailed={true} // Pass a prop to show more details if needed
                    />
                </div>
            );
        }

        if (activeTab === "infrastructure") {
            return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <VPCs projectId={projectId} region={project.region} />
                    {/* <Subnets projectId={projectId} region={project.region} /> */}
                    {/* <Networks projectId={projectId} region={project.region} /> */}
                    {/* <IGWs projectId={projectId} region={project.region} /> */}
                    {/* <RouteTables projectId={projectId} region={project.region} /> */}
                    {/* <ENIs projectId={projectId} region={project.region} /> */}
                    {/* <EIPs projectId={projectId} region={project.region} /> */}
                    <KeyPairs projectId={projectId} region={project.region} />
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                        Note: Some infrastructure components (Subnets, Networks, etc.) are being ported to the Tenant dashboard.
                    </div>
                </div>
            );
        }

        if (activeTab === "security") {
            return (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <SecurityGroup projectId={projectId} region={project.region} />
                    <KeyPairs projectId={projectId} region={project.region} />
                </div>
            );
        }

        return null;
    };

    if (isProjectLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h2 className="text-xl font-semibold text-gray-800">Project not found</h2>
                <ModernButton onClick={handleBack}>Back to Projects</ModernButton>
            </div>
        );
    }

    return (
        <TenantPageShell
            title={project.name || "Project Details"}
            description={`Manage resources for ${project.name}`}
            headerActions={
                <div className="flex items-center gap-3">
                    <ModernButton variant="outline" onClick={handleBack}>
                        Back
                    </ModernButton>
                    <ModernButton
                        variant="primary"
                        onClick={() => setAssignEdgeModalOpen(true)}
                    >
                        Assign Edge Config
                    </ModernButton>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex gap-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? "text-[#288DD1]"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#288DD1] rounded-t-full" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {renderContent()}
                </div>
            </div>

            <TenantAssignEdgeConfigModal
                isOpen={isAssignEdgeModalOpen}
                onClose={() => setAssignEdgeModalOpen(false)}
                onSuccess={handleAssignEdgeSuccess}
                projectId={projectId}
                region={project.region}
            />

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                amount={0} // Dynamic amount if needed
            />
        </TenantPageShell>
    );
};

export default ProjectDetails;
