import React, { useState } from "react";
import {
    Loader2,
    Play,
    Square,
    RotateCw,
    Terminal,
    Trash2,
    Eye,
    CheckSquare,
    Square as UncheckedSquare,
    Server,
    HardDrive,
    Network,
    Copy,
    Pause,
    Moon,
    MoreHorizontal,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import StatusBadge from "./InstanceStatusBadge";

const InstanceRow = ({
    instance,
    isSelected,
    onSelect,
    onAction,
    onConsoleAccess,
    onNavigateToDetails,
    actionLoading,
}) => {
    const [showActions, setShowActions] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const handleAction = (action) => {
        setShowActions(false);
        onAction(instance.id, action);
    };

    const quickActions = [
        {
            key: "start",
            label: "Start",
            icon: Play,
            condition: instance.status === "stopped",
        },
        {
            key: "stop",
            label: "Stop",
            icon: Square,
            condition: instance.status === "running",
        },
        {
            key: "reboot",
            label: "Reboot",
            icon: RotateCw,
            condition: instance.status === "running",
        },
        { key: "console", label: "Console", icon: Terminal, condition: true },
    ];

    const availableActions = quickActions.filter((action) => action.condition);

    return (
        <>
            <tr className="transition-colors hover:bg-slate-50/70">
                <td className="px-5 py-4">
                    <button
                        onClick={() => onSelect(instance.id)}
                        className="text-slate-300 transition hover:text-primary-500"
                    >
                        {isSelected ? (
                            <CheckSquare className="h-5 w-5 text-primary-500" />
                        ) : (
                            <UncheckedSquare className="h-5 w-5" />
                        )}
                    </button>
                </td>
                <td className="px-3 py-4">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-slate-300 transition hover:text-primary-500"
                    >
                        {expanded ? (
                            <ChevronDown className="h-4 w-4" />
                        ) : (
                            <ChevronRight className="h-4 w-4" />
                        )}
                    </button>
                </td>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 md:block">
                            <Server className="h-4 w-4" />
                        </div>
                        <div>
                            <button
                                onClick={() => onNavigateToDetails(instance)}
                                className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
                            >
                                {instance.name || `Instance-${instance.identifier?.slice(-8)}`}
                            </button>
                            <p className="font-mono text-xs text-slate-400">
                                {instance.identifier}
                            </p>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4">
                    <StatusBadge status={instance.status} size="xs" />
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                    <div className="flex items-center">
                        <Server className="mr-2 h-4 w-4 text-slate-400" />
                        <span>{instance.compute?.name || "N/A"}</span>
                    </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                    <div className="space-y-1.5">
                        <div className="flex items-center">
                            <div className="mr-1 h-3 w-3 rounded-full bg-primary-500/20 p-0.5">
                                <div className="h-full w-full rounded-full bg-primary-500" />
                            </div>
                            <span>{instance.compute?.vcpus || 0} vCPU</span>
                        </div>
                        <div className="flex items-center">
                            <HardDrive className="mr-1 h-3 w-3 text-emerald-500" />
                            <span>
                                {instance.compute?.memory_mb
                                    ? Math.round(instance.compute.memory_mb / 1024)
                                    : 0}{" "}
                                GB
                            </span>
                        </div>
                    </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                    <div className="flex items-center">
                        <Network className="mr-2 h-4 w-4 text-slate-400" />
                        <span>
                            {instance.floating_ip?.ip_address || instance.private_ip || "N/A"}
                        </span>
                        {(instance.floating_ip?.ip_address || instance.private_ip) && (
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        instance.floating_ip?.ip_address || instance.private_ip
                                    );
                                    ToastUtils.success("IP copied to clipboard");
                                }}
                                className="ml-2 rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-primary-500"
                            >
                                <Copy className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">
                    <div className="flex items-center">
                        {/* <Clock className="mr-2 h-4 w-4 text-slate-300" /> */}
                        {instance.created_at
                            ? new Date(instance.created_at).toLocaleDateString()
                            : "N/A"}
                    </div>
                </td>
                <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                        {availableActions.slice(0, 3).map((action) => (
                            <button
                                key={action.key}
                                onClick={() => {
                                    if (action.key === "console") {
                                        onConsoleAccess(instance.id);
                                    } else {
                                        handleAction(action.key);
                                    }
                                }}
                                disabled={actionLoading[instance.id]?.[action.key]}
                                className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-primary-200 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                                title={action.label}
                            >
                                {actionLoading[instance.id]?.[action.key] ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <action.icon className="h-4 w-4" />
                                )}
                            </button>
                        ))}
                        <div className="relative">
                            <button
                                onClick={() => setShowActions(!showActions)}
                                className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-primary-200 hover:text-primary-500"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {showActions && (
                                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl z-10">
                                    <div className="space-y-1 text-sm text-slate-600">
                                        <button
                                            onClick={() => onNavigateToDetails(instance)}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                                        >
                                            <Eye className="h-4 w-4 text-primary-500" />
                                            View Details
                                        </button>
                                        <button
                                            onClick={() => handleAction("suspend")}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                                        >
                                            <Pause className="h-4 w-4 text-amber-500" />
                                            Suspend
                                        </button>
                                        <button
                                            onClick={() => handleAction("hibernate")}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                                        >
                                            <Moon className="h-4 w-4 text-violet-500" />
                                            Hibernate
                                        </button>
                                        <div className="h-px bg-slate-100" />
                                        <button
                                            onClick={() => handleAction("destroy")}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Destroy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </td>
            </tr>
            {expanded && (
                <tr className="bg-slate-50/60">
                    <td colSpan="9" className="px-5 py-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                    Instance details
                                </h4>
                                <dl className="space-y-1">
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Region:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.region || "N/A"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Provider:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.provider || "N/A"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">OS image:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.os_image?.name || "N/A"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                    Network
                                </h4>
                                <dl className="space-y-1">
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Private IP:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.private_ip || "N/A"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Floating IP:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.floating_ip?.ip_address || "N/A"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">
                                            Security group:
                                        </dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.security_group || "N/A"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            <div>
                                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                                    Storage
                                </h4>
                                <dl className="space-y-1">
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Storage size:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.storage_size_gb || "N/A"} GB
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Volume type:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.volume_type?.name || "N/A"}
                                        </dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-xs text-slate-500">Boot from:</dt>
                                        <dd className="text-xs text-slate-800">
                                            {instance.boot_from_volume ? "Volume" : "Image"}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

export default InstanceRow;
