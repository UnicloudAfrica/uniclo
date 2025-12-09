// @ts-nocheck
import React, { useState } from "react";
import {
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  ArrowUpCircle,
  Shield,
  Building,
  Cloud,
  Timer,
  AlertTriangle,
  TrendingUp,
  Filter,
} from "lucide-react";
// @ts-ignore
import TicketDrawer from "./supportComps/ticketDrawer";
import { useFetchAdminSupportMessages } from "../../hooks/adminHooks/adminSupportHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import { ModernButton } from "../../shared/components/ui";
import ModernTable from "../../shared/components/ui/ModernTable";
import { designTokens } from "../../styles/designTokens";

// ═══════════════════════════════════════════════════════════════════
// ESCALATION LEVEL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const ESCALATION_LEVELS: Record<
  number,
  { label: string; color: string; bgColor: string; borderColor: string; icon: any }
> = {
  0: { label: "Client", color: "#3B82F6", bgColor: "#EFF6FF", borderColor: "#BFDBFE", icon: User },
  1: {
    label: "Tenant",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
    icon: Building,
  },
  2: {
    label: "UniCloud",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    borderColor: "#DDD6FE",
    icon: Shield,
  },
  3: {
    label: "Provider",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    borderColor: "#FECACA",
    icon: Cloud,
  },
};

const PRIORITY_CONFIG: Record<string, { color: string; bgColor: string; borderColor: string }> = {
  low: { color: "#6B7280", bgColor: "#F9FAFB", borderColor: "#E5E7EB" },
  medium: { color: "#3B82F6", bgColor: "#EFF6FF", borderColor: "#BFDBFE" },
  high: { color: "#F59E0B", bgColor: "#FFFBEB", borderColor: "#FDE68A" },
  critical: { color: "#EF4444", bgColor: "#FEF2F2", borderColor: "#FECACA" },
};

const SLA_STATUS: Record<string, { color: string; bgColor: string; label: string }> = {
  on_track: { color: "#10B981", bgColor: "#D1FAE5", label: "On Track" },
  at_risk: { color: "#F59E0B", bgColor: "#FEF3C7", label: "At Risk" },
  breached: { color: "#EF4444", bgColor: "#FEE2E2", label: "Breached" },
  met: { color: "#3B82F6", bgColor: "#DBEAFE", label: "Met" },
};

interface SupportTicket {
  id: string | number;
  uuid?: string;
  subject: string;
  created_at: string;
  updated_at: string;
  status: "open" | "closed" | "pending" | "in_progress" | "resolved";
  escalation_level?: number;
  priority?: "low" | "medium" | "high" | "critical";
  sla_response_due_at?: string;
  sla_resolution_due_at?: string;
  first_response_at?: string;
  resolved_at?: string;
  category?: string;
  assigned_to_id?: number;
}

// ═══════════════════════════════════════════════════════════════════
// SLA TIMER COMPONENT
// ═══════════════════════════════════════════════════════════════════

const SlaTimer: React.FC<{ dueAt?: string; metAt?: string; label: string }> = ({
  dueAt,
  metAt,
  label,
}: any) => {
  if (!dueAt) return <span className="text-xs text-gray-400">—</span>;

  const now = new Date();
  const due = new Date(dueAt);

  if (metAt) {
    const met = new Date(metAt);
    const success = met <= due;
    return (
      <div className="flex items-center gap-1">
        {success ? (
          <CheckCircle size={12} className="text-green-500" />
        ) : (
          <XCircle size={12} className="text-red-500" />
        )}
        <span className={`text-xs ${success ? "text-green-600" : "text-red-600"}`}>
          {success ? "Met" : "Missed"}
        </span>
      </div>
    );
  }

  const diff = due.getTime() - now.getTime();
  if (diff <= 0) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100">
        <AlertTriangle size={12} className="text-red-500" />
        <span className="text-xs font-medium text-red-600">Breached</span>
      </div>
    );
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  const isUrgent = hours < 2;
  const isAtRisk = hours < 4 && hours >= 2;

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
        isUrgent ? "bg-red-100" : isAtRisk ? "bg-yellow-100" : "bg-green-100"
      }`}
    >
      <Timer
        size={12}
        className={isUrgent ? "text-red-500" : isAtRisk ? "text-yellow-600" : "text-green-500"}
      />
      <span
        className={`text-xs font-medium ${
          isUrgent ? "text-red-600" : isAtRisk ? "text-yellow-700" : "text-green-600"
        }`}
      >
        {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// ESCALATION LEVEL BADGE
// ═══════════════════════════════════════════════════════════════════

const EscalationBadge: React.FC<{ level: number }> = ({ level }: any) => {
  const config = ESCALATION_LEVELS[level] || ESCALATION_LEVELS[0];
  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      <Icon size={12} />
      <span>{config.label}</span>
      {level > 0 && <ArrowUpCircle size={10} className="opacity-60" />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PRIORITY BADGE
// ═══════════════════════════════════════════════════════════════════

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }: any) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium capitalize"
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        border: `1px solid ${config.borderColor}`,
      }}
    >
      {priority}
    </span>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

export default function AdminSupportTicket() {
  const [isStartConvoOpen, setStartConvo] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [filterLevel, setFilterLevel] = useState<number | "all">("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");

  const { data: supportTickets = [], isFetching: isSupportTicketsFetching } =
    useFetchAdminSupportMessages();

  // Calculate stats with escalation info
  const ticketStats = {
    totalTickets: supportTickets.length,
    openTickets: supportTickets.filter((t: SupportTicket) => t.status === "open").length,
    escalatedTickets: supportTickets.filter((t: SupportTicket) => (t.escalation_level || 0) > 0)
      .length,
    criticalTickets: supportTickets.filter((t: SupportTicket) => t.priority === "critical").length,
    slaBreach: supportTickets.filter((t: SupportTicket) => {
      if (!t.sla_response_due_at || t.first_response_at) return false;
      return new Date(t.sla_response_due_at) < new Date();
    }).length,
  };

  // Filter tickets
  const filteredTickets = supportTickets.filter((ticket: SupportTicket) => {
    if (filterLevel !== "all" && (ticket.escalation_level || 0) !== filterLevel) return false;
    if (filterPriority !== "all" && ticket.priority !== filterPriority) return false;
    return true;
  });

  const openConvo = () => setStartConvo(true);
  const closeConvo = () => setStartConvo(false);

  const openTicketDrawer = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const closeTicketDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedTicket(null), 300);
  };

  const formatDate = (isoString: string) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const columns = [
    {
      key: "id",
      header: "Ticket",
      sortable: true,
      render: (_: any, ticket: SupportTicket) => (
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-mono font-medium text-sm">#{String(ticket.id).slice(-6)}</span>
        </div>
      ),
    },
    {
      key: "escalation_level",
      header: "Level",
      sortable: true,
      render: (value: number) => <EscalationBadge level={value || 0} />,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (value: string) => <PriorityBadge priority={value || "medium"} />,
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (value: string) => (
        <div className="max-w-[200px] truncate">
          <span className="font-medium text-sm" title={value}>
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "sla_response",
      header: "Response SLA",
      render: (_: any, ticket: SupportTicket) => (
        <SlaTimer
          dueAt={ticket.sla_response_due_at}
          metAt={ticket.first_response_at}
          label="Response"
        />
      ),
    },
    {
      key: "sla_resolution",
      header: "Resolution SLA",
      render: (_: any, ticket: SupportTicket) => (
        <SlaTimer
          dueAt={ticket.sla_resolution_due_at}
          metAt={ticket.resolved_at}
          label="Resolution"
        />
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: string) => {
        const statusConfig: Record<string, any> = {
          open: { bg: "#FEF3C7", text: "#D97706", icon: AlertCircle },
          in_progress: { bg: "#DBEAFE", text: "#2563EB", icon: Clock },
          pending: { bg: "#F3F4F6", text: "#6B7280", icon: Clock },
          resolved: { bg: "#D1FAE5", text: "#059669", icon: CheckCircle },
          closed: { bg: "#F3F4F6", text: "#6B7280", icon: XCircle },
        };
        const config = statusConfig[value] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div className="flex items-center gap-1.5">
            <Icon size={14} style={{ color: config.text }} />
            <span
              className="px-2 py-0.5 text-xs font-medium capitalize rounded"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {value?.replace("_", " ")}
            </span>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value: string) => <span className="text-xs text-gray-500">{formatDate(value)}</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (_: any, ticket: SupportTicket) => (
        <button
          onClick={() => openTicketDrawer(ticket)}
          className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all"
          title="View Ticket"
        >
          <Eye size={16} />
        </button>
      ),
    },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminPageShell
        title="Support Tickets"
        description="Manage support requests with SLA tracking and escalation workflow"
        actions={
          <ModernButton onClick={openConvo} className="flex items-center gap-2">
            <MessageSquare size={16} />
            New Ticket
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <ModernStatsCard
            title="Total Tickets"
            value={ticketStats.totalTickets}
            icon={<MessageSquare size={24} />}
            color="primary"
            description="All requests"
          />
          <ModernStatsCard
            title="Open"
            value={ticketStats.openTickets}
            icon={<AlertCircle size={24} />}
            color="warning"
            description="Awaiting response"
          />
          <ModernStatsCard
            title="Escalated"
            value={ticketStats.escalatedTickets}
            icon={<TrendingUp size={24} />}
            color="info"
            description="Above client level"
          />
          <ModernStatsCard
            title="Critical"
            value={ticketStats.criticalTickets}
            icon={<AlertTriangle size={24} />}
            color="error"
            description="High priority"
          />
          <ModernStatsCard
            title="SLA Breached"
            value={ticketStats.slaBreach}
            icon={<Timer size={24} />}
            color={ticketStats.slaBreach > 0 ? "error" : "success"}
            description="Response overdue"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-600">Filter:</span>

          <select
            value={filterLevel === "all" ? "all" : String(filterLevel)}
            onChange={(e) =>
              setFilterLevel(e.target.value === "all" ? "all" : Number(e.target.value))
            }
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="0">Client</option>
            <option value="1">Tenant</option>
            <option value="2">UniCloud Admin</option>
            <option value="3">Provider</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Table */}
        <ModernTable
          data={filteredTickets}
          columns={columns as any}
          title="All Tickets"
          searchable
          searchKeys={["subject", "id"]}
          loading={isSupportTicketsFetching}
          emptyMessage="No support tickets found"
        />
      </AdminPageShell>

      {isStartConvoOpen && <TicketDrawer isOpen={isStartConvoOpen} onClose={closeConvo} />}

      {isDrawerOpen && selectedTicket && (
        <TicketDrawer isOpen={isDrawerOpen} onClose={closeTicketDrawer} ticket={selectedTicket} />
      )}
    </>
  );
}
