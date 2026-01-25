import type { ComponentType } from "react";
import { Activity, AlertTriangle, CheckCircle, HardDrive } from "lucide-react";

export type ObjectStorageHeroCardKey = "total" | "active" | "provisioning" | "failed";

export interface ObjectStorageHeroCard {
  key: ObjectStorageHeroCardKey;
  label: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}

export interface ObjectStorageEmptyActionConfig {
  id: "standard" | "fastTrack" | "refresh";
  label: string;
  variant?: "primary" | "secondary";
}

export interface ObjectStoragePreset {
  title: string;
  description: string;
  hero: {
    badge: string;
    heading: string;
    copy: string;
    gradientClassName: string;
  };
  heroCards: ObjectStorageHeroCard[];
  planActions: {
    persona: "admin" | "tenant" | "client";
    enableFastTrack: boolean;
    standardLabel: string;
    fastTrackLabel?: string;
  };
  emptyState: {
    title: string;
    description: string;
    actions: ObjectStorageEmptyActionConfig[];
  };
  enableSiloActions: boolean;
}

export const objectStoragePresets: Record<"admin" | "tenant" | "client", ObjectStoragePreset> = {
  admin: {
    title: "Silo Storage",
    description:
      "Track tenant Silo Storage plans, approve fast-track requests, and oversee payment status.",
    hero: {
      badge: "Storage Ops",
      heading: "Approve, fast-track, and monitor tenant capacity",
      copy: "Keep Zadara accounts in sync, trigger payments, and react to provisioning issues before they impact customers.",
      gradientClassName: "from-[#050F2C] via-[#0F3B68] to-[#1E80F9]",
    },
    heroCards: [
      {
        key: "total",
        label: "Accounts",
        description: "Provisioned records",
        icon: HardDrive,
      },
      {
        key: "active",
        label: "Active",
        description: "Ready for requests",
        icon: CheckCircle,
      },
      {
        key: "provisioning",
        label: "Provisioning",
        description: "In-flight builds",
        icon: Activity,
      },
      {
        key: "failed",
        label: "Failed",
        description: "Action needed",
        icon: AlertTriangle,
      },
    ],
    planActions: {
      persona: "admin",
      enableFastTrack: true,
      standardLabel: "Process Silo Payment",
      fastTrackLabel: "Fast-track Provisioning",
    },
    emptyState: {
      title: "No Silo Storage accounts yet",
      description:
        "Create a plan or fast-track a tenant to provision their first Zadara Silo Storage account.",
      actions: [
        { id: "standard", label: "Process Silo Payment", variant: "primary" },
        { id: "fastTrack", label: "Fast-track tenant", variant: "secondary" },
      ],
    },
    enableSiloActions: true,
  },
  tenant: {
    title: "Silo Storage",
    description: "Review and manage Silo Storage accounts provisioned for your tenant.",
    hero: {
      badge: "Tenant Storage",
      heading: "Track your Silo Storage capacity in one place",
      copy: "Review provisioned accounts, monitor status, and request additional storage when needed.",
      gradientClassName: "from-[#050F2C] via-[#0B3264] to-[#1A6DD8]",
    },
    heroCards: [
      {
        key: "total",
        label: "Accounts",
        description: "Provisioned across your cloud",
        icon: HardDrive,
      },
      {
        key: "active",
        label: "Active",
        description: "Ready for uploads",
        icon: CheckCircle,
      },
    ],
    planActions: {
      persona: "tenant",
      enableFastTrack: false,
      standardLabel: "Provision Silo Storage",
    },
    emptyState: {
      title: "No Silo Storage accounts yet",
      description: "Request or provision a plan to get your first Silo Storage account.",
      actions: [
        { id: "standard", label: "Provision Silo Storage", variant: "primary" },
        { id: "refresh", label: "Refresh status", variant: "secondary" },
      ],
    },
    enableSiloActions: false,
  },
  client: {
    title: "Silo Storage",
    description:
      "Purchase Zadara-backed storage, review Silo usage, and refresh provisioning status.",
    hero: {
      badge: "Client Storage",
      heading: "Purchase, track, and scale your Silo Storage capacity",
      copy: "Keep Zadara orders aligned with tenant demand and jump into account details without leaving the console.",
      gradientClassName: "from-[#050F2C] via-[#0B3264] to-[#1A6DD8]",
    },
    heroCards: [
      {
        key: "total",
        label: "Accounts",
        description: "Provisioned across your cloud",
        icon: HardDrive,
      },
      {
        key: "active",
        label: "Active",
        description: "Ready for uploads",
        icon: CheckCircle,
      },
    ],
    planActions: {
      persona: "client",
      enableFastTrack: false,
      standardLabel: "Provision Silo Storage",
    },
    emptyState: {
      title: "No Silo Storage accounts yet",
      description: "Kick off a plan purchase to provision your first Zadara Silo Storage account.",
      actions: [
        { id: "standard", label: "Purchase Silo Storage", variant: "primary" },
        { id: "refresh", label: "Refresh status", variant: "secondary" },
      ],
    },
    enableSiloActions: false,
  },
};
