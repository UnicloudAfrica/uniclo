import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ChevronDown,
  Edit,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  User,
  UserCheck,
  Building,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import ModernCard from "../leads/components/ModernCard";
import ModernButton from "../leads/components/ModernButton";
import {
  useFetchLeadById,
  useConvertLeadToUser,
} from "../../hooks/tenantHooks/leadsHook";
import EditLead from "./leadComps/editLead";
import AddLeadStage from "./leadComps/addLeadStage";
import { EditLeadStage } from "./leadComps/editLeadStage";
import AddLeadDocument from "./leadComps/addLeadDoc";
import UpdateLeadDoc from "./leadComps/updateLeadDoc";
import DocumentViewerModal from "./leadComps/documentViewer";
import ToastUtils from "../../utils/toastUtil";

const formatStatusForDisplay = (status) =>
  status?.replace(/_/g, " ") || "N/A";

const DetailItem = ({ label, value, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-900 capitalize">{value || "N/A"}</span>
  </div>
);

const DocumentItem = ({ doc, onUpdate, onView }) => (
  <div className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center min-w-0 flex-1">
        <ExternalLink className="w-5 h-5 text-gray-500 mr-2 flex-shrink-0" />
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
          <ExternalLink className="w-4 h-4" />
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

const StatusBadge = ({ status }) => {
  const statusColors = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-yellow-100 text-yellow-800",
    qualified: "bg-green-100 text-green-800",
    proposal_sent: "bg-indigo-100 text-indigo-800",
    negotiating: "bg-purple-100 text-purple-800",
    closed_won: "bg-emerald-100 text-emerald-800",
    closed_lost: "bg-red-100 text-red-800",
  };
  const className = statusColors[status] || "bg-gray-100 text-gray-800";
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${className}`}
    >
      {formatStatusForDisplay(status)}
    </span>
  );
};

const DashboardLeadDetails = () => {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [uiState, setUiState] = useState({
    isActionsDropdownOpen: false,
    isEditLeadOpen: false,
    isAddDocOpen: false,
    isAddStageModalOpen: false,
    isEditStageModalOpen: false,
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUiState((prev) => ({ ...prev, isActionsDropdownOpen: false }));
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const {
    data: leadDetails,
    isFetching,
    isError,
  } = useFetchLeadById(dataState.leadId);
  const { mutate: convertLead, isPending: isConverting } =
    useConvertLeadToUser();

  const updateUiState = (updates) =>
    setUiState((prev) => ({ ...prev, ...updates }));
  const updateDataState = (updates) =>
    setDataState((prev) => ({ ...prev, ...updates }));

  const handleGoBack = () => navigate("/dashboard/leads");

  const handleConvertLead = () => {
    if (dataState.leadId) {
      convertLead(dataState.leadId, {
        onSuccess: () => {
          ToastUtils.success("Lead converted to user successfully.");
        },
        onError: (error) => {
          ToastUtils.error(error?.message || "Failed to convert lead.");
        },
      });
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

  const handleViewDoc = (document) => {
    updateDataState({ viewingDocument: document });
    updateUiState({ isViewerOpen: true });
  };

  const closeViewer = () => {
    updateDataState({ viewingDocument: null });
    updateUiState({ isViewerOpen: false });
  };

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleString() : "N/A";

  const headerActions = (
    <div className="flex items-center gap-3">
      <ModernButton variant="outline" size="sm" onClick={handleGoBack}>
        <ArrowLeft className="w-4 h-4" />
        Back
      </ModernButton>
      <div className="relative" ref={dropdownRef}>
        <ModernButton
          onClick={() =>
            updateUiState({
              isActionsDropdownOpen: !uiState.isActionsDropdownOpen,
            })
          }
          variant="primary"
        >
          Actions <ChevronDown className="w-4 h-4 ml-2" />
        </ModernButton>
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
  );

  if (isFetching || dataState.leadId === null) {
    return (
      <TenantPageShell
        title="Lead details"
        description="Loading partner lead information..."
        subHeaderContent={headerActions}
        contentClassName="p-6 md:p-8 flex items-center justify-center"
      >
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-6 h-6 animate-spin text-[--theme-color]" />
          <span>Loading lead details...</span>
        </div>
      </TenantPageShell>
    );
  }

  if (isError || !leadDetails) {
    return (
      <TenantPageShell
        title="Lead details"
        description="Unable to load this lead."
        subHeaderContent={headerActions}
        contentClassName="p-6 md:p-8 flex flex-col items-center justify-center text-center gap-4"
      >
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p className="text-lg font-semibold text-gray-700">
          This lead could not be found.
        </p>
        <ModernButton onClick={handleGoBack} variant="primary" size="lg">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to leads
        </ModernButton>
      </TenantPageShell>
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

  const fullName =
    `${first_name || ""} ${last_name || ""}`.trim() ||
    dataState.leadNameFromUrl ||
    "Lead";

  return (
    <TenantPageShell
      title={fullName}
      description="Review and manage this partner lead."
      subHeaderContent={headerActions}
      contentClassName="space-y-8 relative"
    >
      {isConverting && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-[--theme-color]" />
          <p className="mt-3 text-base font-medium text-gray-700">
            Converting lead to user...
          </p>
        </div>
      )}

      <ModernCard title="Lead Overview" className="mb-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">
                    {first_name || "—"} {last_name || ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{email || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{phone || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium capitalize">{country || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Lead Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Lead Type</p>
                  <p className="font-medium capitalize">{lead_type || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ExternalLink className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium capitalize">{source || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4" />
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <StatusBadge status={status} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Timeline
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Last Contacted</p>
                  <p className="font-medium">{formatDate(last_contacted_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Follow Up Date</p>
                  <p className="font-medium">
                    {follow_up_date
                      ? new Date(follow_up_date).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModernCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ModernCard title="Assigned Admin">
          {assigned_to ? (
            <div className="text-sm space-y-2">
              <DetailItem
                label="Name"
                value={`${assigned_to.first_name} ${assigned_to.last_name}`}
              />
              <DetailItem label="Email" value={assigned_to.email} />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Not assigned yet.</p>
          )}
        </ModernCard>

        <ModernCard title="Pricing Breakdown">
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
            <p className="text-gray-500 text-sm">
              No pricing information captured.
            </p>
          )}
        </ModernCard>
      </div>

      <ModernCard title="Stages" className="mb-2">
        {stages && stages.length > 0 ? (
          <div className="space-y-4">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="border-l-4 border-blue-500 pl-4 py-2 space-y-4"
              >
                <div className="flex items-center justify-between">
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
                <p className="text-sm text-gray-600 italic">
                  {stage.description || "No description provided."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
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

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Documents for this stage
                  </h4>
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
                    <p className="text-sm text-gray-500">
                      No documents uploaded for this stage.
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
      </ModernCard>

      <ModernCard title="Notes">
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
          <p className="text-gray-500 text-sm">No internal notes recorded.</p>
        )}
      </ModernCard>

      <ModernCard
        title="Documents"
        actions={
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => updateUiState({ isAddDocOpen: true })}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Document
          </ModernButton>
        }
      >
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
            No documents uploaded for this lead.
          </p>
        )}
      </ModernCard>

      <EditLead
        isOpen={uiState.isEditLeadOpen}
        onClose={() => updateUiState({ isEditLeadOpen: false })}
        lead={leadDetails}
      />
      <AddLeadStage
        isOpen={uiState.isAddStageModalOpen}
        onClose={() => updateUiState({ isAddStageModalOpen: false })}
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
        document={dataState.editingDocument}
      />
      <DocumentViewerModal
        isOpen={uiState.isViewerOpen}
        onClose={closeViewer}
        document={dataState.viewingDocument}
      />
    </TenantPageShell>
  );
};

export default DashboardLeadDetails;
