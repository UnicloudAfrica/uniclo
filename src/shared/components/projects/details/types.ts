import type React from "react";
import { Project } from "@/types/project";

export interface ProjectDetailsResourceStats {
  vCPUs: number;
  ram: string;
  volumes: number;
  images: number;
  snapshots: number;
  ipPoolUsed: number;
  ipPoolTotal: number;
  edgeNetworkConnected?: boolean;
  edgeNetworkName?: string;
}

export type ProjectDetailsTabIcon = React.ElementType<{
  size?: number | string;
  className?: string;
}>;

export interface ProjectDetailsTab {
  id: string;
  label: string;
  icon?: ProjectDetailsTabIcon;
  content?: React.ReactNode;
  hidden?: boolean;
  tooltip?: string;
}

export interface ProjectDetailsLayoutProps {
  project: Project;
  resourceStats: ProjectDetailsResourceStats;
  tabs: ProjectDetailsTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  contentClassName?: string;
}
