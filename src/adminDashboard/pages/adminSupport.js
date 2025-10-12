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
  User
} from "lucide-react";
import TicketDrawer from "./supportComps/ticketDrawer";
import { useFetchAdminSupportMessages } from "../../hooks/adminHooks/adminSupportHooks";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import { designTokens } from "../../styles/designTokens";

export default function AdminSupportTicket() {
  const [isStartConvoOpen, setStartConvo] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: supportTickets, isFetching: isSupportTicketsFetching } =
    useFetchAdminSupportMessages();

  // Calculate ticket statistics
  const ticketStats = {
    totalTickets: supportTickets?.length || 0,
    openTickets: supportTickets?.filter(ticket => ticket.status === 'open').length || 0,
    closedTickets: supportTickets?.filter(ticket => ticket.status === 'closed').length || 0,
    pendingTickets: supportTickets?.filter(ticket => ticket.status === 'pending').length || 0
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

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

  // Define columns for ModernTable
  const columns = [
    {
      key: 'id',
      header: 'Ticket ID',
      render: (value) => (
        <div className="flex items-center gap-2">
          <MessageSquare size={16} style={{ color: designTokens.colors.primary[500] }} />
          <span className="font-mono font-medium">#{value}</span>
        </div>
      )
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (value) => (
        <div className="max-w-xs truncate">
          <span className="font-medium" title={value}>{value}</span>
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'updated_at',
      header: 'Updated',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock size={14} style={{ color: designTokens.colors.neutral[500] }} />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => {
        const statusConfig = {
          'open': {
            bg: designTokens.colors.success[50],
            text: designTokens.colors.success[700],
            border: designTokens.colors.success[200],
            icon: CheckCircle
          },
          'closed': {
            bg: designTokens.colors.neutral[50],
            text: designTokens.colors.neutral[700],
            border: designTokens.colors.neutral[200],
            icon: XCircle
          },
          'pending': {
            bg: designTokens.colors.warning[50],
            text: designTokens.colors.warning[700],
            border: designTokens.colors.warning[200],
            icon: AlertCircle
          }
        };
        const config = statusConfig[value] || statusConfig['pending'];
        const Icon = config.icon;
        
        return (
          <div className="flex items-center gap-2">
            <Icon size={16} style={{ color: config.text }} />
            <span 
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`
              }}
            >
              {value}
            </span>
          </div>
        );
      }
    }
  ];

  // Define actions for ModernTable
  const actions = [
    {
      icon: <EyeIcon size={16} />,
      label: '',
      onClick: (ticket) => openTicketDrawer(ticket)
    }
  ];

  if (isSupportTicketsFetching) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8 flex items-center justify-center flex-col">
          <Loader2 
            className="w-8 h-8 animate-spin" 
            style={{ color: designTokens.colors.primary[500] }}
          />
          <p className="ml-2 mt-2" style={{ color: designTokens.colors.neutral[700] }}>
            Loading support tickets...
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main 
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-2xl font-bold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Support Tickets
              </h1>
              <p 
                className="mt-1 text-sm"
                style={{ color: designTokens.colors.neutral[600] }}
              >
                Monitor and manage customer support requests
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <ModernStatsCard
              title="Total Tickets"
              value={ticketStats.totalTickets}
              icon={<MessageSquare size={24} />}
              change={5}
              trend="up"
              color="primary"
              description="All support tickets"
            />
            <ModernStatsCard
              title="Open Tickets"
              value={ticketStats.openTickets}
              icon={<CheckCircle size={24} />}
              color="success"
              description="Currently active"
            />
            <ModernStatsCard
              title="Pending Tickets"
              value={ticketStats.pendingTickets}
              icon={<Clock size={24} />}
              color="warning"
              description="Awaiting response"
            />
            <ModernStatsCard
              title="Closed Tickets"
              value={ticketStats.closedTickets}
              icon={<XCircle size={24} />}
              color="info"
              description="Resolved tickets"
            />
          </div>

          {/* Support Tickets Table */}
          <ModernCard>
            <ModernTable
              title="Support Tickets"
              data={supportTickets || []}
              columns={columns}
              actions={actions}
              searchable={true}
              filterable={true}
              exportable={true}
              sortable={true}
              loading={isSupportTicketsFetching}
              onRowClick={(ticket) => openTicketDrawer(ticket)}
              emptyMessage="No support tickets found. Customer support requests will appear here."
            />
          </ModernCard>
        </div>
      </main>
      {/* <StartModalConversation isOpen={isStartConvoOpen} onClose={closeConvo} /> */}
      <TicketDrawer
        isOpen={isDrawerOpen}
        onClose={closeTicketDrawer}
        ticket={selectedTicket}
      />
    </>
  );
}
