/**
 * Module Helper Utilities
 */

import type { Module, ModuleStatus, ModuleStats } from "../types/module.types";

export const getModuleStatusVariant = (status: ModuleStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "beta":
      return { label: "Beta", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "deprecated":
      return {
        label: "Deprecated",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "disabled":
      return { label: "Disabled", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    default:
      return { label: "Unknown", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
  }
};

export const calculateModuleStats = (modules: Module[]): ModuleStats => {
  return modules.reduce(
    (stats, module) => {
      stats.total++;
      if (module.status === "active") stats.active++;
      if (module.status === "beta") stats.beta++;
      stats.total_subscriptions += module.active_subscriptions || 0;
      stats.monthly_revenue += (module.base_price || 0) * (module.active_subscriptions || 0);
      return stats;
    },
    { total: 0, active: 0, beta: 0, total_subscriptions: 0, monthly_revenue: 0 }
  );
};

export const isModuleAvailableInRegion = (module: Module, region: string): boolean => {
  if (!module.available_regions || module.available_regions.length === 0) return true;
  return module.available_regions.includes(region);
};

export const formatModulePrice = (module: Module): string => {
  if (!module.base_price) return "Free";

  const price = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: module.currency || "USD",
  }).format(module.base_price);

  if (module.billing_model === "monthly") return `${price}/month`;
  if (module.billing_model === "usage_based") return `${price}/unit`;
  return price; // one_time
};

export const checkModuleDependencies = (module: Module, enabledModules: string[]): boolean => {
  if (!module.requires_modules || module.requires_modules.length === 0) return true;
  return module.requires_modules.every((req) => enabledModules.includes(req));
};

export const filterModulesByCategory = (modules: Module[], category: string): Module[] => {
  return modules.filter((m) => m.category === category);
};
