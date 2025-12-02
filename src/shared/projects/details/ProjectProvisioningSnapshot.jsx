import React from "react";
import {
    CheckCircle,
    XCircle,
    RefreshCw,
} from "lucide-react";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import { designTokens } from "../../../styles/designTokens";

const ProjectProvisioningSnapshot = ({
    summary = [],
    providerLabel,
    projectRegion,
    hasTenantAdmin,
    edgeComponent,
    isEdgeSyncing,
    onEdgeSync,
    onManageEdge,
}) => {
    const completedSummaryCount = summary.filter(
        (item) => item?.completed === true
    ).length;
    const completionRatio =
        summary.length > 0
            ? Math.round((completedSummaryCount / summary.length) * 100)
            : 0;

    const componentIndicatesComplete = (comp) => {
        if (!comp) return false;
        if (comp.status === "completed") return true;
        if (typeof comp.count === "number" && comp.count > 0) return true;
        if (Array.isArray(comp.details) && comp.details.length > 0) return true;
        return false;
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
                <div
                    className="rounded-2xl p-6"
                    style={{
                        background: "linear-gradient(135deg, #0b63ce 0%, #6aa4ff 45%, #051937 100%)",
                        color: "#fff",
                    }}
                >
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                                <CheckCircle size={14} />
                                {completedSummaryCount} of {summary.length} provisioning steps complete
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                                {providerLabel}
                            </span>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium">
                                Region • {projectRegion || "NA"}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold">Provisioning Snapshot</h2>
                            <p className="mt-2 text-sm text-white/70">
                                Keep an eye on what is ready, what is pending, and which users need attention before the environment can go live.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="relative">
                                <div
                                    className="h-20 w-20 rounded-full flex items-center justify-center text-lg font-semibold"
                                    style={{
                                        background: `conic-gradient(${designTokens.colors.primary[200]} ${completionRatio}%, rgba(255,255,255,0.15) 0)`,
                                        color: "#fff",
                                    }}
                                >
                                    <span className="text-xl font-semibold">{completionRatio}%</span>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-white/80">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} className="text-emerald-200" />
                                    <span>{completedSummaryCount} completed checklist items</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hasTenantAdmin ? (
                                        <CheckCircle size={16} className="text-emerald-200" />
                                    ) : (
                                        <XCircle size={16} className="text-red-200" />
                                    )}
                                    <span>
                                        {hasTenantAdmin
                                            ? "Tenant admin provisioning available"
                                            : "Add at least one tenant admin to activate provisioning"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {componentIndicatesComplete(edgeComponent) ? (
                                        <CheckCircle size={16} className="text-emerald-200" />
                                    ) : (
                                        <XCircle size={16} className="text-yellow-200" />
                                    )}
                                    <span>
                                        {componentIndicatesComplete(edgeComponent)
                                            ? "Edge network ready"
                                            : "Sync edge network configuration"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div
                        className="rounded-2xl border p-4"
                        style={{
                            borderColor: hasTenantAdmin
                                ? designTokens.colors.success[200]
                                : designTokens.colors.warning[200],
                            backgroundColor: hasTenantAdmin
                                ? designTokens.colors.success[50]
                                : designTokens.colors.warning[50],
                        }}
                    >
                        <p className="text-sm font-semibold" style={{ color: hasTenantAdmin ? designTokens.colors.success[700] : designTokens.colors.warning[700] }}>
                            {hasTenantAdmin
                                ? "Provisioning is unlocked"
                                : "A tenant admin is required to activate provisioning"}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: hasTenantAdmin ? designTokens.colors.success[600] : designTokens.colors.warning[600] }}>
                            {hasTenantAdmin
                                ? "At least one tenant admin can initiate provisioning flows, while other users remain members."
                                : "Switch a project user to the tenant_admin role to unlock provisioning actions."}
                        </p>
                    </div>

                    <div
                        className="rounded-2xl border p-4"
                        style={{ borderColor: designTokens.colors.neutral[200], backgroundColor: designTokens.colors.neutral[0] }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                                    Edge Network Sync
                                </p>
                                <p className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                                    {componentIndicatesComplete(edgeComponent)
                                        ? "Edge configuration is in sync."
                                        : "Synchronize edge configuration with provider."}
                                </p>
                            </div>
                            <ModernButton
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                                onClick={onManageEdge}
                            >
                                Manage
                            </ModernButton>
                        </div>
                        <ModernButton
                            size="sm"
                            variant="outline"
                            className="mt-3 flex items-center gap-2"
                            onClick={onEdgeSync}
                            disabled={isEdgeSyncing}
                        >
                            <RefreshCw size={14} className={isEdgeSyncing ? "animate-spin" : ""} />
                            {isEdgeSyncing ? "Syncing edge configuration..." : "Sync edge configuration"}
                        </ModernButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectProvisioningSnapshot;
