import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    RefreshCw,
    Plus,
    Server,
    Zap,
    HardDrive,
    Network,
    Copy,
    Terminal,
    MoreHorizontal,
    Eye,
    Pause,
    Moon,
    Trash2,
    Sparkles,
    Search,
} from "lucide-react";
import { ModernButton, ModernTable, ModernCard } from "../ui";
import { StatusBadge } from "./StatusBadge";
import InstanceStats from "./InstanceStats";
import { useConsoleManager } from "../../../components/Console/EmbeddedConsole";
import ToastUtils from "../../../utils/toastUtil";

// Hooks
import { useFetchPurchasedInstances } from "../../../hooks/adminHooks/instancesHook";
import { useFetchClientPurchasedInstances } from "../../../hooks/clientHooks/instanceHooks";
import { useFetchTenantInstances } from "../../../hooks/tenantHooks/instancesHook";

interface SharedInstanceListProps {
    context: "admin" | "tenant" | "client";
}

const SharedInstanceList: React.FC<SharedInstanceListProps> = ({ context }) => {
    const navigate = useNavigate();

    // Resolve Hook based on context
    const useInstances = useMemo(() => {
        switch (context) {
            case "admin":
                return useFetchPurchasedInstances;
            case "client":
                return useFetchClientPurchasedInstances;
            case "tenant":
                return useFetchTenantInstances;
            default:
                return useFetchPurchasedInstances;
        }
    }, [context]);

    const { isFetching, data: instancesResponse, refetch } = useInstances();
    const instances = instancesResponse?.data || [];

    const { openConsole } = useConsoleManager();

    // Resolve Base Path
    const basePath = useMemo(() => {
        switch (context) {
            case "admin":
                return "/admin-dashboard";
            case "client":
                return "/client-dashboard";
            case "tenant":
                return "/dashboard";
            default:
                return "";
        }
    }, [context]);

    const navigateToDetails = (instance: any) => {
        const identifier = instance.identifier || instance.id;
        if (!identifier) {
            ToastUtils.error("Instance identifier missing.");
            return;
        }

        // Client dashboard uses a slightly different URL structure in previous code
        // "id" param which is base64 encoded identifier?
        // Admin uses "identifier".
        // We should try to standardize, but if legacy code depends on "id", we must respect it.
        // However, for this refactor, let's try to use "identifier" query param for all if possible,
        // OR adapt based on context.

        if (context === "client") {
            const encodedId = encodeURIComponent(btoa(identifier));
            const instanceName = encodeURIComponent(
                instance.name || `Instance-${identifier.slice(-8)}`
            );
            // Using window.location.href for client as seen in original file? 
            // Or navigate()? standard navigate preferred usually.
            navigate(`${basePath}/instances/details?id=${encodedId}&name=${instanceName}`);
        } else {
            navigate(`${basePath}/instances/details?identifier=${encodeURIComponent(identifier)}`);
        }
    };

    const handleConsoleAccess = (instanceIdentifier: string) => {
        openConsole(instanceIdentifier);
    };

    // Instance Actions - Mocked or passed down?
    // Previous AdminInstances had mocked actions.
    // ClientInstances had 'Manage' button.
    // We'll keep it simple: "View Details", "Console" (if running).

    const columns = useMemo(() => {
        const cols = [
            {
                key: "name",
                header: "Instance",
                sortable: true,
                render: (_: any, instance: any) => (
                    <div className="flex items-center gap-3">
                        <div className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 md:block">
                            <Server className="h-4 w-4" />
                        </div>
                        <div>
                            <button
                                onClick={() => navigateToDetails(instance)}
                                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 text-left"
                            >
                                {instance.name || `Instance-${(instance.identifier || "").slice(-8)}`}
                            </button>
                            <p className="font-mono text-xs text-slate-400">{instance.identifier}</p>
                        </div>
                    </div>
                ),
            },
            {
                key: "status",
                header: "Status",
                sortable: true,
                render: (value: string) => <StatusBadge status={value} size="xs" />,
            },
            // Tenant/Owner column for Admin/Tenant contexts?
            ...(context !== "client"
                ? [
                    {
                        key: "owner",
                        header: "Owner",
                        render: (_: any, instance: any) => {
                            const clientName = instance.client?.name || instance.client?.company_name || instance.user?.name || "N/A";
                            const tenantName = instance.tenant?.name || instance.tenant?.company_name;
                            return (
                                <div className="text-xs text-slate-600">
                                    <div className="font-medium">{clientName}</div>
                                    {tenantName && <div className="text-slate-400">{tenantName}</div>}
                                </div>
                            )
                        }
                    },
                ]
                : []),
            {
                key: "resources",
                header: "Resources",
                render: (_: any, instance: any) => (
                    <div className="space-y-1.5 text-sm text-slate-800">
                        <div className="flex items-center">
                            <Zap className="mr-1 h-3 w-3 text-blue-500" />
                            <span>{instance.compute?.vcpus || instance.vcpus || 0} vCPU</span>
                        </div>
                        <div className="flex items-center">
                            <HardDrive className="mr-1 h-3 w-3 text-emerald-500" />
                            <span>
                                {instance.compute?.memory_mb
                                    ? Math.round(instance.compute.memory_mb / 1024)
                                    : instance.memory_gb || 0}{" "}
                                GB
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: "ip_address",
                header: "IP Address",
                render: (_: any, instance: any) => (
                    <div className="flex items-center text-sm text-slate-800">
                        <Network className="mr-2 h-4 w-4 text-slate-400" />
                        <span>{instance.floating_ip?.ip_address || instance.private_ip || "N/A"}</span>
                        {(instance.floating_ip?.ip_address || instance.private_ip) && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                        instance.floating_ip?.ip_address || instance.private_ip
                                    );
                                    ToastUtils.success("IP copied to clipboard");
                                }}
                                className="ml-2 rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-blue-500"
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                ),
            },
            {
                key: "created_at",
                header: "Created",
                sortable: true,
                render: (value: string) => (
                    <div className="text-sm text-slate-500">
                        {value ? new Date(value).toLocaleDateString() : "N/A"}
                    </div>
                ),
            },
            {
                key: "actions",
                header: "Actions",
                align: "right",
                render: (_: any, instance: any) => {
                    const status = (instance.status || "").toLowerCase();
                    const isRunning = ["active", "running"].includes(status);

                    return (
                        <div className="flex items-center justify-end gap-2">
                            {isRunning && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleConsoleAccess(instance.identifier || instance.id);
                                    }}
                                    className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-blue-200 hover:text-blue-500"
                                    title="Console"
                                >
                                    <Terminal className="h-4 w-4" />
                                </button>
                            )}

                            {/* Quick Manage Button */}
                            <button
                                onClick={() => navigateToDetails(instance)}
                                className="rounded-md bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-blue-600"
                            >
                                Manage
                            </button>
                        </div>
                    );
                },
            },
        ];
        return cols;
    }, [context, navigateToDetails]);

    const provisioningCount = instances.filter((i: any) =>
        ["provisioning", "building", "reboot", "hard_reboot"].includes((i.status || "").toLowerCase())
    ).length;

    const consoles = []; // Use context aware consoles if possible? 
    // embedded console manager handles its own state generally but requires provider.
    // assuming parent provider.

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Helper Header Actions are usually in PageShell title, but we can render a toolbar here if needed. 
            However, PageShell accepts 'actions' prop. 
            The consumer of this component should likely handle the "New Instance" button in their Shell.
            But we can render the Hero here.
        */}

            <div className="brand-hero rounded-[32px] text-white shadow-2xl">
                <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                            <Sparkles size={14} />
                            Fleet Control
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Orchestrate every workload
                            </h2>
                            <p className="max-w-2xl text-sm text-white/80 sm:text-base">
                                Real-time visibility into your {context === 'client' ? 'compute resources' : 'infrastructure'} across regions.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur text-center min-w-[120px]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                                Total
                            </p>
                            <p className="mt-2 text-2xl font-bold text-white">
                                {instances.length}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur text-center min-w-[120px]">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                                Provisioning
                            </p>
                            <p className="mt-2 text-2xl font-bold text-white">
                                {provisioningCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <InstanceStats instances={instances} />

            <ModernTable
                data={instances}
                columns={columns as any}
                title="Instances"
                searchable
                searchKeys={["name", "identifier", "floating_ip.ip_address", "private_ip", "owner"]}
                loading={isFetching}
                emptyMessage="No instances found."
                filterSlot={
                    <div className="flex items-center gap-2">
                        <ModernButton variant="ghost" size="sm" onClick={() => refetch()} leftIcon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}>
                            Refresh
                        </ModernButton>
                        <ModernButton variant="primary" size="sm" onClick={() => (context === 'client' ? window.location.href = `${basePath}/instances/provision` : navigate(`${basePath}/create-instance`))} leftIcon={<Plus className="w-4 h-4" />}>
                            New Instance
                        </ModernButton>
                    </div>
                }
            />
        </div>
    );
};

export default SharedInstanceList;
