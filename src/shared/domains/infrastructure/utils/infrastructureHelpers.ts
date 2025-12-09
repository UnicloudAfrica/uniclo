/**
 * Infrastructure Helper Utilities
 */

import type { VPC, VPCStatus, Subnet, InfrastructureStats } from "../types/infrastructure.types";

export const getVPCStatusVariant = (status: VPCStatus) => {
  switch (status) {
    case "available":
      return {
        label: "Available",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "pending":
      return { label: "Pending", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" };
    case "deleting":
      return { label: "Deleting", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" };
    case "deleted":
      return { label: "Deleted", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    default:
      return { label: "Unknown", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
  }
};

export const isValidCIDR = (cidr: string): boolean => {
  const cidrRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}\/[0-9]{1,2}$/;
  if (!cidrRegex.test(cidr)) return false;

  const [ip, prefix] = cidr.split("/");
  const parts = ip.split(".").map(Number);

  // Validate IP octets
  if (parts.some((p) => p < 0 || p > 255)) return false;

  // Validate prefix
  const prefixNum = parseInt(prefix);
  if (prefixNum < 0 || prefixNum > 32) return false;

  return true;
};

export const calculateAvailableIPs = (cidrBlock: string): number => {
  const prefix = parseInt(cidrBlock.split("/")[1]);
  return Math.pow(2, 32 - prefix) - 5; // AWS reserves 5 IPs
};

export const isSubnetInVPC = (subnetCIDR: string, vpcCIDR: string): boolean => {
  // Simple check - in production, use proper IP library
  const subnetPrefix = parseInt(subnetCIDR.split("/")[1]);
  const vpcPrefix = parseInt(vpcCIDR.split("/")[1]);

  return subnetPrefix >= vpcPrefix;
};

export const formatCIDR = (cidr: string): string => {
  const availableIPs = calculateAvailableIPs(cidr);
  return `${cidr} (${availableIPs.toLocaleString()} IPs)`;
};

export const getSubnetTypeIcon = (type: string): string => {
  return type === "public" ? "🌐" : "🔒";
};

export const calculateInfraStats = (
  vpcs: VPC[],
  subnets: Subnet[],
  securityGroups: any[],
  others: any = {}
): InfrastructureStats => {
  return {
    vpcs: vpcs.length,
    subnets: subnets.length,
    security_groups: securityGroups.length,
    internet_gateways: others.igws?.length || 0,
    route_tables: others.routeTables?.length || 0,
    elastic_ips: others.eips?.length || 0,
    network_interfaces: others.enis?.length || 0,
  };
};

export const filterByVPC = <T extends { vpc_id?: string }>(items: T[], vpcId: string): T[] => {
  return items.filter((item) => item.vpc_id === vpcId);
};
