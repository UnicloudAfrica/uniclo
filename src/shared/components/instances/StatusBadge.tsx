import React from "react";
import {
    CheckCircle,
    Square,
    Pause,
    Moon,
    RotateCw,
    Loader2,
    AlertCircle,
    Trash2,
} from "lucide-react";

export const StatusBadge = ({ status, size = "sm" }: { status: string; size?: "xs" | "sm" }) => {
    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, any> = {
            active: {
                color: "bg-green-100 text-green-800 border-green-200",
                icon: CheckCircle,
                label: "Active",
            },
            running: {
                color: "bg-green-100 text-green-800 border-green-200",
                icon: CheckCircle,
                label: "Running",
            },
            stopped: {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: Square,
                label: "Stopped",
            },
            shutoff: {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: Square,
                label: "Shut Off",
            },
            paused: {
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: Pause,
                label: "Paused",
            },
            suspended: {
                color: "bg-yellow-100 text-yellow-800 border-yellow-200",
                icon: Pause,
                label: "Suspended",
            },
            hibernated: {
                color: "bg-purple-100 text-purple-800 border-purple-200",
                icon: Moon,
                label: "Hibernated",
            },
            reboot: {
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: RotateCw,
                label: "Rebooting",
            },
            hard_reboot: {
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: RotateCw,
                label: "Rebooting",
            },
            provisioning: {
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: Loader2,
                label: "Provisioning",
            },
            building: {
                color: "bg-blue-100 text-blue-800 border-blue-200",
                icon: Loader2,
                label: "Building",
            },
            error: {
                color: "bg-red-100 text-red-800 border-red-200",
                icon: AlertCircle,
                label: "Error",
            },
            deleted: {
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: Trash2,
                label: "Deleted",
            },
        };
        return (
            statusMap[status?.toLowerCase()] || {
                color: "bg-gray-100 text-gray-800 border-gray-200",
                icon: AlertCircle,
                label: status || "Unknown",
            }
        );
    };
    const statusInfo = getStatusInfo(status);
    const Icon = statusInfo.icon;
    const iconSize = size === "xs" ? "w-3 h-3" : "w-4 h-4";
    const textSize = size === "xs" ? "text-xs" : "text-sm";

    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-full ${textSize} font-medium border ${statusInfo.color}`}
        >
            <Icon className={`${iconSize} mr-1 ${statusInfo.icon === Loader2 ? "animate-spin" : ""}`} />
            {statusInfo.label}
        </span>
    );
};
