/**
 * Instance Helper Utilities
 * Shared utility functions for instance-related operations
 */

import type { Instance, InstanceStatus, InstanceStats } from "../types/instance.types";

/**
 * Get instance status variant (colors and labels)
 */
export const getInstanceStatusVariant = (status: InstanceStatus) => {
  const normalized = status.toString().toLowerCase() as InstanceStatus;

  switch (normalized) {
    case "running":
      return {
        label: "Running",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        icon: "▶",
      };
    case "stopped":
      return {
        label: "Stopped",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
        icon: "■",
      };
    case "pending":
      return {
        label: "Pending",
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
        icon: "○",
      };
    case "stopping":
      return {
        label: "Stopping",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
        icon: "⏸",
      };
    case "terminated":
      return {
        label: "Terminated",
        bg: "bg-red-50",
        text: "text-red-700",
        dot: "bg-red-500",
        icon: "✕",
      };
    case "terminating":
      return {
        label: "Terminating",
        bg: "bg-red-50",
        text: "text-red-600",
        dot: "bg-red-400",
        icon: "⊗",
      };
    case "rebooting":
      return {
        label: "Rebooting",
        bg: "bg-purple-50",
        text: "text-purple-700",
        dot: "bg-purple-500",
        icon: "↻",
      };
    case "error":
      return {
        label: "Error",
        bg: "bg-rose-50",
        text: "text-rose-700",
        dot: "bg-rose-500",
        icon: "⚠",
      };
    default:
      return {
        label: "Unknown",
        bg: "bg-gray-50",
        text: "text-gray-500",
        dot: "bg-gray-300",
        icon: "?",
      };
  }
};

/**
 * Format instance type display
 */
export const formatInstanceType = (instanceType: string): string => {
  // Convert t2.micro to "T2 Micro", etc.
  return instanceType
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

/**
 * Format memory size
 */
export const formatMemory = (memoryMB: number | undefined): string => {
  if (!memoryMB) return "—";

  if (memoryMB >= 1024) {
    return `${(memoryMB / 1024).toFixed(1)} GB`;
  }
  return `${memoryMB} MB`;
};

/**
 * Format storage size
 */
export const formatStorage = (sizeGB: number | undefined): string => {
  if (!sizeGB) return "—";

  if (sizeGB >= 1024) {
    return `${(sizeGB / 1024).toFixed(1)} TB`;
  }
  return `${sizeGB} GB`;
};

/**
 * Calculate instance uptime
 */
export const calculateUptime = (launchTime: string | undefined): string => {
  if (!launchTime) return "—";

  const launch = new Date(launchTime);
  const now = new Date();
  const diffMs = now.getTime() - launch.getTime();

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Calculate instance statistics from array
 */
export const calculateInstanceStats = (instances: Instance[]): InstanceStats => {
  return instances.reduce(
    (stats, instance) => {
      stats.total++;
      const status = instance.status.toLowerCase();

      if (status === "running") stats.running++;
      else if (status === "stopped") stats.stopped++;
      else if (status === "pending") stats.pending++;
      else if (status === "terminated" || status === "terminating") stats.terminated++;
      else if (status === "error") stats.error++;

      return stats;
    },
    { total: 0, running: 0, stopped: 0, pending: 0, terminated: 0, error: 0 }
  );
};

/**
 * Check if instance can be started
 */
export const canStartInstance = (instance: Instance): boolean => {
  const stoppableStatuses: InstanceStatus[] = ["stopped"];
  return stoppableStatuses.includes(instance.status);
};

/**
 * Check if instance can be stopped
 */
export const canStopInstance = (instance: Instance): boolean => {
  const stoppableStatuses: InstanceStatus[] = ["running"];
  return stoppableStatuses.includes(instance.status);
};

/**
 * Check if instance can be rebooted
 */
export const canRebootInstance = (instance: Instance): boolean => {
  const rebootableStatuses: InstanceStatus[] = ["running"];
  return rebootableStatuses.includes(instance.status);
};

/**
 * Check if instance can be terminated
 */
export const canTerminateInstance = (instance: Instance): boolean => {
  const terminatableStatuses: InstanceStatus[] = ["running", "stopped", "error"];
  return terminatableStatuses.includes(instance.status);
};

/**
 * Get available actions for instance
 */
export const getAvailableActions = (instance: Instance) => {
  return {
    canStart: canStartInstance(instance),
    canStop: canStopInstance(instance),
    canReboot: canRebootInstance(instance),
    canTerminate: canTerminateInstance(instance),
  };
};

/**
 * Format IP address display
 */
export const formatIPAddress = (publicIP?: string, privateIP?: string): string => {
  if (publicIP) return publicIP;
  if (privateIP) return `${privateIP} (private)`;
  return "—";
};

/**
 * Extract instance name from tags or use ID
 */
export const getInstanceDisplayName = (instance: Instance): string => {
  if (instance.name) return instance.name;

  const nameTag = instance.tags?.find((tag) => tag.key.toLowerCase() === "name");
  if (nameTag?.value) return nameTag.value;

  return instance.identifier || instance.id.toString();
};

/**
 * Filter instances by search query
 */
export const filterInstancesBySearch = (instances: Instance[], searchQuery: string): Instance[] => {
  if (!searchQuery.trim()) return instances;

  const query = searchQuery.toLowerCase();
  return instances.filter(
    (instance) =>
      getInstanceDisplayName(instance).toLowerCase().includes(query) ||
      instance.identifier?.toLowerCase().includes(query) ||
      instance.instance_type?.toLowerCase().includes(query) ||
      instance.private_ip_address?.toLowerCase().includes(query) ||
      instance.public_ip_address?.toLowerCase().includes(query) ||
      instance.region?.toLowerCase().includes(query)
  );
};

/**
 * Format cost estimate
 */
export const formatCostEstimate = (hourlyRate?: number, currency: string = "USD"): string => {
  if (!hourlyRate) return "—";

  const monthly = hourlyRate * 24 * 30; // Approximate month
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${formatter.format(monthly)}/mo`;
};

/**
 * Sort instances by status priority
 */
export const sortInstancesByStatus = (instances: Instance[]): Instance[] => {
  const statusPriority: Record<InstanceStatus, number> = {
    error: 1,
    terminating: 2,
    rebooting: 3,
    pending: 4,
    stopping: 5,
    running: 6,
    stopped: 7,
    terminated: 8,
    unknown: 9,
  };

  return [...instances].sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    return priorityA - priorityB;
  });
};
