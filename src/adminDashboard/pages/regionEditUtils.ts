import { Server, Database, Globe } from "lucide-react";

export const statusOptions = [
  { value: "healthy", label: "Healthy" },
  { value: "degraded", label: "Degraded" },
  { value: "down", label: "Down" },
];

export const statusToneMap: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> =
  {
    healthy: "success",
    degraded: "warning",
    down: "danger",
  };

export const statusLabelMap: Record<string, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
};

export const formatSegment = (value: any) => {
  if (!value) return "";
  return value
    .toString()
    .split(/[_-]/)
    .filter(Boolean)
    .map((segment: any) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
};

// Service icons
export const SERVICE_ICONS: Record<string, any> = {
  compute: Server,
  object_storage: Database,
  network: Globe,
};
