import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Loader2,
  Users,
  UserPlus,
  Phone,
  Mail,
  Target,
<<<<<<< HEAD
  TrendingUp,
  Calendar,
  Filter,
  Search,
=======
  TrendingUp
>>>>>>> b587e2a (web)
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import ModernCard from "../components/ModernCard";
import {
  useFetchLeads,
  useFetchLeadStats,
} from "../../hooks/adminHooks/leadsHook";
import AdminPageShell from "../components/AdminPageShell";

const formatCreatedAt = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const encodeId = (id) => {
  return encodeURIComponent(btoa(id));
};

// Helper function to format the status string for display
const formatStatusForDisplay = (status) => {
  return status.replace(/_/g, " ");
};

export default function AdminLeads() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSegment, setActiveSegment] = useState("all");
  const itemsPerPage = 10;
  const contentRef = useRef(null);
  const navigate = useNavigate();

  const openCreateLead = () => navigate("/admin-dashboard/leads/create");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const { data: leads = [], isFetching: isLeadsFetching } = useFetchLeads();
  const { data: leadStats, isFetching: isLeadStatsFetching } =
    useFetchLeadStats();

  const leadsByStatus = useMemo(
    () => leadStats?.message?.leads_by_status || {},
    [leadStats]
  );
  const totalLeadCount = leadStats?.message?.leads ?? leads.length;

  const filteredLeads = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    if (activeSegment === "all") {
      return leads;
    }
    return leads.filter((lead) => lead.status === activeSegment);
  }, [leads, activeSegment]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeSegment]);

  const getStatusColorClass = (status) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "contacted":
        return "bg-yellow-100 text-yellow-800";
      case "qualified":
        return "bg-green-100 text-green-800";
      case "proposal_sent":
        return "bg-indigo-100 text-indigo-800";
      case "negotiating":
        return "bg-purple-100 text-purple-800";
      case "closed_won":
        return "bg-emerald-100 text-emerald-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const headerActions = (
    <ModernButton
      onClick={openCreateLead}
      variant="primary"
      size="lg"
      className="inline-flex items-center gap-2"
    >
      <UserPlus className="w-5 h-5" />
      Create New Lead
    </ModernButton>
  );

  const leadSegments = useMemo(() => {
    const baseSegments = [
      { id: "all", label: "All leads", count: totalLeadCount },
      { id: "new", label: "New", count: leadsByStatus.new ?? 0 },
      { id: "contacted", label: "Contacted", count: leadsByStatus.contacted ?? 0 },
      { id: "qualified", label: "Qualified", count: leadsByStatus.qualified ?? 0 },
      { id: "proposal_sent", label: "Proposal Sent", count: leadsByStatus.proposal_sent ?? 0 },
      { id: "negotiating", label: "Negotiating", count: leadsByStatus.negotiating ?? 0 },
      { id: "closed_won", label: "Closed Won", count: leadsByStatus.closed_won ?? 0 },
      { id: "closed_lost", label: "Closed Lost", count: leadsByStatus.closed_lost ?? 0 },
    ];
    return baseSegments.filter(Boolean);
  }, [leadsByStatus, totalLeadCount]);

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        ref={contentRef}
        title="Leads"
        description="Monitor lead acquisition and pipeline performance"
        actions={headerActions}
        contentClassName="space-y-8 overflow-y-auto"
      >
<<<<<<< HEAD
        <div className="">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leads</h2>
=======
        <ModernCard className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Pipeline overview
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Manage people segments
              </h2>
              <p className="text-sm text-gray-500">
                Filter the funnel to focus on specific lead stages and outcomes.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Live pipeline
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {leadSegments.map((segment) => {
              const isActive = activeSegment === segment.id;
              return (
                <button
                  key={segment.id}
                  type="button"
                  onClick={() => setActiveSegment(segment.id)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-cyan-200 hover:text-cyan-700",
                  ].join(" ")}
                >
                  <span>{segment.label}</span>
                  <span
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                      isActive ? "bg-cyan-100 text-cyan-700" : "bg-gray-100 text-gray-600",
                    ].join(" ")}
                  >
                    {segment.count}
                  </span>
                </button>
              );
            })}
          </div>
        </ModernCard>

        <div className="space-y-8">
>>>>>>> b587e2a (web)
          {isLeadStatsFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <ModernStatsCard
                title="Total Leads"
                value={leadStats?.message?.leads || 0}
                icon={<Users width={20} height={20} />}
                color="primary"
                trend="neutral"
                description="All leads in the system"
              />
              {leadStats?.message?.leads_by_status &&
                Object.entries(leadStats?.message.leads_by_status).map(
                  ([status, count], index) => {
                    const getStatusConfig = (status) => {
                      switch (status) {
                        case "new":
                          return { icon: <UserPlus />, color: "primary" };
                        case "contacted":
                          return { icon: <Phone />, color: "primary" };
                        case "qualified":
                          return { icon: <Target />, color: "primary" };
                        case "proposal_sent":
                          return { icon: <Mail />, color: "primary" };
                        case "negotiating":
                          return { icon: <TrendingUp />, color: "primary" };
                        case "closed_won":
                          return { icon: <Target />, color: "primary" };
                        case "closed_lost":
                          return { icon: <Users />, color: "error" };
                        default:
                          return { icon: <Users />, color: "primary" };
                      }
                    };

                    const config = getStatusConfig(status);

                    return (
                      <ModernStatsCard
                        key={status}
                        title={`${formatStatusForDisplay(status)} Leads`}
                        value={count}
                        icon={config.icon}
                        color={config.color}
                        trend="neutral"
                        description={`Leads in ${formatStatusForDisplay(
                          status
                        ).toLowerCase()} stage`}
                      />
                    );
                  }
                )}
            </div>
          )}
<<<<<<< HEAD

          <button
            onClick={openCreateLead}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base mb-6"
          >
            Create New Lead
          </button>
=======
>>>>>>> b587e2a (web)
          <ModernTable
            title="Leads Management"
            data={filteredLeads}
            loading={isLeadsFetching}
            columns={[
              {
                key: "id",
                header: "ID",
                render: (value, row, index) => index + 1,
              },
              {
                key: "name",
                header: "Name",
                render: (_, row) => `${row.first_name} ${row.last_name}`,
              },
              {
                key: "email",
                header: "Email",
              },
              {
                key: "lead_type",
                header: "Lead Type",
                render: (value) => <span className="capitalize">{value}</span>,
              },
              {
                key: "status",
                header: "Status",
                render: (value) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColorClass(
                      value
                    )}`}
                  >
                    {formatStatusForDisplay(value)}
                  </span>
                ),
              },
              {
                key: "source",
                header: "Source",
                render: (value) => <span className="capitalize">{value}</span>,
              },
              {
                key: "created_at",
                header: "Created At",
                render: (value) => formatCreatedAt(value),
              },
            ]}
            actions={[
              {
                label: "View Details",
                icon: <Eye size={16} />,
                onClick: (lead) => {
                  window.location.href = `/admin-dashboard/leads/details?name=${encodeURIComponent(
                    `${lead.first_name} ${lead.last_name}`
                  )}&id=${encodeId(lead.id)}`;
                },
              },
            ]}
            searchable={true}
            exportable={true}
            filterable={true}
            paginated={true}
            pageSize={itemsPerPage}
            emptyMessage="No leads found."
          />
        </div>
      </AdminPageShell>
    </>
  );
}
