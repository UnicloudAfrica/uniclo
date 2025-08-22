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
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import {
  useFetchLeadById,
  useConvertLeadToUser,
} from "../../hooks/adminHooks/leadsHook";
import EditLead from "./leadComps/editLead";
import AddLeadStage from "./leadComps/addLeadStage";
import { EditLeadStage } from "./leadComps/editLeadStage";
import AddLeadDocument from "./leadComps/addLeadDoc";
import UpdateLeadDoc from "./leadComps/updateLeadDoc";
import DocumentViewerModal from "./leadComps/documentViewer";
// import { DocumentViewerModal } from "./leadComps/documentViewer";

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
          onClick={() => onView(doc.file, doc.name)}
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
export default function AdminLeadDetails() {
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
    viewingFile: null,
    viewingFileName: null,
  });

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

  const handleGoBack = () => navigate("/admin-dashboard/leads");

  const handleConvertLead = () => {
    if (dataState.leadId) {
      convertLead(dataState.leadId);
    }
    updateUiState({ isActionsDropdownOpen: false });
  };

  const handleEditStage = (stage) => {
    updateDataState({ editingStage: stage });
    updateUiState({ isEditStageModalOpen: true });
  };

  const handleUpdateDoc = (doc) => {
    updateDataState({ editingDocument: doc });
    updateUiState({ isUpdateDocModalOpen: true });
  };

  const handleViewDoc = (fileUrl, fileName) => {
    updateDataState({
      viewingFile: fileUrl,
      viewingFileName: fileName,
    });
    updateUiState({ isViewerOpen: true });
  };

  const closeViewer = () => {
    updateDataState({
      viewingFile: null,
      viewingFileName: null,
    });
    updateUiState({ isViewerOpen: false });
  };

  // Loading state
  if (isFetching || dataState.leadId === null) {
    return (
      <>
        <AdminHeadbar
          onMenuClick={() =>
            updateUiState({ isMobileMenuOpen: !uiState.isMobileMenuOpen })
          }
        />
        <AdminSidebar
          isMobileMenuOpen={uiState.isMobileMenuOpen}
          onCloseMobileMenu={() => updateUiState({ isMobileMenuOpen: false })}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-700">Loading lead details...</p>
        </main>
      </>
    );
  }

  // Error state
  if (isError || !leadDetails) {
    return (
      <>
        <AdminHeadbar
          onMenuClick={() =>
            updateUiState({ isMobileMenuOpen: !uiState.isMobileMenuOpen })
          }
        />
        <AdminSidebar
          isMobileMenuOpen={uiState.isMobileMenuOpen}
          onCloseMobileMenu={() => updateUiState({ isMobileMenuOpen: false })}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-4">
            This lead couldn't be found.
          </p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back
          </button>
        </main>
      </>
    );
  }

  const {
    first_name,
    last_name,
    email,
    phone,
    source,
    status,
    lead_type,
    created_at,
    assigned_to,
    pricing_summary,
    country,
    notes,
    documents,
    follow_up_date,
    last_contacted_at,
    stages,
  } = leadDetails;

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : "N/A";
  };

  return (
    <>
      <AdminHeadbar
        onMenuClick={() =>
          updateUiState({ isMobileMenuOpen: !uiState.isMobileMenuOpen })
        }
      />
      <AdminSidebar
        isMobileMenuOpen={uiState.isMobileMenuOpen}
        onCloseMobileMenu={() => updateUiState({ isMobileMenuOpen: false })}
      />
      <AdminActiveTab />

      <main className="top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 relative">
        {/* Converting Overlay */}
        {isConverting && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-75 z-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-[#288DD1]" />
            <p className="mt-4 text-lg font-semibold text-gray-700">
              Converting Lead to User...
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={handleGoBack}
              className="p-2 mr-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-[#1E1E1E]">
              {first_name} {last_name || dataState.leadNameFromUrl || "N/A"}
            </h1>
          </div>

          {/* Actions Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() =>
                updateUiState({
                  isActionsDropdownOpen: !uiState.isActionsDropdownOpen,
                })
              }
              className="flex items-center px-4 py-2 bg-[#288DD1] text-white font-medium rounded-lg hover:bg-[#1976D2] transition-colors"
            >
              Actions <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            {uiState.isActionsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      updateUiState({
                        isEditLeadOpen: true,
                        isActionsDropdownOpen: false,
                      });
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4 mr-2" /> Edit Details
                  </button>
                  <button
                    onClick={() => {
                      updateDataState({ editingStage: null });
                      updateUiState({
                        isAddStageModalOpen: true,
                        isActionsDropdownOpen: false,
                      });
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Lead Stage
                  </button>
                  <button
                    onClick={handleConvertLead}
                    disabled={isConverting}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isConverting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <User className="w-4 h-4 mr-2" />
                    )}
                    {isConverting ? "Converting..." : "Convert to User"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Overview */}
        <div className="bg-white rounded-[12px] p-3 md:p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">
            Lead Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <DetailItem
              label="Full Name"
              value={`${first_name} ${last_name}`}
            />
            <DetailItem label="Email" value={email} />
            <DetailItem label="Phone" value={phone} />
            <DetailItem label="Source" value={source} />
            <DetailItem label="Country" value={country} />
            <DetailItem label="Lead Type" value={lead_type} />
            <DetailItem label="Created At" value={formatDate(created_at)} />
            <DetailItem
              label="Last Contacted At"
              value={formatDate(last_contacted_at)}
            />
            <DetailItem
              label="Follow Up Date"
              value={
                follow_up_date
                  ? new Date(follow_up_date).toLocaleDateString()
                  : "N/A"
              }
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-600">Status:</span>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Admin & Pricing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-[12px] p-3 md:p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Assigned Admin
            </h2>
            {assigned_to ? (
              <div className="text-sm space-y-2">
                <DetailItem
                  label="Name"
                  value={`${assigned_to.first_name} ${assigned_to.last_name}`}
                />
                <DetailItem label="Email" value={assigned_to.email} />
              </div>
            ) : (
              <p className="text-gray-500">Not Assigned</p>
            )}
          </div>

          <div className="bg-white rounded-[12px] p-3 md:p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-[#575758] mb-4">
              Pricing Breakdown
            </h2>
            {pricing_summary ? (
              <div className="text-sm space-y-2">
                <DetailItem
                  label="Total"
                  value={`${pricing_summary.total} ${pricing_summary.currency}`}
                />
                <div className="grid grid-cols-2 gap-3">
                  <DetailItem
                    label="Instances"
                    value={pricing_summary.instances}
                  />
                  <DetailItem label="Months" value={pricing_summary.months} />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No pricing information available.</p>
            )}
          </div>
        </div>

        {/* Stages */}
        <div className="bg-white rounded-[12px] p-3 md:p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Stages</h2>
          {stages && stages.length > 0 ? (
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 capitalize">
                      {formatStatusForDisplay(stage.name)}
                    </h3>
                    <button
                      onClick={() => handleEditStage(stage)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit Stage"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 italic mb-3">
                    {stage.description || "No description."}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 text-sm">
                    <DetailItem
                      label="Status"
                      value={formatStatusForDisplay(stage.status)}
                    />
                    <DetailItem
                      label="Started"
                      value={formatDate(stage.started_at)}
                    />
                    <DetailItem
                      label="Completed"
                      value={formatDate(stage.completed_at)}
                    />
                    <DetailItem
                      label="Assigned To"
                      value={
                        stage.assigned_to
                          ? `${stage.assigned_to.first_name} ${stage.assigned_to.last_name}`
                          : "N/A"
                      }
                    />
                  </div>

                  {/* Stage Documents */}
                  <div>
                    <h5 className="text-md font-semibold text-gray-700 mb-2">
                      Documents for this Stage:
                    </h5>
                    {stage.documents && stage.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stage.documents.map((doc) => (
                          <DocumentItem
                            key={doc.id}
                            doc={doc}
                            onUpdate={handleUpdateDoc}
                            onView={handleViewDoc}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No documents for this stage.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No stages have been added for this lead.
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-[12px] p-3 md:p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-[#575758] mb-4">Notes</h2>
          {notes && notes.length > 0 ? (
            <div className="space-y-3">
              {notes.split("\n\n").map((note, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-gray-500 mr-2 mt-1">&bull;</span>
                  <p className="text-gray-900 leading-relaxed">
                    {note.trim() || "No content for this note."}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No notes available.</p>
          )}
        </div>

        {/* Documents */}
        <div className="bg-white rounded-[12px] p-3 md:p-6 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#575758]">Documents</h2>
            <button
              onClick={() => updateUiState({ isAddDocOpen: true })}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Add Document
            </button>
          </div>
          {documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <DocumentItem
                  key={doc.id}
                  doc={doc}
                  onUpdate={handleUpdateDoc}
                  onView={handleViewDoc}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No documents found for this lead.
            </p>
          )}
        </div>
      </main>

      {/* Modals */}
      <EditLead
        isOpen={uiState.isEditLeadOpen}
        onClose={() => updateUiState({ isEditLeadOpen: false })}
        lead={leadDetails}
      />
      <AddLeadStage
        isOpen={uiState.isAddStageModalOpen}
        onClose={() => updateUiState({ isAddStageModalOpen: false })}
        initialStage={dataState.editingStage}
      />
      <EditLeadStage
        isOpen={uiState.isEditStageModalOpen}
        onClose={() => updateUiState({ isEditStageModalOpen: false })}
        stage={dataState.editingStage}
        lead={leadDetails}
      />
      <AddLeadDocument
        isOpen={uiState.isAddDocOpen}
        onClose={() => updateUiState({ isAddDocOpen: false })}
        lead={leadDetails}
      />
      <UpdateLeadDoc
        isOpen={uiState.isUpdateDocModalOpen}
        onClose={() => updateUiState({ isUpdateDocModalOpen: false })}
        leadId={dataState.leadId}
        document={dataState.editingDocument}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={uiState.isViewerOpen}
        onClose={closeViewer}
        fileUrl={dataState.viewingFile}
        fileName={dataState.viewingFileName}
      />
    </>
  );
}
