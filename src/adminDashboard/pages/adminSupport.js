import React, { useState } from "react";
import {
  EyeIcon,
  Loader2,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
} from "lucide-react";
import TicketDrawer from "./supportComps/ticketDrawer";
import { useFetchAdminSupportMessages } from "../../hooks/adminHooks/adminSupportHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";

export default function AdminSupportTicket() {
  const [isStartConvoOpen, setStartConvo] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: supportTickets = [], isFetching: isSupportTicketsFetching } =
    useFetchAdminSupportMessages();

  const isInitialLoading =
    isSupportTicketsFetching && supportTickets.length === 0;

  const ticketStats = {
    totalTickets: supportTickets.length,
    openTickets: supportTickets.filter((ticket) => ticket.status === "open").length,
    closedTickets: supportTickets.filter((ticket) => ticket.status === "closed").length,
    pendingTickets: supportTickets.filter((ticket) => ticket.status === "pending").length,
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const openConvo = () => setStartConvo(true);
  const closeConvo = () => setStartConvo(false);

  const openTicketDrawer = (ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  const closeTicketDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedTicket(null), 300);
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const columns = [
    {
      key: "id",
      header: "Ticket ID",
      render: (value) => (
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-mono font-medium">#{value}</span>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      render: (value) => (
        <div className="max-w-xs truncate">
          <span className="font-medium" title={value}>
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "updated_at",
      header: "Updated",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (value) => {
        const statusConfig = {
          open: {
            bg: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
            border: designTokens.colors.success[200],
            icon: CheckCircle,
          },
          closed: {
            bg: designTokens.colors.neutral[50],
            text: designTokens.colors.neutral[700],
            border: designTokens.colors.neutral[200],
            icon: XCircle,
          },
          pending: {
            bg: designTokens.colors.warning[50],
            text: designTokens.colors.warning[700],
            border: designTokens.colors.warning[200],
            icon: AlertCircle,
          },
        };
        const config = statusConfig[value] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: config.text }} />
            <span
              className="px-3 py-1 text-xs font-medium capitalize"
              style={{
                borderRadius: 9999,
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`,
              }}
            >
              {value}
            </span>
          </div>
        );
      },
    },
  ];

  const actions = [
    {
      icon: <EyeIcon size={16} />,
      label: "",
      onClick: (ticket) => openTicketDrawer(ticket),
    },
  ];

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Support Tickets"
        description="Monitor and manage customer support requests."
        actions={
          <ModernButton onClick={openConvo} className="flex items-center gap-2">
            <User size={16} />
            Start Conversation
          </ModernButton>
        }
        contentClassName="space-y-6"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ModernStatsCard
            title="Total Tickets"
            value={ticketStats.totalTickets}
            icon={<MessageSquare size={24} />}
            color="primary"
            description="All logged requests"
          />
          <ModernStatsCard
            title="Open Tickets"
            value={ticketStats.openTickets}
            icon={<AlertCircle size={24} />}
            color="warning"
            description="Awaiting response"
          />
          <ModernStatsCard
            title="Pending"
            value={ticketStats.pendingTickets}
            icon={<Clock size={24} />}
            color="info"
            description="In progress"
          />
          <ModernStatsCard
            title="Closed"
            value={ticketStats.closedTickets}
            icon={<CheckCircle size={24} />}
            color="success"
            description="Resolved cases"
          />
        </div>

        <ModernCard>
          {isInitialLoading ? (
            <div className="flex h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2
                className="h-6 w-6 animate-spin"
                style={{ color: designTokens.colors.primary[500] }}
              />
              <span>Loading support tickets…</span>
            </div>
          ) : (
            <ModernTable
              title="Recent Tickets"
              data={supportTickets}
              columns={columns}
              actions={actions}
              searchable
              filterable
              exportable
              sortable
              loading={isSupportTicketsFetching}
              emptyMessage="No support tickets found"
            />
          )}
        </ModernCard>
      </AdminPageShell>

      {isStartConvoOpen && (
        <TicketDrawer
          isOpen={isStartConvoOpen}
          onClose={closeConvo}
          mode="new"
        />
      )}

      {isDrawerOpen && selectedTicket && (
        <TicketDrawer
          isOpen={isDrawerOpen}
          onClose={closeTicketDrawer}
          selectedTicket={selectedTicket}
        />
      )}
    </>
  );
}
