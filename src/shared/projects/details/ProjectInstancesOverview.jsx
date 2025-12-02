import React from "react";
import { Plus } from "lucide-react";
import ModernCard from "../../../adminDashboard/components/ModernCard";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import { designTokens } from "../../../styles/designTokens";

const instanceStatusPalette = (status) => {
    const normalized = (status || "").toLowerCase();
    if (["running", "active", "ready"].includes(normalized)) {
        return {
            bg: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
        };
    }
    if (["pending", "provisioning", "creating", "initializing"].includes(normalized)) {
        return {
            bg: designTokens.colors.warning[50],
            text: designTokens.colors.warning[700],
        };
    }
    if (["stopped", "inactive", "terminated"].includes(normalized)) {
        return {
            bg: designTokens.colors.neutral[100],
            text: designTokens.colors.neutral[600],
        };
    }
    if (["error", "failed"].includes(normalized)) {
        return {
            bg: designTokens.colors.error[50],
            text: designTokens.colors.error[700],
        };
    }
    return {
        bg: designTokens.colors.primary[50],
        text: designTokens.colors.primary[700],
    };
};

const ProjectInstancesOverview = ({
    instanceStats,
    recentInstances = [],
    projectInstances = [],
    onViewInstance,
    onAddInstance,
    onViewAllInstances,
    canCreateInstances,
    resolvedProjectId,
}) => {
    return (
        <ModernCard padding="lg" variant="outlined">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Instances overview</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Review instance activity before jumping into the detailed tabs below.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ModernButton
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={onViewAllInstances}
                        disabled={!resolvedProjectId}
                    >
                        View all instances
                    </ModernButton>
                    <ModernButton
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={onAddInstance}
                        disabled={!resolvedProjectId}
                    >
                        <Plus size={16} />
                        Add Instance
                    </ModernButton>
                </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    className="rounded-xl border p-4"
                    style={{
                        borderColor: designTokens.colors.primary[100],
                        backgroundColor: designTokens.colors.primary[50],
                    }}
                >
                    <p
                        className="text-xs font-semibold uppercase"
                        style={{ color: designTokens.colors.primary[700] }}
                    >
                        Total
                    </p>
                    <p
                        className="mt-2 text-2xl font-semibold"
                        style={{ color: designTokens.colors.primary[700] }}
                    >
                        {instanceStats.total}
                    </p>
                    <p
                        className="text-xs"
                        style={{ color: designTokens.colors.primary[600] }}
                    >
                        Instances discovered
                    </p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.success[100] }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.success[700] }}>
                        Running
                    </p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.success[700] }}>
                        {instanceStats.running}
                    </p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.warning[100] }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.warning[700] }}>
                        Provisioning
                    </p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.warning[700] }}>
                        {instanceStats.provisioning}
                    </p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: designTokens.colors.warning[100] }}>
                    <p className="text-xs font-semibold uppercase" style={{ color: designTokens.colors.warning[700] }}>
                        Payment pending
                    </p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: designTokens.colors.warning[700] }}>
                        {instanceStats.paymentPending}
                    </p>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">Most recent instances</p>
                    <span className="text-xs text-gray-500">Showing {recentInstances.length} of {projectInstances.length}</span>
                </div>
                {recentInstances.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
                        No instances have been provisioned yet. Use the button above to start a deployment.
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    <th className="px-4 py-3">Instance</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Created</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white text-sm">
                                {recentInstances.map((instance) => {
                                    const palette = instanceStatusPalette(instance.status);
                                    return (
                                        <tr key={instance.id || instance.identifier}>
                                            <td className="px-4 py-3">
                                                <div className="space-y-1">
                                                    <p className="font-medium text-gray-900">
                                                        {instance.name || instance.identifier || "Unnamed Instance"}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {instance.identifier || "—"}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {instance.flavor || instance.instance_type || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                                                    style={{
                                                        backgroundColor: palette.bg,
                                                        color: palette.text,
                                                    }}
                                                >
                                                    {instance.status?.replace(/_/g, " ") || "Unknown"}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {instance.created_at
                                                    ? new Date(instance.created_at).toLocaleString()
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <ModernButton
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-xs"
                                                    onClick={() => onViewInstance(instance)}
                                                >
                                                    View
                                                </ModernButton>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ModernCard>
    );
};

export default ProjectInstancesOverview;
