import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  AlertTriangle,
  ArrowLeft,
  Edit,
  User,
  FileText,
  Eye,
  PlusCircle,
  ChevronDown,
  X,
  Download,
  ExternalLink,
} from "lucide-react";
import Sidebar from "../components/clientSidebar";
import HeaderBar from "../components/clientHeadbar";
import BreadcrumbNav from "../components/clientAciveTab";
import {
  useFetchLeadById,
  useConvertLeadToUser,
} from "../../hooks/tenantHooks/leadsHook";
import DocumentViewerModal from "../../dashboard/pages/leadComps/documentViewer";

const formatStatusForDisplay = (status) => {
  return status?.replace(/_/g, " ") || "N/A";
};

// DetailItem Component
const DetailItem = ({ label, value, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900 capitalize">{value || "N/A"}</span>
  </div>
);

// Document Item Component
const DocumentItem = ({ doc, onUpdate, onView }) => (
  <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center min-w-0 flex-1">
        <FileText className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-800 truncate">
          {doc.name}
        </span>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={() => onView(doc)}
          className="text-gray-600 hover:text-gray-800 transition-colors"
          title="View Document"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => onUpdate(doc)}
          className="text-green-600 hover:text-green-800 transition-colors"
          title="Update Document"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
      <div>
        <span className="font-medium">Status:</span>{" "}
        <span className="capitalize">{formatStatusForDisplay(doc.status)}</span>
      </div>
      <div>
        <span className="font-medium">Type:</span>{" "}
        <span className="capitalize">
          {formatStatusForDisplay(doc.document_type)}
        </span>
      </div>
      <div className="col-span-2">
        <span className="font-medium">Uploaded By:</span>{" "}
        {doc.uploaded_by?.first_name && doc.uploaded_by?.last_name
          ? `${doc.uploaded_by.first_name} ${doc.uploaded_by.last_name}`
          : doc.uploaded_by || "N/A"}
      </div>
    </div>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusColorClass = (status) => {
    const statusColors = {
      new: "bg-blue-100 text-blue-800",
      contacted: "bg-yellow-100 text-yellow-800",
      qualified: "bg-green-100 text-green-800",
      proposal_sent: "bg-indigo-100 text-indigo-800",
      negotiating: "bg-purple-100 text-purple-800",
      closed_won: "bg-emerald-100 text-emerald-800",
      closed_lost: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColorClass(
        status
      )}`}
    >
      {formatStatusForDisplay(status)}
    </span>
  );
};

// Main Component
export default function TenantLeadDetails() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State management
  const [uiState, setUiState] = useState({
    isMobileMenuOpen: false,
    isEditLeadOpen: false,
    isAddDocOpen: false,
    isAddStageModalOpen: false,
    isEditStageModalOpen: false,
    isActionsDropdownOpen: false,
    isUpdateDocModalOpen: false,
    isViewerOpen: false,
  });

  const [dataState, setDataState] = useState({
    leadId: null,
    leadNameFromUrl: "",
    editingStage: null,
    editingDocument: null,
    viewingDocument: null,
  });

  const [activeTab, setActiveTab] = useState("leads");

  // Dummy tenant data for consistency
  const tenantData = {
    name: "Your Organization",
    logo: "",
    color: "#288DD1",
  };

  // Extract URL parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedId = params.get("id");
    const nameFromUrl = params.get("name");

    if (encodedId) {
      try {
        const decodedId = atob(decodeURIComponent(encodedId));
        setDataState((prev) => ({ ...prev, leadId: decodedId }));
      } catch (error) {
        console.error("Failed to decode lead ID:", error);
        setDataState((prev) => ({ ...prev, leadId: null }));
      }
    }
    if (nameFromUrl) {
      setDataState((prev) => ({
        ...prev,
        leadNameFromUrl: decodeURIComponent(nameFromUrl),
      }));
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUiState((prev) => ({ ...prev, isActionsDropdownOpen: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hooks
  const {
    data: leadDetails,
    isFetching,
    isError,
  } = useFetchLeadById(dataState.leadId);
  const { mutate: convertLead, isPending: isConverting } =
    useConvertLeadToUser();

  // UI Handlers
  const updateUiState = (updates) => {
    setUiState((prev) => ({ ...prev, ...updates }));
  };

  const updateDataState = (updates) => {
    setDataState((prev) => ({ ...prev, ...updates }));
  };

  const handleGoBack = () => navigate("/tenant-dashboard/leads");

  const handleConvertLead = () => {
    if (dataState.leadId) {
      convertLead(dataState.leadId, {
        onSuccess: () => {
          navigate("/tenant-dashboard/leads");
        },
        onError: (error) => {
          console.error("Conversion failed:", error);
        },
      });
    }
  };

  const toggleMobileMenu = () => {
    setUiState((prev) => ({ ...prev, isMobileMenuOpen: !prev.isMobileMenuOpen }));
  };

  const closeMobileMenu = () => {
    setUiState((prev) => ({ ...prev, isMobileMenuOpen: false }));
  };

  const formatCreatedAt = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!dataState.leadId) {
    return (
      <>
        <Sidebar
          tenantData={tenantData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={uiState.isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
        <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
        <main className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Invalid Lead ID
              </h2>
              <p className="text-gray-600 mb-4">
                The lead ID provided is invalid or missing.
              </p>
              <button
                onClick={handleGoBack}
                className="bg-[#288DD1] text-white px-6 py-2 rounded-[30px] hover:bg-[#1976D2] transition-colors"
              >
                Back to Leads
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (isFetching) {
    return (
      <>
        <Sidebar
          tenantData={tenantData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={uiState.isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
        <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
        <main className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900">
                Loading Lead Details...
              </h2>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (isError || !leadDetails) {
    return (
      <>
        <Sidebar
          tenantData={tenantData}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={uiState.isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
        <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
        <main className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Error Loading Lead
              </h2>
              <p className="text-gray-600 mb-4">
                Failed to load lead details. Please try again.
              </p>
              <button
                onClick={handleGoBack}
                className="bg-[#288DD1] text-white px-6 py-2 rounded-[30px] hover:bg-[#1976D2] transition-colors"
              >
                Back to Leads
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar
        tenantData={tenantData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMobileMenuOpen={uiState.isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <HeaderBar tenantData={tenantData} onMenuClick={toggleMobileMenu} />
      <BreadcrumbNav tenantData={tenantData} activeTab={activeTab} />
      <main className="dashboard-content-shell p-6 md:p-8 overflow-y-auto">
        <div className="max-w-8xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="text-gray-600 hover:text-gray-800 transition-colors"
                title="Back to Leads"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {leadDetails.first_name} {leadDetails.last_name}
                </h1>
                <p className="text-gray-600">{leadDetails.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <StatusBadge status={leadDetails.status} />
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    updateUiState({
                      isActionsDropdownOpen: !uiState.isActionsDropdownOpen,
                    })
                  }
                  className="flex items-center space-x-2 bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span>Actions</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {uiState.isActionsDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          updateUiState({
                            isEditLeadOpen: true,
                            isActionsDropdownOpen: false,
                          });
                        }}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Lead</span>
                      </button>
                      <button
                        onClick={() => {
                          handleConvertLead();
                          updateUiState({ isActionsDropdownOpen: false });
                        }}
                        disabled={isConverting}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left text-green-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <User className="w-4 h-4" />
                        <span>
                          {isConverting ? "Converting..." : "Convert to Client"}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Lead Information Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-4">
                <DetailItem label="Full Name" value={`${leadDetails.first_name} ${leadDetails.last_name}`} />
                <DetailItem label="Email" value={leadDetails.email} />
                <DetailItem label="Phone" value={leadDetails.phone} />
                <DetailItem label="Company" value={leadDetails.company} />
                <DetailItem label="Country" value={leadDetails.country} />
              </div>
            </div>

            {/* Lead Details */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Lead Details
              </h3>
              <div className="space-y-4">
                <DetailItem label="Lead Type" value={leadDetails.lead_type} />
                <DetailItem label="Status" value={formatStatusForDisplay(leadDetails.status)} />
                <DetailItem label="Source" value={leadDetails.source} />
                <DetailItem label="Assigned To" value={leadDetails.assigned_to || "Unassigned"} />
                <DetailItem label="Created At" value={formatCreatedAt(leadDetails.created_at)} />
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Notes
              </h3>
              <div className="text-gray-700">
                {leadDetails.notes || "No notes available"}
              </div>
            </div>
          </div>

          {/* Lead Stages */}
          {leadDetails.lead_stages && leadDetails.lead_stages.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lead Stages</h3>
                <button
                  onClick={() => updateUiState({ isAddStageModalOpen: true })}
                  className="flex items-center space-x-2 bg-[#288DD1] text-white px-4 py-2 rounded-lg hover:bg-[#1976D2] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Stage</span>
                </button>
              </div>
              <div className="space-y-4">
                {leadDetails.lead_stages.map((stage, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 capitalize">
                        {formatStatusForDisplay(stage.stage_name)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${stage.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : stage.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                          {formatStatusForDisplay(stage.status)}
                        </span>
                        <button
                          onClick={() => {
                            updateDataState({ editingStage: stage });
                            updateUiState({ isEditStageModalOpen: true });
                          }}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2">{stage.description}</p>
                    <div className="text-xs text-gray-500">
                      <span>Assigned to: </span>
                      <span>{stage.assigned_to || "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {leadDetails.documents && leadDetails.documents.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                <button
                  onClick={() => updateUiState({ isAddDocOpen: true })}
                  className="flex items-center space-x-2 bg-[#288DD1] text-white px-4 py-2 rounded-lg hover:bg-[#1976D2] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Document</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leadDetails.documents.map((doc, index) => (
                  <DocumentItem
                    key={index}
                    doc={doc}
                    onUpdate={(document) => {
                      updateDataState({ editingDocument: document });
                      updateUiState({ isUpdateDocModalOpen: true });
                    }}
                    onView={(document) => {
                      updateDataState({ viewingDocument: document });
                      updateUiState({ isViewerOpen: true });
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <DocumentViewerModal
        isOpen={uiState.isViewerOpen}
        onClose={() => {
          updateDataState({ viewingDocument: null });
          updateUiState({ isViewerOpen: false });
        }}
        document={dataState.viewingDocument}
      />
    </>
  );
}
