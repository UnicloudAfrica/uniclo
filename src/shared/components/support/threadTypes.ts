// Shared Thread/Support Types and Utilities
import { User, Building2, Users, Server, Flag, AlertTriangle } from "lucide-react";

// ========================================
// TYPES
// ========================================

export interface Thread {
  id: number;
  uuid: string;
  subject: string;
  status: "open" | "in_progress" | "pending" | "resolved" | "closed";
  priority?: "low" | "medium" | "high" | "critical";
  category?: string;
  escalation_level?: number;
  created_at: string;
  sla_response_due_at?: string;
  sla_resolution_due_at?: string;
  first_response_at: string | null;
  resolved_at: string | null;
  messages_count?: number;
  user?: { id: number; name: string; email: string };
  assignee?: { id: number; name: string };
  tenant?: { id: number; name: string };
  customer?: { name: string; email?: string };
  messages?: ThreadMessage[];
  escalations?: ThreadEscalation[];
  involved_users?: {
    admins: { id: number; name: string; email: string; role: string }[];
    users: { id: number; name: string; email: string; role: string }[];
  };
  customer_context?: {
    user: { id: number; name: string; email: string; phone?: string } | null;
    tenant: { id: number; name: string; identifier: string; created_at: string } | null;
  };
  last_read_message_id?: number | null;
  last_read_at?: string | null;
  rating?: {
    score: number;
    comment?: string;
    agent_scores?: Record<string, number>;
    created_at: string;
  };
}

export interface ThreadMessage {
  id: number;
  uuid: string;
  message?: string;
  body?: string;
  sender_type: "user" | "admin" | "system";
  is_internal?: boolean;
  created_at: string;
  user?: { id: number; name: string };
  sender?: { id: number; name: string; email?: string };
  admin?: { id: number; name: string; email?: string };
  attachments?: ThreadAttachment[];
}

export interface ThreadAttachment {
  id: number;
  url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  created_at?: string;
}

export interface ThreadEscalation {
  id: number;
  from_level: number;
  to_level: number;
  reason: string;
  auto_escalated: boolean;
  created_at: string;
}

export interface ThreadStats {
  total: number;
  by_status: Record<string, number>;
  sla_at_risk: number;
  by_escalation: Record<string, number>;
  escalation_levels: Record<number, string>;
}

export interface SlaStatus {
  response: {
    status: "on_track" | "at_risk" | "met" | "breached";
    due_at: string | null;
    met_at: string | null;
  };
  resolution: {
    status: "on_track" | "at_risk" | "met" | "breached";
    due_at: string | null;
    met_at: string | null;
  };
  escalation_level: number;
  escalation_label: string;
}

// ========================================
// ESCALATION CONFIGURATION
// ========================================

export const ESCALATION_LEVELS = {
  CLIENT: 0,
  TENANT: 1,
  ADMIN: 2,
  PROVIDER: 3,
} as const;

export const ESCALATION_CONFIG: Record<
  number,
  {
    label: string;
    icon: typeof User;
    color: string;
    bgColor: string;
  }
> = {
  0: { label: "Client", icon: User, color: "text-gray-500", bgColor: "bg-gray-100" },
  1: { label: "Tenant", icon: Building2, color: "text-blue-500", bgColor: "bg-blue-100" },
  2: { label: "Admin", icon: Users, color: "text-purple-500", bgColor: "bg-purple-100" },
  3: { label: "Provider", icon: Server, color: "text-red-500", bgColor: "bg-red-100" },
};

// ========================================
// STATUS & PRIORITY STYLES
// ========================================

export const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  open: { bg: "bg-blue-100", text: "text-blue-800" },
  in_progress: { bg: "bg-purple-100", text: "text-purple-800" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  resolved: { bg: "bg-green-100", text: "text-green-800" },
  closed: { bg: "bg-gray-100", text: "text-gray-600" },
};

export const PRIORITY_STYLES: Record<string, { color: string; icon: typeof Flag }> = {
  low: { color: "text-gray-500", icon: Flag },
  medium: { color: "text-blue-500", icon: Flag },
  high: { color: "text-orange-500", icon: Flag },
  critical: { color: "text-red-600", icon: Flag },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

export const formatThreadDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatThreadDate(dateString);
};

export const isSlaAtRisk = (thread: Thread): boolean => {
  if (thread.status === "resolved" || thread.status === "closed") return false;
  const now = new Date();
  if (
    !thread.first_response_at &&
    thread.sla_response_due_at &&
    new Date(thread.sla_response_due_at) < now
  )
    return true;
  if (
    !thread.resolved_at &&
    thread.sla_resolution_due_at &&
    new Date(thread.sla_resolution_due_at) < now
  )
    return true;
  return false;
};

export const isSlaBreached = (sla: SlaStatus): boolean => {
  return sla.response.status === "breached" || sla.resolution.status === "breached";
};

export const getSlaStatusColor = (status: string): string => {
  switch (status) {
    case "met":
      return "text-green-600";
    case "on_track":
      return "text-blue-600";
    case "at_risk":
      return "text-yellow-600";
    case "breached":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
};

export const getStatusClasses = (status: string): string => {
  const style = STATUS_STYLES[status] || STATUS_STYLES.open;
  return `${style.bg} ${style.text}`;
};

export const getPriorityClasses = (priority: string): string => {
  const style = PRIORITY_STYLES[priority] || PRIORITY_STYLES.medium;
  return style.color;
};
