import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  UserPlus,
  Phone,
  Mail,
  Target,
  TrendingUp,
  Calendar,
  Filter,
  Search
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernStatsCard from "../components/ModernStatsCard";
import ModernTable from "../components/ModernTable";
import ModernButton from "../components/ModernButton";
import {
  useFetchLeads,
  useFetchLeadStats,
} from "../../hooks/adminHooks/leadsHook";
import CreateLead from "./leadComps/createLead";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const contentRef = useRef(null);
  const [isCreateLeadsModalVisible, setCreateLeadsModal] = useState(false);

  const openCreateLead = () => setCreateLeadsModal(true);
  const closeCreateLead = () => setCreateLeadsModal(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const { data: leads, isFetching: isLeadsFetching } = useFetchLeads();
  const { data: leadStats, isFetching: isLeadStatsFetching } =
    useFetchLeadStats();

  const totalPages = Math.ceil((leads?.length || 0) / itemsPerPage);
  const currentLeads = leads?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

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

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main
        ref={contentRef}
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 overflow-y-auto"
      >
        <div className="">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Leads</h2>

          {isLeadStatsFetching ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <ModernStatsCard
                title="Total Leads"
                value={leadStats?.message?.leads || 0}
                icon={<Users />}
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
                          return { icon: <UserPlus />, color: "info" };
                        case "contacted":
                          return { icon: <Phone />, color: "warning" };
                        case "qualified":
                          return { icon: <Target />, color: "success" };
                        case "proposal_sent":
                          return { icon: <Mail />, color: "primary" };
                        case "negotiating":
                          return { icon: <TrendingUp />, color: "warning" };
                        case "closed_won":
                          return { icon: <Target />, color: "success" };
                        case "closed_lost":
                          return { icon: <Users />, color: "error" };
                        default:
                          return { icon: <Users />, color: "info" };
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
                        description={`Leads in ${formatStatusForDisplay(status).toLowerCase()} stage`}
                      />
                    );
                  }
                )}
            </div>
          )}

          <ModernButton
            onClick={openCreateLead}
            variant="primary"
            size="lg"
            className="mb-6"
          >
            <UserPlus className="w-5 h-5" />
            Create New Lead
          </ModernButton>

          <ModernTable
            title="Leads Management"
            data={leads || []}
            loading={isLeadsFetching}
            columns={[
              {
                key: 'id',
                header: 'ID',
                render: (value, row, index) => index + 1
              },
              {
                key: 'name',
                header: 'Name',
                render: (_, row) => `${row.first_name} ${row.last_name}`
              },
              {
                key: 'email',
                header: 'Email'
              },
              {
                key: 'lead_type',
                header: 'Lead Type',
                render: (value) => (
                  <span className="capitalize">{value}</span>
                )
              },
              {
                key: 'status',
                header: 'Status',
                render: (value) => (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColorClass(value)}`}
                  >
                    {formatStatusForDisplay(value)}
                  </span>
                )
              },
              {
                key: 'source',
                header: 'Source',
                render: (value) => (
                  <span className="capitalize">{value}</span>
                )
              },
              {
                key: 'created_at',
                header: 'Created At',
                render: (value) => formatCreatedAt(value)
              }
            ]}
            actions={[
              {
                label: 'View Details',
                icon: <Eye size={16} />,
                onClick: (lead) => {
                  window.location.href = `/admin-dashboard/leads/details?name=${encodeURIComponent(
                    `${lead.first_name} ${lead.last_name}`
                  )}&id=${encodeId(lead.id)}`;
                }
              }
            ]}
            searchable={true}
            exportable={true}
            filterable={true}
            paginated={true}
            pageSize={itemsPerPage}
            emptyMessage="No leads found."
          />
        </div>
      </main>
      <CreateLead
        isOpen={isCreateLeadsModalVisible}
        onClose={closeCreateLead}
      />
    </>
  );
}
